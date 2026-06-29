import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import { config } from "./config/env.js";
import { User } from "./models/User.js";
import { getContentPayload } from "./services/contentPackCache.js";
import {
  clearSocketRoom,
  createPlayer,
  deletePrivateRoom,
  deleteRoom,
  dequeuePublicPlayer,
  enqueuePublicPlayer,
  findRoomBySocketId,
  getPrivateRoomId,
  getRoom,
  removePlayerFromQueues,
  saveRoom,
  setPrivateRoom
} from "./services/multiplayerStore.js";
import { acquireRedisLock, getRedisClient, releaseRedisLock } from "./services/redisClient.js";

const GAME_TYPES = ["wordle", "andazebi", "mix"];
const MAX_WORDLE_ATTEMPTS = 6;
const MAX_ANDAZEBI_ATTEMPTS = 8;
const MAX_RAW_GUESS_LENGTH = 120;
const MAX_ANDAZEBI_GUESS_LENGTH = 80;

async function configureSocketAdapter(io) {
  const pubClient = await getRedisClient();

  if (!pubClient) {
    return;
  }

  const { createAdapter } = await import("@socket.io/redis-adapter");
  const subClient = pubClient.duplicate();
  await subClient.connect();
  io.adapter(createAdapter(pubClient, subClient));
  console.log("[Socket] Redis adapter enabled");
}

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function generatePasscode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function generateUniquePasscode() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const passcode = generatePasscode();

    if (!(await getPrivateRoomId(passcode))) {
      return passcode;
    }
  }

  throw new Error("Could not allocate private room passcode");
}

function createRoom({ gameType, passcode = null, players, roomId = generateId() }) {
  return {
    actualType: null,
    answer: null,
    finished: [],
    gameType,
    guesses: {},
    passcode,
    players,
    puzzle: null,
    roomId,
    roundIndex: 0,
    roundResults: [],
    scores: {},
    totalRounds: gameType === "mix" ? 3 : 1
  };
}

function getOpponent(room, socket) {
  return room.players.find((player) => player.socketId !== socket.id) ?? null;
}

function getPlayer(room, socket) {
  return room.players.find((player) => player.socketId === socket.id) ?? null;
}

function publicPlayer(player) {
  return {
    displayName: player.displayName,
    id: player.userId,
    username: player.username
  };
}

async function socketExists(io, socketId) {
  const sockets = await io.in(socketId).fetchSockets();
  return sockets.length > 0;
}

async function joinSocketToRoom(io, socketId, roomId) {
  await io.in(socketId).socketsJoin(roomId);
}

async function acquireRoomLock(roomId) {
  return acquireRedisLock(`multiplayer:room-lock:${roomId}`, 5000);
}

function scoreWordleGuess(guess, answer) {
  const result = Array(answer.length).fill("absent");
  const answerChars = [...answer];
  const guessChars = [...guess];

  for (let i = 0; i < guessChars.length; i++) {
    if (guessChars[i] === answerChars[i]) {
      result[i] = "correct";
      answerChars[i] = null;
      guessChars[i] = null;
    }
  }

  for (let i = 0; i < guessChars.length; i++) {
    if (guessChars[i] === null) {
      continue;
    }

    const idx = answerChars.indexOf(guessChars[i]);

    if (idx !== -1) {
      result[i] = "present";
      answerChars[idx] = null;
    }
  }

  return result;
}

export function normalizeGuessInput(guess, room) {
  if (!guess || typeof guess !== "string") {
    return { error: "Invalid guess" };
  }

  if (guess.length > MAX_RAW_GUESS_LENGTH) {
    return { error: "Guess is too long" };
  }

  const normalizedGuess = guess.trim().toLocaleLowerCase("ka-GE");

  if (!normalizedGuess) {
    return { error: "Invalid guess" };
  }

  if (room.actualType === "wordle") {
    const expectedLength = Array.from(String(room.answer ?? "")).length;

    if (Array.from(normalizedGuess).length !== expectedLength) {
      return { error: `Guess must be ${expectedLength} letters` };
    }
  } else if (normalizedGuess.length > MAX_ANDAZEBI_GUESS_LENGTH) {
    return { error: "Guess is too long" };
  }

  return { normalizedGuess };
}

async function pickPuzzle(gameType, roundIndex = 0) {
  let actualType = gameType;

  if (gameType === "mix") {
    actualType = roundIndex % 2 === 0 ? "wordle" : "andazebi";
  }

  const payload = await getContentPayload(actualType).catch(() => null);

  if (!payload) {
    return null;
  }

  if (actualType === "wordle") {
    const answers = payload.answers ?? payload.words ?? [];

    if (answers.length === 0) {
      return null;
    }

    const answer = answers[Math.floor(Math.random() * answers.length)];
    const validWords = payload.validWords ?? payload.valid ?? answers;

    return {
      actualType: "wordle",
      answer,
      puzzle: { gameType: "wordle", validWords, wordLength: answer.length }
    };
  }

  const items = payload.items ?? payload.proverbs ?? [];

  if (items.length === 0) {
    return null;
  }

  const item = items[Math.floor(Math.random() * items.length)];
  const answer = item.answer ?? item.text ?? item;

  return {
    actualType: "andazebi",
    answer: typeof answer === "string" ? answer : String(answer),
    puzzle: {
      gameType: "andazebi",
      hint: item.hint ?? item.category ?? null,
      prompt: item.prompt ?? item.display ?? item.masked ?? null,
      wordLength: typeof answer === "string" ? answer.length : undefined
    }
  };
}

async function startGame(io, roomId) {
  const room = await getRoom(roomId);

  if (!room || room.players.length < 2) {
    return;
  }

  const puzzleData = await pickPuzzle(room.gameType, room.roundIndex);

  if (!puzzleData) {
    io.to(roomId).emit("error-message", { message: "Failed to load puzzle data" });
    await deleteRoom(roomId);
    return;
  }

  room.answer = puzzleData.answer;
  room.actualType = puzzleData.actualType;
  room.puzzle = puzzleData.puzzle;
  room.guesses = {};
  room.finished = [];

  if (room.gameType === "mix") {
    room.roundResults[room.roundIndex] = [];
  }

  room.players.forEach((player) => {
    room.guesses[player.userId] = [];
  });

  await saveRoom(room);

  io.to(roomId).emit("game-start", {
    gameType: puzzleData.actualType,
    puzzle: puzzleData.puzzle,
    roomId,
    roundIndex: room.roundIndex,
    totalRounds: room.totalRounds
  });
}

async function startNextMixRound(io, roomId) {
  const room = await getRoom(roomId);

  if (!room) {
    return;
  }

  room.roundIndex += 1;
  await saveRoom(room);
  await startGame(io, roomId);
}

async function findLiveOpponent(io, gameType, currentSocketId) {
  while (true) {
    const opponent = await dequeuePublicPlayer(gameType, currentSocketId);

    if (!opponent) {
      return null;
    }

    if (await socketExists(io, opponent.socketId)) {
      return opponent;
    }

    await clearSocketRoom(opponent.socketId);
  }
}

export async function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(",").map((o) => o.trim()).filter(Boolean),
      methods: ["GET", "POST"]
    }
  });

  await configureSocketAdapter(io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const payload = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(payload.sub);

      if (!user) {
        return next(new Error("Authentication required"));
      }

      socket.user = user;
      next();
    } catch {
      next(new Error("Authentication required"));
    }
  });

  io.on("connection", (socket) => {
    socket.join("global-chat");
    socket.lastChatAt = 0;

    socket.on("chat-send", ({ text }) => {
      if (!text || typeof text !== "string") return;
      const msg = text.trim().slice(0, 200);
      if (!msg) return;

      const now = Date.now();
      if (now - socket.lastChatAt < 2000) {
        socket.emit("error-message", { message: "Too many messages. Please wait." });
        return;
      }
      socket.lastChatAt = now;

      io.to("global-chat").emit("chat-message", {
        displayName: socket.user.displayName,
        id: generateId(),
        text: msg,
        timestamp: now,
        userId: socket.user._id.toString(),
        username: socket.user.username
      });
    });

    socket.on("profile-update", async ({ equippedItems }) => {
      const found = await findRoomBySocketId(socket.id);
      if (!found) return;
      const opponent = getOpponent(found.room, socket);
      if (!opponent) return;

      try {
        const freshUser = await User.findById(socket.user._id).lean();
        io.to(opponent.socketId).emit("opponent-profile", {
          displayName: socket.user.displayName,
          equippedItems: freshUser?.equippedItems ?? equippedItems,
          username: socket.user.username
        });
      } catch {
        io.to(opponent.socketId).emit("opponent-profile", {
          displayName: socket.user.displayName,
          equippedItems,
          username: socket.user.username
        });
      }
    });

    socket.on("join-public-queue", async ({ gameType }) => {
      if (!GAME_TYPES.includes(gameType)) {
        return socket.emit("error-message", { message: "Invalid game type" });
      }

      await removePlayerFromQueues(socket.id);

      const currentPlayer = createPlayer(socket);
      const opponent = await findLiveOpponent(io, gameType, socket.id);

      if (!opponent) {
        await enqueuePublicPlayer(gameType, currentPlayer);
        socket.emit("queue-joined", { gameType });
        return;
      }

      const room = createRoom({
        gameType,
        players: [opponent, currentPlayer]
      });

      await saveRoom(room);
      await Promise.all(room.players.map((player) => joinSocketToRoom(io, player.socketId, room.roomId)));

      io.to(room.roomId).emit("match-found", {
        players: room.players.map(publicPlayer),
        roomId: room.roomId
      });

      await startGame(io, room.roomId);
    });

    socket.on("leave-queue", async () => {
      await removePlayerFromQueues(socket.id);
      socket.emit("queue-left");
    });

    socket.on("create-private-room", async ({ gameType }) => {
      if (!GAME_TYPES.includes(gameType)) {
        return socket.emit("error-message", { message: "Invalid game type" });
      }

      const room = createRoom({
        gameType,
        passcode: await generateUniquePasscode(),
        players: [createPlayer(socket)]
      });

      await saveRoom(room);
      await setPrivateRoom(room.passcode, room.roomId);
      await joinSocketToRoom(io, socket.id, room.roomId);

      socket.emit("room-created", { passcode: room.passcode, roomId: room.roomId });
    });

    socket.on("join-private-room", async ({ passcode }) => {
      const safePasscode = String(passcode ?? "").trim();

      if (!/^\d{4}$/.test(safePasscode)) {
        return socket.emit("error-message", { message: "Room not found" });
      }

      const roomId = await getPrivateRoomId(safePasscode);

      if (!roomId) {
        return socket.emit("error-message", { message: "Room not found" });
      }

      const lock = await acquireRoomLock(roomId);

      if (!lock.acquired) {
        return socket.emit("error-message", { message: "Room is busy. Try again." });
      }

      try {
        const room = await getRoom(roomId);

        if (!room) {
          await deletePrivateRoom(safePasscode);
          return socket.emit("error-message", { message: "Room not found" });
        }

        if (room.players.length >= 2) {
          return socket.emit("error-message", { message: "Room is full" });
        }

        const currentPlayer = createPlayer(socket);

        if (room.players.some((player) => player.userId === currentPlayer.userId)) {
          return socket.emit("error-message", { message: "Already in this room" });
        }

        room.players.push(currentPlayer);
        await saveRoom(room);
        await deletePrivateRoom(safePasscode);
        await joinSocketToRoom(io, socket.id, roomId);

        io.to(roomId).emit("room-joined", {
          players: room.players.map(publicPlayer),
          roomId
        });

        await startGame(io, roomId);
      } finally {
        await releaseRedisLock(`multiplayer:room-lock:${roomId}`, lock.token);
      }
    });

    socket.on("submit-guess", async ({ guess }) => {
      const found = await findRoomBySocketId(socket.id);

      if (!found) {
        return socket.emit("error-message", { message: "Not in a game room" });
      }

      const { roomId } = found;
      const lock = await acquireRoomLock(roomId);

      if (!lock.acquired) {
        return socket.emit("error-message", { message: "Room is busy. Try again." });
      }

      try {
        const room = await getRoom(roomId);

        if (!room) {
          return socket.emit("error-message", { message: "Not in a game room" });
        }

        const player = getPlayer(room, socket);

        if (!player) {
          return socket.emit("error-message", { message: "Not in a game room" });
        }

      if (room.finished.includes(player.userId)) {
        return socket.emit("error-message", { message: "Game already finished for you" });
      }

      const normalized = normalizeGuessInput(guess, room);

      if (normalized.error) {
        return socket.emit("error-message", { message: normalized.error });
      }

      const { normalizedGuess } = normalized;
      const playerGuesses = room.guesses[player.userId] ?? [];
      let isCorrect = false;

      if (room.actualType === "wordle") {
        const validWords = new Set(
          (room.puzzle?.validWords ?? []).map((word) => String(word).trim().toLocaleLowerCase("ka-GE"))
        );

        if (validWords.size > 0 && !validWords.has(normalizedGuess)) {
          return socket.emit("error-message", { message: "Not a valid word" });
        }

        const tiles = scoreWordleGuess(normalizedGuess, String(room.answer).toLocaleLowerCase("ka-GE"));
        isCorrect = tiles.every((tile) => tile === "correct");

        playerGuesses.push({ guess: normalizedGuess, tiles });
        room.guesses[player.userId] = playerGuesses;

        socket.emit("guess-result", {
          attempt: playerGuesses.length,
          guess: normalizedGuess,
          isCorrect,
          tiles
        });

        const opponent = getOpponent(room, socket);
        if (opponent) {
          io.to(opponent.socketId).emit("opponent-guess", {
            attempt: playerGuesses.length,
            tiles
          });
        }
      } else {
        isCorrect = normalizedGuess === String(room.answer).toLocaleLowerCase("ka-GE");

        playerGuesses.push({ correct: isCorrect, guess: normalizedGuess });
        room.guesses[player.userId] = playerGuesses;

        socket.emit("guess-result", {
          attempt: playerGuesses.length,
          guess: normalizedGuess,
          isCorrect
        });

        const opponent = getOpponent(room, socket);
        if (opponent) {
          io.to(opponent.socketId).emit("opponent-guess", {
            attempt: playerGuesses.length,
            isCorrect
          });
        }
      }

      const maxAttempts = room.actualType === "wordle" ? MAX_WORDLE_ATTEMPTS : MAX_ANDAZEBI_ATTEMPTS;

      if (isCorrect || playerGuesses.length >= maxAttempts) {
        room.finished.push(player.userId);
        const result = isCorrect ? "won" : "lost";

        if (room.gameType === "mix") {
          room.roundResults[room.roundIndex].push({
            attempts: playerGuesses.length,
            playerId: player.userId,
            result
          });

          if (result === "won") {
            room.scores[player.userId] = (room.scores[player.userId] ?? 0) + 1;
          }
        }

        socket.emit("game-over", {
          answer: room.answer,
          attempts: playerGuesses.length,
          result,
          roundIndex: room.roundIndex
        });

        const opponent = getOpponent(room, socket);

        if (opponent && room.finished.includes(opponent.userId)) {
          if (room.gameType === "mix") {
            const roundResults = room.roundResults[room.roundIndex];

            if (room.roundIndex + 1 < room.totalRounds) {
              io.to(roomId).emit("mix-round-over", {
                roundIndex: room.roundIndex,
                roundResults,
                scores: room.scores
              });
              setTimeout(() => {
                startNextMixRound(io, roomId);
              }, 3000);
            } else {
              io.to(roomId).emit("mix-game-over", {
                roundResults: room.roundResults,
                scores: room.scores
              });
            }
          }
        } else if (opponent) {
          io.to(opponent.socketId).emit("opponent-finished", {
            attempts: playerGuesses.length,
            result
          });
        }
      }

      await saveRoom(room);
      } finally {
        await releaseRedisLock(`multiplayer:room-lock:${roomId}`, lock.token);
      }
    });

    socket.on("disconnect", async () => {
      await removePlayerFromQueues(socket.id);

      const found = await findRoomBySocketId(socket.id);

      if (!found) {
        return;
      }

      const { roomId, room } = found;
      const opponent = getOpponent(room, socket);

      if (opponent) {
        io.to(opponent.socketId).emit("opponent-disconnected", {
          message: "Your opponent has disconnected"
        });

        if (!room.finished.includes(opponent.userId) && room.answer) {
          io.to(opponent.socketId).emit("game-over", {
            answer: room.answer,
            attempts: 0,
            result: "won"
          });

          if (room.gameType === "mix") {
            io.to(roomId).emit("mix-game-over", {
              roundResults: room.roundResults,
              scores: { [opponent.userId]: (room.scores[opponent.userId] ?? 0) + 1 }
            });
          }
        }
      }

      await deleteRoom(roomId);
    });
  });

  return io;
}

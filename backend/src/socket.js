import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import { config } from "./config/env.js";
import { User } from "./models/User.js";
import { ContentPack } from "./models/ContentPack.js";

const rooms = new Map(); 
const publicQueue = new Map(); 
const privateRooms = new Map(); 

const MAX_WORDLE_ATTEMPTS = 6;
const MAX_ANDAZEBI_ATTEMPTS = 8;

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function generatePasscode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function removeFromQueue(socket) {
  for (const [gameType, queue] of publicQueue.entries()) {
    const idx = queue.indexOf(socket);

    if (idx !== -1) {
      queue.splice(idx, 1);

      if (queue.length === 0) {
        publicQueue.delete(gameType);
      }

      return;
    }
  }
}

function findRoomBySocket(socket) {
  for (const [roomId, room] of rooms.entries()) {
    if (room.players.includes(socket)) {
      return { roomId, room };
    }
  }

  return null;
}

function getOpponent(room, socket) {
  return room.players.find((s) => s !== socket) ?? null;
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

async function pickPuzzle(gameType, roundIndex = 0) {
  let actualType = gameType;

  if (gameType === "mix") {
    actualType = roundIndex % 2 === 0 ? "wordle" : "andazebi";
  }

  const pack = await ContentPack.findOne({ gameId: actualType }).lean();

  if (!pack || !pack.payload) {
    return null;
  }

  if (actualType === "wordle") {
    const answers = pack.payload.answers ?? pack.payload.words ?? [];

    if (answers.length === 0) {
      return null;
    }

    const answer = answers[Math.floor(Math.random() * answers.length)];
    const validWords = pack.payload.validWords ?? pack.payload.valid ?? answers;

    return {
      actualType: "wordle",
      answer,
      puzzle: { gameType: "wordle", validWords, wordLength: answer.length }
    };
  }

  const items = pack.payload.items ?? pack.payload.proverbs ?? [];

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
  const room = rooms.get(roomId);

  if (!room || room.players.length < 2) {
    return;
  }

  const puzzleData = await pickPuzzle(room.gameType, room.roundIndex);

  if (!puzzleData) {
    room.players.forEach((s) =>
      s.emit("error-message", { message: "Failed to load puzzle data" })
    );

    rooms.delete(roomId);

    return;
  }

  room.answer = puzzleData.answer;
  room.actualType = puzzleData.actualType;
  room.puzzle = puzzleData.puzzle;
  room.guesses = {};
  room.finished = new Set();
  if (room.gameType === "mix") {
    room.roundResults[room.roundIndex] = [];
  }

  room.players.forEach((s) => {
    room.guesses[s.user._id.toString()] = [];
  });

  io.to(roomId).emit("game-start", {
    gameType: puzzleData.actualType,
    puzzle: puzzleData.puzzle,
    roomId,
    roundIndex: room.roundIndex,
    totalRounds: room.totalRounds
  });
}

async function startNextMixRound(io, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.roundIndex += 1;
  await startGame(io, roomId);
}

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(",").map((o) => o.trim()).filter(Boolean),
      methods: ["GET", "POST"]
    }
  });

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
    } catch (error) {
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
        id: generateId(),
        userId: socket.user._id.toString(),
        username: socket.user.username,
        displayName: socket.user.displayName,
        text: msg,
        timestamp: now,
      });
    });

    socket.on("profile-update", async ({ equippedItems }) => {
      const result = findRoomBySocket(socket);
      if (!result) return;
      const { roomId } = result;
      const opponent = getOpponent(result.room, socket);
      if (!opponent) return;

      try {
        const freshUser = await User.findById(socket.user._id).lean();
        const items = (freshUser && freshUser.equippedItems) ? freshUser.equippedItems : equippedItems;
        opponent.emit("opponent-profile", {
          equippedItems: items,
          displayName: socket.user.displayName,
          username: socket.user.username,
        });
      } catch {
        opponent.emit("opponent-profile", {
          equippedItems,
          displayName: socket.user.displayName,
          username: socket.user.username,
        });
      }
    });

    socket.on("join-public-queue", async ({ gameType }) => {
      if (!["wordle", "andazebi", "mix"].includes(gameType)) {
        return socket.emit("error-message", { message: "Invalid game type" });
      }

      removeFromQueue(socket);

      if (!publicQueue.has(gameType)) {
        publicQueue.set(gameType, []);
      }

      const queue = publicQueue.get(gameType);

      if (queue.length > 0) {
        const opponent = queue.shift();

        if (queue.length === 0) {
          publicQueue.delete(gameType);
        }

        const roomId = generateId();
        rooms.set(roomId, {
          gameType,
          players: [opponent, socket],
          answer: null,
          passcode: null,
          puzzle: null,
          guesses: {},
          finished: new Set(),
          roundIndex: 0,
          totalRounds: gameType === "mix" ? 3 : 1,
          roundResults: [],
          scores: {}
        });

        opponent.join(roomId);
        socket.join(roomId);

        io.to(roomId).emit("match-found", {
          roomId,
          players: [
            { id: opponent.user._id.toString(), username: opponent.user.username, displayName: opponent.user.displayName },
            { id: socket.user._id.toString(), username: socket.user.username, displayName: socket.user.displayName }
          ]
        });

        await startGame(io, roomId);
      } else {
        queue.push(socket);
        socket.emit("queue-joined", { gameType });
      }
    });

    socket.on("leave-queue", () => {
      removeFromQueue(socket);
      socket.emit("queue-left");
    });

    socket.on("create-private-room", ({ gameType }) => {
      if (!["wordle", "andazebi", "mix"].includes(gameType)) {
        return socket.emit("error-message", { message: "Invalid game type" });
      }

      const roomId = generateId();
      const passcode = generatePasscode();

      rooms.set(roomId, {
        gameType,
        players: [socket],
        answer: null,
        passcode,
        puzzle: null,
        guesses: {},
        finished: new Set(),
        roundIndex: 0,
        totalRounds: gameType === "mix" ? 3 : 1,
        roundResults: [],
        scores: {}
      });

      privateRooms.set(passcode, roomId);
      socket.join(roomId);

      socket.emit("room-created", { roomId, passcode });
    });

    socket.on("join-private-room", async ({ passcode }) => {
      const roomId = privateRooms.get(passcode);

      if (!roomId) {
        return socket.emit("error-message", { message: "Room not found" });
      }

      const room = rooms.get(roomId);

      if (!room) {
        privateRooms.delete(passcode);

        return socket.emit("error-message", { message: "Room not found" });
      }

      if (room.players.length >= 2) {
        return socket.emit("error-message", { message: "Room is full" });
      }

      if (room.players.some((s) => s.user._id.toString() === socket.user._id.toString())) {
        return socket.emit("error-message", { message: "Already in this room" });
      }

      room.players.push(socket);
      socket.join(roomId);

      privateRooms.delete(passcode);

      io.to(roomId).emit("room-joined", {
        roomId,
        players: room.players.map((s) => ({
          id: s.user._id.toString(),
          username: s.user.username,
          displayName: s.user.displayName
        }))
      });

      await startGame(io, roomId);
    });

    socket.on("submit-guess", ({ guess }) => {
      const found = findRoomBySocket(socket);

      if (!found) {
        return socket.emit("error-message", { message: "Not in a game room" });
      }

      const { roomId, room } = found;
      const playerId = socket.user._id.toString();

      if (room.finished.has(playerId)) {
        return socket.emit("error-message", { message: "Game already finished for you" });
      }

      if (!guess || typeof guess !== "string") {
        return socket.emit("error-message", { message: "Invalid guess" });
      }

      const normalizedGuess = guess.trim().toLowerCase();
      let isCorrect = false;
      let playerGuesses = room.guesses[playerId] ?? [];

      if (room.actualType === "wordle") {
        const validWords = room.puzzle?.validWords ?? [];
        if (validWords.length > 0 && !validWords.includes(normalizedGuess)) {
          return socket.emit("error-message", { message: "Not a valid word" });
        }

        const tiles = scoreWordleGuess(normalizedGuess, room.answer);
        isCorrect = tiles.every((t) => t === "correct");

        playerGuesses.push({ guess: normalizedGuess, tiles });
        room.guesses[playerId] = playerGuesses;

        socket.emit("guess-result", {
          attempt: playerGuesses.length,
          guess: normalizedGuess,
          isCorrect,
          tiles
        });

        const opponent = getOpponent(room, socket);
        if (opponent) {
          opponent.emit("opponent-guess", {
            attempt: playerGuesses.length,
            tiles
          });
        }
      } else {
        isCorrect = normalizedGuess === room.answer.toLowerCase();

        playerGuesses.push({ guess: normalizedGuess, correct: isCorrect });
        room.guesses[playerId] = playerGuesses;

        socket.emit("guess-result", {
          attempt: playerGuesses.length,
          guess: normalizedGuess,
          isCorrect
        });

        const opponent = getOpponent(room, socket);
        if (opponent) {
          opponent.emit("opponent-guess", {
            attempt: playerGuesses.length,
            isCorrect
          });
        }
      }

      const maxAttempts = room.actualType === "wordle" ? MAX_WORDLE_ATTEMPTS : MAX_ANDAZEBI_ATTEMPTS;

      if (isCorrect || playerGuesses.length >= maxAttempts) {
        room.finished.add(playerId);
        const result = isCorrect ? "won" : "lost";
        
        if (room.gameType === "mix") {
            room.roundResults[room.roundIndex].push({
                playerId,
                result,
                attempts: playerGuesses.length
            });
            if (result === "won") {
                room.scores[playerId] = (room.scores[playerId] ?? 0) + 1;
            }
        }

        socket.emit("game-over", {
          answer: room.answer,
          attempts: playerGuesses.length,
          result,
          roundIndex: room.roundIndex
        });

        const opponent = getOpponent(room, socket);
        if (opponent) {
          const opponentId = opponent.user._id.toString();

          if (room.finished.has(opponentId)) {
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
                        scores: room.scores,
                        roundResults: room.roundResults
                    });
                }
            }
          } else {
            opponent.emit("opponent-finished", {
              attempts: playerGuesses.length,
              result
            });
          }
        } else if (room.gameType === "mix" && room.roundIndex + 1 >= room.totalRounds) {
             io.to(roomId).emit("mix-game-over", {
                scores: room.scores,
                roundResults: room.roundResults
            });
        }
      }
    });

    socket.on("disconnect", () => {
      removeFromQueue(socket);

      const found = findRoomBySocket(socket);

      if (found) {
        const { roomId, room } = found;
        const opponent = getOpponent(room, socket);

        if (opponent) {
          opponent.emit("opponent-disconnected", {
            message: "Your opponent has disconnected"
          });

          const opponentId = opponent.user._id.toString();

          if (!room.finished.has(opponentId) && room.answer) {
            opponent.emit("game-over", {
              answer: room.answer,
              attempts: 0,
              result: "won"
            });
            
            if (room.gameType === "mix") {
                io.to(roomId).emit("mix-game-over", {
                    scores: { [opponentId]: (room.scores[opponentId] ?? 0) + 1 },
                    roundResults: room.roundResults
                });
            }
          }
        }

        if (room.passcode) {
          privateRooms.delete(room.passcode);
        }

        rooms.delete(roomId);
      }
    });
  });

  return io;
}

import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import { config } from "./config/env.js";
import { User } from "./models/User.js";
import { ContentPack } from "./models/ContentPack.js";

// In-memory state
const rooms = new Map(); // roomId -> { players: [socket1, socket2], gameType, answer, passcode, puzzle, guesses: { odId: [] }, finished: Set }
const publicQueue = new Map(); // gameType -> [socket]
const privateRooms = new Map(); // passcode -> roomId

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

  // First pass: correct positions
  for (let i = 0; i < guessChars.length; i++) {
    if (guessChars[i] === answerChars[i]) {
      result[i] = "correct";
      answerChars[i] = null;
      guessChars[i] = null;
    }
  }

  // Second pass: present but wrong position
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

async function pickPuzzle(gameType) {
  let actualType = gameType;

  if (gameType === "mix") {
    actualType = Math.random() < 0.5 ? "wordle" : "andazebi";
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

  // andazebi
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

  const puzzleData = await pickPuzzle(room.gameType);

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

  room.players.forEach((s) => {
    room.guesses[s.user._id.toString()] = [];
  });

  io.to(roomId).emit("game-start", {
    gameType: puzzleData.actualType,
    puzzle: puzzleData.puzzle,
    roomId
  });
}

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(",").map((o) => o.trim()).filter(Boolean),
      methods: ["GET", "POST"]
    }
  });

  // JWT auth middleware
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
    // --- Public Matchmaking ---
    socket.on("join-public-queue", async ({ gameType }) => {
      if (!["wordle", "andazebi", "mix"].includes(gameType)) {
        return socket.emit("error-message", { message: "Invalid game type" });
      }

      // Remove from any existing queue first
      removeFromQueue(socket);

      if (!publicQueue.has(gameType)) {
        publicQueue.set(gameType, []);
      }

      const queue = publicQueue.get(gameType);

      // Check if someone is already waiting
      if (queue.length > 0) {
        const opponent = queue.shift();

        if (queue.length === 0) {
          publicQueue.delete(gameType);
        }

        // Create a room for both players
        const roomId = generateId();
        rooms.set(roomId, {
          gameType,
          players: [opponent, socket],
          answer: null,
          passcode: null,
          puzzle: null,
          guesses: {},
          finished: new Set()
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

    // --- Private Room ---
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
        finished: new Set()
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

      // Don't let the same user join their own room
      if (room.players.some((s) => s.user._id.toString() === socket.user._id.toString())) {
        return socket.emit("error-message", { message: "Already in this room" });
      }

      room.players.push(socket);
      socket.join(roomId);

      // Remove the passcode so no one else can join
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

    // --- Gameplay ---
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

      if (room.actualType === "wordle") {
        // Validate against valid words list
        const validWords = room.puzzle?.validWords ?? [];

        if (validWords.length > 0 && !validWords.includes(normalizedGuess)) {
          return socket.emit("error-message", { message: "Not a valid word" });
        }

        const tiles = scoreWordleGuess(normalizedGuess, room.answer);
        const isCorrect = tiles.every((t) => t === "correct");
        const playerGuesses = room.guesses[playerId] ?? [];

        playerGuesses.push({ guess: normalizedGuess, tiles });
        room.guesses[playerId] = playerGuesses;

        // Send result back to the guesser
        socket.emit("guess-result", {
          attempt: playerGuesses.length,
          guess: normalizedGuess,
          isCorrect,
          tiles
        });

        // Send progress to opponent (colors only, not the guess text)
        const opponent = getOpponent(room, socket);

        if (opponent) {
          opponent.emit("opponent-guess", {
            attempt: playerGuesses.length,
            tiles
          });
        }

        // Check game over conditions
        if (isCorrect || playerGuesses.length >= MAX_WORDLE_ATTEMPTS) {
          room.finished.add(playerId);

          const result = isCorrect ? "won" : "lost";

          socket.emit("game-over", {
            answer: room.answer,
            attempts: playerGuesses.length,
            result
          });

          if (opponent) {
            const opponentId = opponent.user._id.toString();

            if (room.finished.has(opponentId)) {
              // Both done — determine final results
            } else {
              opponent.emit("opponent-finished", {
                attempts: playerGuesses.length,
                result
              });
            }
          }
        }
      } else {
        // andazebi mode
        const isCorrect = normalizedGuess === room.answer.toLowerCase();
        const playerGuesses = room.guesses[playerId] ?? [];

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

        if (isCorrect || playerGuesses.length >= MAX_ANDAZEBI_ATTEMPTS) {
          room.finished.add(playerId);

          const result = isCorrect ? "won" : "lost";

          socket.emit("game-over", {
            answer: room.answer,
            attempts: playerGuesses.length,
            result
          });

          if (opponent) {
            const opponentId = opponent.user._id.toString();

            if (room.finished.has(opponentId)) {
              // Both done
            } else {
              opponent.emit("opponent-finished", {
                attempts: playerGuesses.length,
                result
              });
            }
          }
        }
      }
    });

    // --- Disconnect ---
    socket.on("disconnect", () => {
      // Remove from matchmaking queue
      removeFromQueue(socket);

      // Handle in-game disconnect
      const found = findRoomBySocket(socket);

      if (found) {
        const { roomId, room } = found;
        const opponent = getOpponent(room, socket);

        if (opponent) {
          opponent.emit("opponent-disconnected", {
            message: "Your opponent has disconnected"
          });

          // If game was in progress and opponent hasn't finished, they win by default
          const opponentId = opponent.user._id.toString();

          if (!room.finished.has(opponentId) && room.answer) {
            opponent.emit("game-over", {
              answer: room.answer,
              attempts: 0,
              result: "won"
            });
          }
        }

        // Clean up the room
        if (room.passcode) {
          privateRooms.delete(room.passcode);
        }

        rooms.delete(roomId);
      }
    });
  });

  return io;
}

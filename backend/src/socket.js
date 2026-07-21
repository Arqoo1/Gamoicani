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
const TURN_TIMEOUT_MS = 30000;

const turnTimers = new Map();

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
    totalRounds: gameType === "mix" ? 3 : 1,
    turnSubmissions: {},
    turnIndex: 0,
    activePlayerId: null,
    turnCount: 0
  };
}

function getOpponent(room, socket) {
  return room.players.find((player) => player.socketId !== socket?.id) ?? null;
}

function getOpponentById(room, userId) {
  return room.players.find((player) => player.userId !== userId) ?? null;
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
    if (guessChars[i] === null) continue;
    const idx = answerChars.indexOf(guessChars[i]);
    if (idx !== -1) {
      result[i] = "present";
      answerChars[idx] = null;
    }
  }

  return result;
}

export function normalizeGuessInput(guess, room) {
  if (!guess || typeof guess !== "string") return { error: "Invalid guess" };
  if (guess.length > MAX_RAW_GUESS_LENGTH) return { error: "Guess is too long" };

  const normalizedGuess = guess.trim().toLocaleLowerCase("ka-GE");
  if (!normalizedGuess) return { error: "Invalid guess" };

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
  if (!payload) return null;

  if (actualType === "wordle") {
    const answers = payload.answers ?? payload.words ?? [];
    if (answers.length === 0) return null;

    const answer = answers[Math.floor(Math.random() * answers.length)];
    const combinedValidWords = [...answers, ...(payload.validWords ?? payload.valid ?? [])];

    return {
      actualType: "wordle",
      answer,
      puzzle: { gameType: "wordle", validWords: combinedValidWords, wordLength: answer.length }
    };
  }

  const items = payload.items ?? payload.proverbs ?? [];
  if (items.length === 0) return null;

  const item = items[Math.floor(Math.random() * items.length)];
  const answer = item.answer ?? item.text ?? item;

  return {
    actualType: "andazebi",
    answer: typeof answer === "string" ? answer : String(answer),
    puzzle: {
      gameType: "andazebi",
      hint: item.hint ?? item.category ?? null,
      prompt: item.prompt ?? item.display ?? item.masked ?? null,
      missingWordsCount: Array.isArray(item.missingWords) ? item.missingWords.length : typeof answer === "string" ? answer.split(" ").length : 1,
      wordLength: typeof answer === "string" ? answer.length : undefined
    }
  };
}

function clearTurnTimer(roomId) {
  if (turnTimers.has(roomId)) {
    clearTimeout(turnTimers.get(roomId));
    turnTimers.delete(roomId);
  }
}

function setTurnTimer(io, roomId, turnCount) {
  clearTurnTimer(roomId);
  const timer = setTimeout(() => {
    handleTurnTimeout(io, roomId, turnCount);
  }, TURN_TIMEOUT_MS);
  turnTimers.set(roomId, timer);
}

async function handleTurnTimeout(io, roomId, turnIndex) {
  const lock = await acquireRoomLock(roomId);
  if (!lock.acquired) return;

  try {
    const room = await getRoom(roomId);
    if (!room || room.turnIndex !== turnIndex || room.finished.length >= 2) return;

    const activePlayers = room.players.filter(p => !room.finished.includes(p.userId));
    let changed = false;

    for (const p of activePlayers) {
      if (!room.turnSubmissions[p.userId]) {

        const playerGuesses = room.guesses[p.userId] ?? [];
        
        if (room.actualType === "wordle") {
          const tiles = Array(room.puzzle.wordLength).fill("absent");
          playerGuesses.push({ guess: "", tiles });
          room.turnSubmissions[p.userId] = { guess: "", isCorrect: false, tiles };
          io.to(p.socketId).emit("turn-timeout", { attempt: playerGuesses.length });
          const opponent = getOpponentById(room, p.userId);
          if (opponent) io.to(opponent.socketId).emit("opponent-guess", { attempt: playerGuesses.length, tiles });
        } else {
          playerGuesses.push({ guess: "", correct: false });
          room.turnSubmissions[p.userId] = { guess: "", isCorrect: false };
          io.to(p.socketId).emit("turn-timeout", { attempt: playerGuesses.length });
          const opponent = getOpponentById(room, p.userId);
          if (opponent) io.to(opponent.socketId).emit("opponent-guess", { attempt: playerGuesses.length, isCorrect: false });
        }
        
        room.guesses[p.userId] = playerGuesses;
        changed = true;
      }
    }

    if (changed) {
      await resolveTurn(io, roomId, room);
    }
  } finally {
    await releaseRedisLock(`multiplayer:room-lock:${roomId}`, lock.token);
  }
}

async function awardMatchPoints(room, matchWinnerId, matchLoserId, isDraw = false) {
  if (room.passcode) return;

  const gameType = room.gameType;

  for (const p of room.players) {
    const doc = await User.findById(p.userId);
    if (!doc) continue;

    const isWinner = !isDraw && p.userId === matchWinnerId;
    const isLoser = !isDraw && p.userId === matchLoserId;

    if (isWinner) {
      doc.multiplayerPoints = (doc.multiplayerPoints || 0) + 1;
      doc.multiplayerWins = (doc.multiplayerWins || 0) + 1;
      doc.totalPoints = (doc.totalPoints || 0) + 1;
    } else if (isLoser) {
      const pts = doc.multiplayerPoints || 0;
      doc.multiplayerPoints = pts + (pts >= 100 ? -1 : 0);
      doc.multiplayerLosses = (doc.multiplayerLosses || 0) + 1;
    }

    let stat = doc.gameStats.get(gameType);
    if (!stat) stat = { currentStreak: 0, lastCompletedKey: null, lastPlayedAt: null, maxStreak: 0, plays: 0, points: 0, wins: 0 };
    
    stat.plays = (stat.plays || 0) + 1;
    stat.lastPlayedAt = new Date();

    if (isWinner) {
      stat.wins = (stat.wins || 0) + 1;
      stat.points = (stat.points || 0) + 1;
      stat.currentStreak = (stat.currentStreak || 0) + 1;
      stat.maxStreak = Math.max(stat.maxStreak || 0, stat.currentStreak);
    } else {
      stat.currentStreak = 0;
    }

    doc.gameStats.set(gameType, stat);
    await doc.save();
  }
}

async function finishMatch(io, roomId, room, winnerId, loserId, draw) {
  clearTurnTimer(roomId);
  await awardMatchPoints(room, winnerId, loserId, draw);
}

async function handleRoundOver(io, roomId, room, winnerId, draw) {
  const p1 = room.players[0];
  const p2 = room.players[1];

  let p1Result = draw ? "draw" : (winnerId === p1.userId ? "won" : "lost");
  let p2Result = draw ? "draw" : (winnerId === p2.userId ? "won" : "lost");

  if (room.gameType === "mix") {
    room.roundResults[room.roundIndex].push(
      { attempts: room.guesses[p1.userId]?.length || 0, playerId: p1.userId, result: p1Result },
      { attempts: room.guesses[p2.userId]?.length || 0, playerId: p2.userId, result: p2Result }
    );

    if (p1Result === "won") room.scores[p1.userId] = (room.scores[p1.userId] ?? 0) + 1;
    if (p2Result === "won") room.scores[p2.userId] = (room.scores[p2.userId] ?? 0) + 1;

    io.to(p1.socketId).emit("game-over", { answer: room.answer, attempts: room.guesses[p1.userId]?.length || 0, result: p1Result, roundIndex: room.roundIndex });
    io.to(p2.socketId).emit("game-over", { answer: room.answer, attempts: room.guesses[p2.userId]?.length || 0, result: p2Result, roundIndex: room.roundIndex });

    if (room.roundIndex + 1 < room.totalRounds) {
      io.to(roomId).emit("mix-round-over", { roundIndex: room.roundIndex, roundResults: room.roundResults[room.roundIndex], scores: room.scores });
      setTimeout(() => startNextMixRound(io, roomId), 3000);
    } else {

      let matchWinner = null, matchLoser = null, isMatchDraw = false;
      const s1 = room.scores[p1.userId] ?? 0;
      const s2 = room.scores[p2.userId] ?? 0;
      
      if (s1 === s2) isMatchDraw = true;
      else if (s1 > s2) { matchWinner = p1.userId; matchLoser = p2.userId; }
      else { matchWinner = p2.userId; matchLoser = p1.userId; }
      
      await finishMatch(io, roomId, room, matchWinner, matchLoser, isMatchDraw);
      io.to(roomId).emit("mix-game-over", { roundResults: room.roundResults, scores: room.scores });
    }
  } else {

    await finishMatch(io, roomId, room, winnerId, winnerId === p1.userId ? p2.userId : p1.userId, draw);
    io.to(p1.socketId).emit("game-over", { answer: room.answer, attempts: room.guesses[p1.userId]?.length || 0, result: p1Result, roundIndex: room.roundIndex });
    io.to(p2.socketId).emit("game-over", { answer: room.answer, attempts: room.guesses[p2.userId]?.length || 0, result: p2Result, roundIndex: room.roundIndex });
  }
}

async function resolveTurn(io, roomId, room) {
  clearTurnTimer(roomId);

  let winnerId = null;
  let isDraw = false;

  const p1 = room.players[0];
  const p2 = room.players[1];

  const sub1 = room.turnSubmissions[p1.userId];
  const sub2 = room.turnSubmissions[p2.userId];

  const p1Correct = sub1 && sub1.isCorrect;
  const p2Correct = sub2 && sub2.isCorrect;

  const p1Finished = room.finished.includes(p1.userId);
  const p2Finished = room.finished.includes(p2.userId);

  if (p1Correct && p2Correct) {
    isDraw = true;
    if (!p1Finished) room.finished.push(p1.userId);
    if (!p2Finished) room.finished.push(p2.userId);
  } else if (p1Correct && !p2Correct) {
    winnerId = p1.userId;
    if (!p1Finished) room.finished.push(p1.userId);
    if (!p2Finished) room.finished.push(p2.userId);
  } else if (p2Correct && !p1Correct) {
    winnerId = p2.userId;
    if (!p1Finished) room.finished.push(p1.userId);
    if (!p2Finished) room.finished.push(p2.userId);
  } else {

    const maxAttempts = room.actualType === "wordle" ? MAX_WORDLE_ATTEMPTS : MAX_ANDAZEBI_ATTEMPTS;
    const p1Guesses = room.guesses[p1.userId]?.length || 0;
    const p2Guesses = room.guesses[p2.userId]?.length || 0;

    if (p1Guesses >= maxAttempts && p2Guesses >= maxAttempts) {
      isDraw = true;
      if (!p1Finished) room.finished.push(p1.userId);
      if (!p2Finished) room.finished.push(p2.userId);
    }
  }

  room.turnSubmissions = {};
  
  if (room.finished.length >= 2) {
    await handleRoundOver(io, roomId, room, winnerId, isDraw);
  } else {

    room.turnIndex += 1;
    io.to(roomId).emit("your-turn", { turnIndex: room.turnIndex });
    setTurnTimer(io, roomId, room.turnCount);
  }
  
  await saveRoom(room);
}

async function startGame(io, roomId) {
  const room = await getRoom(roomId);
  if (!room || room.players.length < 2) return;

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
  room.turnSubmissions = {};
  room.turnCount = 0;
  room.activePlayerId = room.players[0].userId;

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
    totalRounds: room.totalRounds,
    activePlayerId: room.activePlayerId
  });
  
  setTurnTimer(io, roomId, room.turnIndex);
}

async function startNextMixRound(io, roomId) {
  const room = await getRoom(roomId);
  if (!room) return;
  room.roundIndex += 1;
  await saveRoom(room);
  await startGame(io, roomId);
}

async function findLiveOpponent(io, gameType, currentSocketId) {
  while (true) {
    const opponent = await dequeuePublicPlayer(gameType, currentSocketId);
    if (!opponent) return null;
    if (await socketExists(io, opponent.socketId)) return opponent;
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
      if (!token) return next(new Error("Authentication required"));
      const payload = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(payload.sub);
      if (!user) return next(new Error("Authentication required"));
      socket.user = user;
      next();
    } catch {
      next(new Error("Authentication required"));
    }
  });

  const CHAT_REDIS_KEY = "global-chat:messages";
  const CHAT_MAX_MESSAGES = 100;
  const CHAT_TTL_SECONDS = 86400; // 24 hours

  async function saveChatMessage(message) {
    try {
      const client = await getRedisClient();
      if (!client) return;
      const serialized = JSON.stringify(message);
      // Push to the right end of the list and trim to keep the last CHAT_MAX_MESSAGES
      await client.rPush(CHAT_REDIS_KEY, serialized);
      await client.lTrim(CHAT_REDIS_KEY, -CHAT_MAX_MESSAGES, -1);
      // Only set the TTL once (when the key is new) so it expires at a fixed point,
      // not rolling forward on every message. The daily cron also deletes the key.
      const ttl = await client.ttl(CHAT_REDIS_KEY);
      if (ttl < 0) {
        await client.expire(CHAT_REDIS_KEY, CHAT_TTL_SECONDS);
      }
    } catch (err) {
      console.error("[Chat] Failed to save message to Redis:", err);
    }
  }

  async function loadChatHistory() {
    try {
      const client = await getRedisClient();
      if (!client) return [];
      const raw = await client.lRange(CHAT_REDIS_KEY, 0, -1);
      return raw
        .map((s) => { try { return JSON.parse(s); } catch { return null; } })
        .filter(Boolean);
    } catch (err) {
      console.error("[Chat] Failed to load history from Redis:", err);
      return [];
    }
  }

  io.on("connection", async (socket) => {
    socket.join("global-chat");
    socket.lastChatAt = 0;

    socket.on("request-chat-history", async () => {
      const history = await loadChatHistory();
      if (history.length > 0) {
        socket.emit("chat-history", { messages: history });
      }
    });

    socket.on("chat-send", async ({ text }) => {
      if (!text || typeof text !== "string") return;
      const msg = text.trim().slice(0, 200);
      if (!msg) return;

      const now = Date.now();
      if (now - socket.lastChatAt < 2000) {
        socket.emit("error-message", { message: "Too many messages. Please wait." });
        return;
      }
      socket.lastChatAt = now;

      const chatMessage = {
        displayName: socket.user.displayName,
        id: generateId(),
        text: msg,
        timestamp: now,
        userId: socket.user._id.toString(),
        username: socket.user.username
      };

      // Persist to Redis before broadcasting
      await saveChatMessage(chatMessage);

      io.to("global-chat").emit("chat-message", chatMessage);
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
      if (!GAME_TYPES.includes(gameType)) return socket.emit("error-message", { message: "Invalid game type" });

      await removePlayerFromQueues(socket.id);

      const currentPlayer = createPlayer(socket);
      const opponent = await findLiveOpponent(io, gameType, socket.id);

      if (!opponent) {
        await enqueuePublicPlayer(gameType, currentPlayer);
        socket.emit("queue-joined", { gameType });
        return;
      }

      const room = createRoom({ gameType, players: [opponent, currentPlayer] });
      await saveRoom(room);
      await Promise.all(room.players.map((player) => joinSocketToRoom(io, player.socketId, room.roomId)));

      io.to(room.roomId).emit("match-found", { players: room.players.map(publicPlayer), roomId: room.roomId });
      await startGame(io, room.roomId);
    });

    socket.on("leave-queue", async () => {
      await removePlayerFromQueues(socket.id);
      socket.emit("queue-left");
    });

    socket.on("send-emote", async ({ emote }) => {
      const found = await findRoomBySocketId(socket.id);
      if (!found) return;
      const opponent = getOpponent(found.room, socket);
      if (!opponent) return;
      const safeEmote = String(emote ?? "").trim().slice(0, 8);
      if (!safeEmote) return;
      io.to(opponent.socketId).emit("receive-emote", { emote: safeEmote });
    });

    socket.on("create-private-room", async ({ gameType }) => {
      if (!GAME_TYPES.includes(gameType)) return socket.emit("error-message", { message: "Invalid game type" });

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
      if (!/^\d{4}$/.test(safePasscode)) return socket.emit("error-message", { message: "Room not found" });

      const roomId = await getPrivateRoomId(safePasscode);
      if (!roomId) return socket.emit("error-message", { message: "Room not found" });

      const lock = await acquireRoomLock(roomId);
      if (!lock.acquired) return socket.emit("error-message", { message: "Room is busy. Try again." });

      try {
        const room = await getRoom(roomId);
        if (!room) {
          await deletePrivateRoom(safePasscode);
          return socket.emit("error-message", { message: "Room not found" });
        }

        if (room.players.length >= 2) return socket.emit("error-message", { message: "Room is full" });

        const currentPlayer = createPlayer(socket);
        if (room.players.some((player) => player.userId === currentPlayer.userId)) {
          return socket.emit("error-message", { message: "Already in this room" });
        }

        room.players.push(currentPlayer);
        await saveRoom(room);
        await deletePrivateRoom(safePasscode);
        await joinSocketToRoom(io, socket.id, roomId);

        io.to(roomId).emit("room-joined", { players: room.players.map(publicPlayer), roomId });
        await startGame(io, roomId);
      } finally {
        await releaseRedisLock(`multiplayer:room-lock:${roomId}`, lock.token);
      }
    });

    socket.on("submit-guess", async ({ guess }) => {
      const found = await findRoomBySocketId(socket.id);
      if (!found) return socket.emit("error-message", { message: "Not in a game room" });

      const { roomId } = found;
      const lock = await acquireRoomLock(roomId);
      if (!lock.acquired) return socket.emit("error-message", { message: "Room is busy. Try again." });

      try {
        const room = await getRoom(roomId);
        if (!room) return socket.emit("error-message", { message: "Not in a game room" });

        const player = getPlayer(room, socket);
        if (!player) return socket.emit("error-message", { message: "Not in a game room" });

        if (room.finished.includes(player.userId)) {
          return socket.emit("error-message", { message: "Game already finished for you" });
        }
        
        if (room.activePlayerId !== player.userId) {
          return socket.emit("error-message", { message: "Wait for your turn" });
        }

        const normalized = normalizeGuessInput(guess, room);
        if (normalized.error) return socket.emit("error-message", { message: normalized.error });

        const { normalizedGuess } = normalized;
        const playerGuesses = room.guesses[player.userId] ?? [];
        let isCorrect = false;

        if (room.actualType === "wordle") {
          const validWords = new Set((room.puzzle?.validWords ?? []).map((word) => String(word).trim().toLocaleLowerCase("ka-GE")));
          if (validWords.size > 0 && !validWords.has(normalizedGuess)) {
            return socket.emit("error-message", { message: "Not a valid word" });
          }

          const tiles = scoreWordleGuess(normalizedGuess, String(room.answer).toLocaleLowerCase("ka-GE"));
          isCorrect = tiles.every((tile) => tile === "correct");

          playerGuesses.push({ guess: normalizedGuess, tiles });
          room.guesses[player.userId] = playerGuesses;

          socket.emit("guess-result", { attempt: playerGuesses.length, guess: normalizedGuess, isCorrect, tiles });
          
          const opponent = getOpponent(room, socket);
          if (opponent) io.to(opponent.socketId).emit("opponent-guess", { attempt: playerGuesses.length, tiles });
          
        } else {
          isCorrect = normalizedGuess === String(room.answer).toLocaleLowerCase("ka-GE");

          playerGuesses.push({ correct: isCorrect, guess: normalizedGuess });
          room.guesses[player.userId] = playerGuesses;

          socket.emit("guess-result", { attempt: playerGuesses.length, guess: normalizedGuess, isCorrect });
          
          const opponent = getOpponent(room, socket);
          if (opponent) io.to(opponent.socketId).emit("opponent-guess", { attempt: playerGuesses.length, isCorrect });
        }

        const maxAttempts = room.actualType === "wordle" ? MAX_WORDLE_ATTEMPTS : MAX_ANDAZEBI_ATTEMPTS;
        
        if (isCorrect || playerGuesses.length >= maxAttempts) {
          room.finished.push(player.userId);
          // Auto-finish opponent if current player is correct
          if (isCorrect) {
             const opponent = getOpponent(room, socket);
             if (opponent && !room.finished.includes(opponent.userId)) {
                 room.finished.push(opponent.userId);
             }
          }
        }

        if (room.finished.length >= 2) {
          clearTurnTimer(roomId);
          const p1 = room.players[0];
          const p2 = room.players[1];
          let winnerId = null;
          let isDraw = false;
          
          const p1Guesses = room.guesses[p1.userId] || [];
          const p2Guesses = room.guesses[p2.userId] || [];
          const p1Correct = p1Guesses.some(g => g.isCorrect || (g.tiles && g.tiles.every(t=>t==='correct')) || g.correct);
          const p2Correct = p2Guesses.some(g => g.isCorrect || (g.tiles && g.tiles.every(t=>t==='correct')) || g.correct);

          if (p1Correct && p2Correct) {
             isDraw = true;
          } else if (p1Correct) {
             winnerId = p1.userId;
          } else if (p2Correct) {
             winnerId = p2.userId;
          } else {
             isDraw = true; // both failed
          }

          await handleRoundOver(io, roomId, room, winnerId, isDraw);
        } else {
          const opponent = getOpponent(room, socket);
          if (opponent && !room.finished.includes(opponent.userId)) {
            room.activePlayerId = opponent.userId;
          }
          room.turnCount++;
          io.to(roomId).emit("turn-changed", { activePlayerId: room.activePlayerId });
          setTurnTimer(io, roomId, room.turnCount);
        }
        await saveRoom(room);
      } finally {
        await releaseRedisLock(`multiplayer:room-lock:${roomId}`, lock.token);
      }
    });

    socket.on("forfeit", async () => {
      const found = await findRoomBySocketId(socket.id);
      if (!found) return;

      const { roomId } = found;
      const lock = await acquireRoomLock(roomId);
      if (!lock.acquired) return;

      try {
        const freshRoom = await getRoom(roomId);
        if (!freshRoom) return;

        const player = getPlayer(freshRoom, socket);
        const opponent = getOpponent(freshRoom, socket);
        
        if (!player || freshRoom.finished.includes(player.userId)) return;

        if (freshRoom.gameType === "mix") {

            await finishMatch(io, roomId, freshRoom, opponent ? opponent.userId : null, player.userId, false);
            io.to(player.socketId).emit("game-over", { answer: freshRoom.answer, attempts: 0, result: "lost", roundIndex: freshRoom.roundIndex });
            if (opponent) {
                io.to(opponent.socketId).emit("game-over", { answer: freshRoom.answer, attempts: 0, result: "won", roundIndex: freshRoom.roundIndex });
                io.to(roomId).emit("mix-game-over", { roundResults: freshRoom.roundResults, scores: freshRoom.scores });
            }
        } else {
            await finishMatch(io, roomId, freshRoom, opponent ? opponent.userId : null, player.userId, false);
            io.to(player.socketId).emit("game-over", { answer: freshRoom.answer, attempts: 0, result: "lost", roundIndex: freshRoom.roundIndex });
            if (opponent) {
                io.to(opponent.socketId).emit("game-over", { answer: freshRoom.answer, attempts: 0, result: "won", roundIndex: freshRoom.roundIndex });
            }
        }
        
        freshRoom.finished.push(player.userId);
        if (opponent) freshRoom.finished.push(opponent.userId);
        await saveRoom(freshRoom);
      } finally {
        await releaseRedisLock(`multiplayer:room-lock:${roomId}`, lock.token);
      }
    });

    socket.on("disconnect", async () => {
      await removePlayerFromQueues(socket.id);

      const found = await findRoomBySocketId(socket.id);
      if (!found) return;

      const { roomId, room } = found;
      clearTurnTimer(roomId);
      
      const player = getPlayer(room, socket);
      const opponent = getOpponent(room, socket);

      if (opponent) {
        io.to(opponent.socketId).emit("opponent-disconnected", { message: "Your opponent has disconnected" });

        if (player && !room.finished.includes(player.userId) && !room.finished.includes(opponent.userId)) {

            if (room.gameType === "mix") {
                await awardMatchPoints(room, opponent.userId, player.userId);
                io.to(opponent.socketId).emit("game-over", { answer: room.answer, attempts: 0, result: "won", roundIndex: room.roundIndex });
                io.to(roomId).emit("mix-game-over", { roundResults: room.roundResults, scores: room.scores });
            } else {
                await awardMatchPoints(room, opponent.userId, player.userId);
                io.to(opponent.socketId).emit("game-over", { answer: room.answer, attempts: 0, result: "won", roundIndex: room.roundIndex });
            }
        }
      }

      await deleteRoom(roomId);
    });
  });

  return io;
}

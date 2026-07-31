import { getPrivateRoomId } from "../services/multiplayerStore.js";
import { acquireRedisLock } from "../services/redisClient.js";

export function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function generatePasscode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function generateUniquePasscode() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const passcode = generatePasscode();

    if (!(await getPrivateRoomId(passcode))) {
      return passcode;
    }
  }

  throw new Error("Could not allocate private room passcode");
}

export function createRoom({ gameType, passcode = null, players, roomId = generateId() }) {
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

export function getOpponent(room, socket) {
  return room.players.find((player) => player.socketId !== socket?.id) ?? null;
}

export function getOpponentById(room, userId) {
  return room.players.find((player) => player.userId !== userId) ?? null;
}

export function getPlayer(room, socket) {
  return room.players.find((player) => player.socketId === socket.id) ?? null;
}

export function publicPlayer(player) {
  return {
    displayName: player.displayName,
    id: player.userId,
    username: player.username
  };
}

export async function socketExists(io, socketId) {
  const sockets = await io.in(socketId).fetchSockets();
  return sockets.length > 0;
}

export async function joinSocketToRoom(io, socketId, roomId) {
  await io.in(socketId).socketsJoin(roomId);
}

export async function acquireRoomLock(roomId) {
  return acquireRedisLock(`multiplayer:room-lock:${roomId}`, 5000);
}

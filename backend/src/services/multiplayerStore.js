import { getRedisClient } from "./redisClient.js";

const ROOM_TTL_SECONDS = 2 * 60 * 60;
const PRIVATE_ROOM_TTL_SECONDS = 30 * 60;
const SOCKET_ROOM_TTL_SECONDS = 2 * 60 * 60;
const GAME_TYPES = ["wordle", "andazebi", "mix"];

const memoryRooms = new Map();
const memoryQueues = new Map();
const memoryPrivateRooms = new Map();
const memorySocketRooms = new Map();

function queueKey(gameType) {
  return `multiplayer:queue:${gameType}`;
}

function roomKey(roomId) {
  return `multiplayer:room:${roomId}`;
}

function privateRoomKey(passcode) {
  return `multiplayer:private:${passcode}`;
}

function socketRoomKey(socketId) {
  return `multiplayer:socket-room:${socketId}`;
}

function serialize(value) {
  return JSON.stringify(value);
}

function deserialize(value) {
  return value ? JSON.parse(value) : null;
}

async function getClient() {
  return getRedisClient();
}

export function createPlayer(socket) {
  return {
    displayName: socket.user.displayName,
    socketId: socket.id,
    userId: socket.user._id.toString(),
    username: socket.user.username
  };
}

export async function enqueuePublicPlayer(gameType, player) {
  const client = await getClient();

  if (client) {
    await client.lPush(queueKey(gameType), serialize(player));
    return;
  }

  const queue = memoryQueues.get(gameType) ?? [];
  queue.push(player);
  memoryQueues.set(gameType, queue);
}

export async function dequeuePublicPlayer(gameType, currentSocketId) {
  const client = await getClient();

  if (client) {
    while (true) {
      const rawPlayer = await client.rPop(queueKey(gameType));

      if (!rawPlayer) {
        return null;
      }

      const player = deserialize(rawPlayer);

      if (player?.socketId && player.socketId !== currentSocketId) {
        return player;
      }
    }
  }

  const queue = memoryQueues.get(gameType) ?? [];

  while (queue.length > 0) {
    const player = queue.shift();

    if (player?.socketId && player.socketId !== currentSocketId) {
      if (queue.length === 0) {
        memoryQueues.delete(gameType);
      }

      return player;
    }
  }

  memoryQueues.delete(gameType);
  return null;
}

export async function removePlayerFromQueues(socketId) {
  const client = await getClient();

  if (client) {
    for (const gameType of GAME_TYPES) {
      const key = queueKey(gameType);
      const entries = await client.lRange(key, 0, -1);

      await Promise.all(
        entries
          .filter((entry) => deserialize(entry)?.socketId === socketId)
          .map((entry) => client.lRem(key, 0, entry))
      );
    }

    return;
  }

  for (const [gameType, queue] of memoryQueues.entries()) {
    const filteredQueue = queue.filter((player) => player.socketId !== socketId);

    if (filteredQueue.length === 0) {
      memoryQueues.delete(gameType);
    } else {
      memoryQueues.set(gameType, filteredQueue);
    }
  }
}

export async function saveRoom(room) {
  const client = await getClient();

  if (client) {
    await client.set(roomKey(room.roomId), serialize(room), { EX: ROOM_TTL_SECONDS });
    await Promise.all(
      room.players.map((player) =>
        client.set(socketRoomKey(player.socketId), room.roomId, { EX: SOCKET_ROOM_TTL_SECONDS })
      )
    );
    return;
  }

  memoryRooms.set(room.roomId, room);
  room.players.forEach((player) => {
    memorySocketRooms.set(player.socketId, room.roomId);
  });
}

export async function getRoom(roomId) {
  const client = await getClient();

  if (client) {
    return deserialize(await client.get(roomKey(roomId)));
  }

  return memoryRooms.get(roomId) ?? null;
}

export async function findRoomBySocketId(socketId) {
  const client = await getClient();

  if (client) {
    const roomId = await client.get(socketRoomKey(socketId));

    if (!roomId) {
      return null;
    }

    const room = await getRoom(roomId);
    return room ? { roomId, room } : null;
  }

  const roomId = memorySocketRooms.get(socketId);

  if (!roomId) {
    return null;
  }

  const room = memoryRooms.get(roomId);
  return room ? { roomId, room } : null;
}

export async function deleteRoom(roomId) {
  const room = await getRoom(roomId);
  const client = await getClient();

  if (client) {
    const keys = [roomKey(roomId)];

    if (room?.passcode) {
      keys.push(privateRoomKey(room.passcode));
    }

    if (room?.players) {
      keys.push(...room.players.map((player) => socketRoomKey(player.socketId)));
    }

    await client.del(keys);
    return;
  }

  if (room?.passcode) {
    memoryPrivateRooms.delete(room.passcode);
  }

  if (room?.players) {
    room.players.forEach((player) => memorySocketRooms.delete(player.socketId));
  }

  memoryRooms.delete(roomId);
}

export async function clearSocketRoom(socketId) {
  const client = await getClient();

  if (client) {
    await client.del(socketRoomKey(socketId));
    return;
  }

  memorySocketRooms.delete(socketId);
}

export async function setPrivateRoom(passcode, roomId) {
  const client = await getClient();

  if (client) {
    await client.set(privateRoomKey(passcode), roomId, { EX: PRIVATE_ROOM_TTL_SECONDS });
    return;
  }

  memoryPrivateRooms.set(passcode, roomId);
}

export async function getPrivateRoomId(passcode) {
  const client = await getClient();

  if (client) {
    return client.get(privateRoomKey(passcode));
  }

  return memoryPrivateRooms.get(passcode) ?? null;
}

export async function deletePrivateRoom(passcode) {
  const client = await getClient();

  if (client) {
    await client.del(privateRoomKey(passcode));
    return;
  }

  memoryPrivateRooms.delete(passcode);
}

export function clearMemoryMultiplayerStore() {
  memoryRooms.clear();
  memoryQueues.clear();
  memoryPrivateRooms.clear();
  memorySocketRooms.clear();
}

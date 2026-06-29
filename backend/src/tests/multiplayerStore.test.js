import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { config } from "../config/env.js";
import {
  clearMemoryMultiplayerStore,
  createPlayer,
  deletePrivateRoom,
  deleteRoom,
  dequeuePublicPlayer,
  enqueuePublicPlayer,
  findRoomBySocketId,
  getPrivateRoomId,
  getRoom,
  saveRoom,
  setPrivateRoom
} from "../services/multiplayerStore.js";

beforeEach(() => {
  config.redisUrl = "";
  clearMemoryMultiplayerStore();
});

function socket(id, userId, username = userId) {
  return {
    id,
    user: {
      _id: { toString: () => userId },
      displayName: username,
      username
    }
  };
}

test("memory multiplayer store queues players FIFO by game type", async () => {
  const first = createPlayer(socket("socket-a", "user-a"));
  const second = createPlayer(socket("socket-b", "user-b"));

  await enqueuePublicPlayer("wordle", first);
  await enqueuePublicPlayer("wordle", second);

  assert.deepEqual(await dequeuePublicPlayer("wordle", "socket-c"), first);
  assert.deepEqual(await dequeuePublicPlayer("wordle", "socket-c"), second);
  assert.equal(await dequeuePublicPlayer("wordle", "socket-c"), null);
});

test("memory multiplayer store tracks rooms, socket membership, and private codes", async () => {
  const room = {
    gameType: "wordle",
    passcode: "1234",
    players: [
      createPlayer(socket("socket-a", "user-a")),
      createPlayer(socket("socket-b", "user-b"))
    ],
    roomId: "room-1"
  };

  await saveRoom(room);
  await setPrivateRoom("1234", "room-1");

  assert.deepEqual(await getRoom("room-1"), room);
  assert.equal((await findRoomBySocketId("socket-a")).roomId, "room-1");
  assert.equal(await getPrivateRoomId("1234"), "room-1");

  await deletePrivateRoom("1234");
  assert.equal(await getPrivateRoomId("1234"), null);

  await deleteRoom("room-1");
  assert.equal(await getRoom("room-1"), null);
  assert.equal(await findRoomBySocketId("socket-a"), null);
});

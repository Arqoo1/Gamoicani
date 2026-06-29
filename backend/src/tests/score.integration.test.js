import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";

import mongoose from "mongoose";
import request from "supertest";

import { createApp } from "../app.js";
import { config } from "../config/env.js";
import { ContentPack } from "../models/ContentPack.js";
import { ScoreEvent } from "../models/ScoreEvent.js";
import { User } from "../models/User.js";
import { clearContentPayloadCache } from "../services/contentPackCache.js";
import { recordScore } from "../services/scoreService.js";
import { getWordlePuzzleNumber, validateScorePayload } from "../services/scoreValidationService.js";
import { signAuthToken } from "../utils/tokens.js";

const testMongoUri = config.testMongoUri;
const app = createApp();

before(async () => {
  if (!testMongoUri.includes("_test")) {
    throw new Error("Refusing to run integration tests without a _test database");
  }

  await mongoose.connect(testMongoUri);
});

beforeEach(async () => {
  clearContentPayloadCache();
  await mongoose.connection.db.dropDatabase();
  await ContentPack.create([
    {
      gameId: "wordle",
      payload: {
        answers: ["სახლი", "რძალი"],
        validWords: ["სახლი", "რძალი", "კალამ"]
      }
    },
    {
      gameId: "andazebi",
      payload: {
        gameId: "andazebi",
        items: [
          {
            answer: "შრომა",
            fullText: "შრომა აკეთებს კაცს",
            hint: "საქმე",
            id: "hard-one",
            level: "hard",
            missingWords: ["შრომა"],
            prompt: "___ აკეთებს კაცს"
          }
        ]
      }
    }
  ]);
});

after(async () => {
  await mongoose.disconnect();
});

async function createUser(username) {
  return User.create({
    displayName: username,
    email: `${username}@example.com`,
    passwordHash: "hash",
    username
  });
}

test("duplicate daily score is ignored", async () => {
  const user = await createUser("duplicate-user");
  const puzzleKey = String(getWordlePuzzleNumber());
  const answer = ["სახლი", "რძალი"][(Number(puzzleKey) - 1) % 2];

  const first = await recordScore(user, {
    attempts: 1,
    gameId: "wordle",
    guesses: [answer],
    mode: "daily",
    puzzleKey,
    won: true
  });
  const second = await recordScore(await User.findById(user._id), {
    attempts: 1,
    gameId: "wordle",
    guesses: [answer],
    mode: "daily",
    puzzleKey,
    won: true
  });
  const savedUser = await User.findById(user._id);

  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
  assert.equal(savedUser.totalPoints, 3);
  assert.equal(await ScoreEvent.countDocuments({ user: user._id }), 1);
});

test("streak updates across consecutive daily scores", async () => {
  const user = await createUser("streak-user");

  await recordScore(user, {
    attempts: 1,
    completionMethod: "solved",
    gameId: "andazebi",
    itemId: "hard-one",
    mode: "daily",
    streakKey: "2026-06-01",
    won: true
  });
  await recordScore(await User.findById(user._id), {
    attempts: 1,
    completionMethod: "solved",
    gameId: "andazebi",
    itemId: "hard-one",
    mode: "daily",
    streakKey: "2026-06-02",
    won: true
  });

  const savedUser = await User.findById(user._id);
  const andazebiStats = savedUser.gameStats.get("andazebi");

  assert.equal(andazebiStats.currentStreak, 2);
  assert.equal(andazebiStats.maxStreak, 2);
  assert.equal(andazebiStats.points, 6);
});

test("leaderboard sorting uses total points descending", async () => {
  await User.create([
    {
      displayName: "Low",
      email: "low@example.com",
      passwordHash: "hash",
      totalPoints: 1,
      username: "low"
    },
    {
      displayName: "High",
      email: "high@example.com",
      passwordHash: "hash",
      totalPoints: 9,
      username: "high"
    }
  ]);

  const users = await User.find({}).sort({ totalPoints: -1, updatedAt: 1 }).lean();

  assert.equal(users[0].username, "high");
  assert.equal(users[1].username, "low");
});

test("global leaderboard uses shared ranks for tied scores", async () => {
  await User.create([
    {
      displayName: "Tie A",
      email: "tie-a@example.com",
      passwordHash: "hash",
      totalPoints: 9,
      username: "tie-a"
    },
    {
      displayName: "Tie B",
      email: "tie-b@example.com",
      passwordHash: "hash",
      totalPoints: 9,
      username: "tie-b"
    },
    {
      displayName: "Third",
      email: "third@example.com",
      passwordHash: "hash",
      totalPoints: 1,
      username: "third"
    }
  ]);

  const response = await request(app).get("/api/leaderboards/global?limit=3").expect(200);

  assert.deepEqual(
    response.body.data.map((row) => row.rank),
    [1, 1, 3]
  );
});

test("friend request lifecycle updates both users without duplicates", async () => {
  const alice = await createUser("alice");
  const bob = await createUser("bob");
  const aliceToken = signAuthToken(alice);
  const bobToken = signAuthToken(bob);

  await request(app)
    .post("/api/friends/request")
    .set("Authorization", `Bearer ${aliceToken}`)
    .send({ userId: bob._id.toString() })
    .expect(200);

  await request(app)
    .post("/api/friends/request")
    .set("Authorization", `Bearer ${aliceToken}`)
    .send({ userId: bob._id.toString() })
    .expect(400);

  const requestsResponse = await request(app)
    .get("/api/friends/requests")
    .set("Authorization", `Bearer ${bobToken}`)
    .expect(200);

  assert.equal(requestsResponse.body.data.length, 1);
  assert.equal(requestsResponse.body.data[0].from.id, alice._id.toString());
  assert.equal(requestsResponse.body.data[0].user.id, alice._id.toString());

  await request(app)
    .post("/api/friends/accept")
    .set("Authorization", `Bearer ${bobToken}`)
    .send({ userId: alice._id.toString() })
    .expect(200);

  let savedAlice = await User.findById(alice._id).lean();
  let savedBob = await User.findById(bob._id).lean();

  assert.deepEqual(savedAlice.friends.map(String), [bob._id.toString()]);
  assert.deepEqual(savedBob.friends.map(String), [alice._id.toString()]);
  assert.equal(savedBob.friendRequests.length, 0);

  await request(app)
    .delete(`/api/friends/${alice._id}`)
    .set("Authorization", `Bearer ${bobToken}`)
    .expect(200);

  savedAlice = await User.findById(alice._id).lean();
  savedBob = await User.findById(bob._id).lean();

  assert.deepEqual(savedAlice.friends, []);
  assert.deepEqual(savedBob.friends, []);
});

test("upload endpoint rejects fake image bytes", async () => {
  const user = await createUser("upload-user");
  const token = signAuthToken(user);

  await request(app)
    .post("/api/uploads/avatar")
    .set("Authorization", `Bearer ${token}`)
    .attach("photo", Buffer.from("not actually a png"), {
      contentType: "image/png",
      filename: "avatar.png"
    })
    .expect(400);

  const savedUser = await User.findById(user._id).lean();
  assert.equal(savedUser.profilePhotoUrl, null);
});

test("Wordle validation allows previous puzzle shortly after midnight", async () => {
  const now = new Date(Date.UTC(2026, 0, 2, 0, 30));
  const contentPack = await ContentPack.findOne({ gameId: "wordle" }).lean();
  const previousPuzzleKey = String(getWordlePuzzleNumber(new Date(Date.UTC(2026, 0, 1, 12))));
  const answer = contentPack.payload.answers[(Number(previousPuzzleKey) - 1) % contentPack.payload.answers.length];

  const score = await validateScorePayload(
    {
      attempts: 1,
      gameId: "wordle",
      guesses: [answer],
      mode: "daily",
      puzzleKey: previousPuzzleKey,
      won: true
    },
    { now }
  );

  assert.equal(score.puzzleKey, previousPuzzleKey);
  assert.equal(score.won, true);
});

test("Wordle content payload is cached between validations", async () => {
  const puzzleKey = String(getWordlePuzzleNumber());
  const contentPack = await ContentPack.findOne({ gameId: "wordle" }).lean();
  const answer = contentPack.payload.answers[(Number(puzzleKey) - 1) % contentPack.payload.answers.length];
  const payload = {
    attempts: 1,
    gameId: "wordle",
    guesses: [answer],
    mode: "daily",
    puzzleKey,
    won: true
  };

  await validateScorePayload(payload);
  await ContentPack.deleteOne({ gameId: "wordle" });
  const score = await validateScorePayload(payload);

  assert.equal(score.won, true);
});

test("game content endpoint falls back to bundled content when database pack is missing", async () => {
  clearContentPayloadCache();
  await ContentPack.deleteOne({ gameId: "wordle" });

  const response = await request(app).get("/api/games/wordle/content").expect(200);

  assert.ok(response.body.data.answers.length > 0);
  assert.ok(response.body.data.validWords.length > 0);
});

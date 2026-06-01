import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";

import mongoose from "mongoose";

import { config } from "../config/env.js";
import { ContentPack } from "../models/ContentPack.js";
import { ScoreEvent } from "../models/ScoreEvent.js";
import { User } from "../models/User.js";
import { recordScore } from "../services/scoreService.js";
import { getWordlePuzzleNumber } from "../services/scoreValidationService.js";

const testMongoUri = config.testMongoUri;

before(async () => {
  if (!testMongoUri.includes("_test")) {
    throw new Error("Refusing to run integration tests without a _test database");
  }

  await mongoose.connect(testMongoUri);
});

beforeEach(async () => {
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

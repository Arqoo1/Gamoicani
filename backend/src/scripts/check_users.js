import mongoose from "mongoose";
import { User } from "../models/User.js";
import { ScoreEvent } from "../models/ScoreEvent.js";
import { config } from "../config/env.js";

async function run() {
  await mongoose.connect(config.mongoUri || "mongodb://127.0.0.1:27017/gamoicani");
  try {
    const users = await User.find({}).lean();
    console.log(`Found ${users.length} user(s):`);
    for (const u of users) {
      console.log(`- Username: ${u.username}`);
      console.log(`  DisplayName: ${u.displayName}`);
      console.log(`  TotalPoints: ${u.totalPoints}`);
      console.log(`  GameStats:`, JSON.stringify(u.gameStats, null, 2));
    }
    
    const events = await ScoreEvent.find({}).lean();
    console.log(`Found ${events.length} score events:`);
    for (const e of events) {
      console.log(`- Game: ${e.gameId}, User: ${e.user}, Won: ${e.won}, Points: ${e.points}, PuzzleKey: ${e.puzzleKey}`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

run().catch(console.error);

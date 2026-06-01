import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { ScoreEvent } from "../models/ScoreEvent.js";
import { User } from "../models/User.js";

async function run() {
  await connectDatabase();

  const users = await User.find({
    $or: [
      { username: "codex-smoke-test" },
      { username: /^codexauth/ },
      { email: /^codex-auth-/ }
    ]
  });

  if (users.length === 0) {
    console.log("No smoke users found");
    return;
  }

  const userIds = users.map((user) => user._id);
  const scoreResult = await ScoreEvent.deleteMany({ user: { $in: userIds } });
  const userResult = await User.deleteMany({ _id: { $in: userIds } });

  console.log(`Deleted ${userResult.deletedCount} smoke users and ${scoreResult.deletedCount} score events`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });

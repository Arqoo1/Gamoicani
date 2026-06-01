import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { User } from "../models/User.js";

async function run() {
  const username = process.argv[2];

  if (!username) {
    throw new Error("Usage: npm run promote:admin -- <username>");
  }

  await connectDatabase();

  const user = await User.findOneAndUpdate(
    { username: username.toLocaleLowerCase() },
    { $set: { role: "admin" } },
    { new: true }
  );

  if (!user) {
    throw new Error(`User not found: ${username}`);
  }

  console.log(`${user.username} is now admin`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });

import path from "node:path";

import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { seedContent } from "../services/contentSeedService.js";

async function run() {
  await connectDatabase();

  const result = await seedContent({
    dataDir: path.resolve(process.env.SEED_DATA_DIR ?? path.join(process.cwd(), "..", "frontend", "data"))
  });

  console.log(`Seeded ${result.count} games from ${result.dataDir}`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });

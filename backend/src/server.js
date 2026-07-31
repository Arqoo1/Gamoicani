import { createServer } from "http";
import { config, validateProductionConfig } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { createApp } from "./app.js";
import { initSocket } from "./socket.js";
import { startDailyResetJob } from "./jobs/dailyNotification.js";
import { startKeepAliveJob } from "./jobs/keepAlive.js";
import { seedContent } from "./services/contentSeedService.js";

async function startServer() {
  validateProductionConfig();
  await connectDatabase();

  try {
    const result = await seedContent();
    console.log(`[Seed] Seeded ${result.count} games from ${result.dataDir}`);
  } catch (err) {
    console.warn("[Seed] Content seeding failed (server will still start):", err.message);
  }

  const app = createApp();
  const httpServer = createServer(app);

  await initSocket(httpServer);

  httpServer.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
    if (config.enableJobs) {
      startDailyResetJob();
    }
    // Always start the keep-alive ping for Render
    startKeepAliveJob();
  });
}

startServer().catch((error) => {
  console.error("Failed to start API server");
  console.error(error);
  process.exit(1);
});

import { createServer } from "http";
import { config, validateProductionConfig } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { createApp } from "./app.js";
import { initSocket } from "./socket.js";
import { startDailyResetJob } from "./jobs/dailyNotification.js";

async function startServer() {
  validateProductionConfig();
  await connectDatabase();

  const app = createApp();
  const httpServer = createServer(app);

  await initSocket(httpServer);

  httpServer.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
    if (config.enableJobs) {
      startDailyResetJob();
    }
  });
}

startServer().catch((error) => {
  console.error("Failed to start API server");
  console.error(error);
  process.exit(1);
});

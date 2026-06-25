import { createServer } from "http";
import { config } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { createApp } from "./app.js";
import { initSocket } from "./socket.js";

async function startServer() {
  await connectDatabase();

  const app = createApp();
  const httpServer = createServer(app);

  initSocket(httpServer);

  httpServer.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start API server");
  console.error(error);
  process.exit(1);
});

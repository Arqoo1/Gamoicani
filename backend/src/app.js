import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import { config } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { apiRoutes } from "./routes/index.js";

export function createApp() {
  const app = express();
  const corsOrigin =
    config.corsOrigin === "*"
      ? true
      : config.corsOrigin.split(",").map((origin) => origin.trim()).filter(Boolean);

  app.use(helmet());
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));
  
  app.use(
    rateLimit({
      legacyHeaders: false,
      limit: 120,
      standardHeaders: "draft-8",
      windowMs: 60 * 1000
    })
  );

  app.get("/", (req, res) => {
    res.json({
      data: {
        name: "Georgian Games API",
        routes: ["/api/health", "/api/leaderboards/global", "/api/scores"]
      }
    });
  });

  app.use("/api", apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

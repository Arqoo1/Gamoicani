import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

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

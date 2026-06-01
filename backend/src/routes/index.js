import { Router } from "express";

import { getMe } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { adminRoutes } from "./adminRoutes.js";
import { authRoutes } from "./authRoutes.js";
import { gameRoutes } from "./gameRoutes.js";
import { leaderboardRoutes } from "./leaderboardRoutes.js";
import { scoreRoutes } from "./scoreRoutes.js";
import { userRoutes } from "./userRoutes.js";

export const apiRoutes = Router();

apiRoutes.get("/health", (req, res) => {
  res.json({ data: { ok: true } });
});

apiRoutes.get("/me", requireAuth, getMe);
apiRoutes.use("/admin", adminRoutes);
apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/games", gameRoutes);
apiRoutes.use("/leaderboards", leaderboardRoutes);
apiRoutes.use("/scores", scoreRoutes);
apiRoutes.use("/users", userRoutes);

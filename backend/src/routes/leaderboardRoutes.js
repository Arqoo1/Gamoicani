import { Router } from "express";

import {
  getGamePointsLeaderboard,
  getGlobalLeaderboard,
  getMyLeaderboardRanks,
  getStreakLeaderboard
} from "../controllers/leaderboardController.js";
import { requireAuth } from "../middleware/auth.js";

export const leaderboardRoutes = Router();

leaderboardRoutes.get("/global", getGlobalLeaderboard);
leaderboardRoutes.get("/me", requireAuth, getMyLeaderboardRanks);
leaderboardRoutes.get("/:gameId/points", getGamePointsLeaderboard);
leaderboardRoutes.get("/:gameId/streaks", getStreakLeaderboard);

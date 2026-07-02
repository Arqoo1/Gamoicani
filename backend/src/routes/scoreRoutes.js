import { Router } from "express";

import { createScore, getMyGameSummary, repairMyStats } from "../controllers/scoreController.js";
import { requireAuth } from "../middleware/auth.js";

export const scoreRoutes = Router();

scoreRoutes.post("/", requireAuth, createScore);
scoreRoutes.post("/repair", requireAuth, repairMyStats);
scoreRoutes.get("/me/:gameId", requireAuth, getMyGameSummary);

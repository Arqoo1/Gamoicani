import { Router } from "express";

import { createScore, getMyGameSummary } from "../controllers/scoreController.js";
import { requireAuth } from "../middleware/auth.js";

export const scoreRoutes = Router();

scoreRoutes.post("/", requireAuth, createScore);
scoreRoutes.get("/me/:gameId", requireAuth, getMyGameSummary);

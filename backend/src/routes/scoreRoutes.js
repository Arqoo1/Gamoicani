import { Router } from "express";

import { createScore } from "../controllers/scoreController.js";
import { requireAuth } from "../middleware/auth.js";

export const scoreRoutes = Router();

scoreRoutes.post("/", requireAuth, createScore);

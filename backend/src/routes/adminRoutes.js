import { Router } from "express";

import { seedContentFromFiles } from "../controllers/adminController.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.post("/content/seed", requireAuth, requireAdmin, seedContentFromFiles);

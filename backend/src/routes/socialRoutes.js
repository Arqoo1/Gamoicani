import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getFeed } from "../controllers/socialController.js";

export const socialRoutes = Router();

socialRoutes.get("/feed", requireAuth, getFeed);

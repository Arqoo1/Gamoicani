import { Router } from "express";

import { uploadAvatar, uploadCover, uploadMiddleware } from "../controllers/uploadController.js";
import { requireAuth } from "../middleware/auth.js";

export const uploadRoutes = Router();

uploadRoutes.post("/avatar", requireAuth, uploadMiddleware, uploadAvatar);
uploadRoutes.post("/cover", requireAuth, uploadMiddleware, uploadCover);

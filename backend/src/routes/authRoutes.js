import { Router } from "express";

import { changePassword, getMe, login, loginWithGoogle, register, savePushToken, updateMe } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/google", loginWithGoogle);
authRoutes.get("/me", requireAuth, getMe);
authRoutes.patch("/me", requireAuth, updateMe);
authRoutes.post("/change-password", requireAuth, changePassword);
authRoutes.post("/push-token", requireAuth, savePushToken);

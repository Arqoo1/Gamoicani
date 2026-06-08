import { Router } from "express";

import { changePassword, getMe, login, register, updateMe } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/me", requireAuth, getMe);
authRoutes.patch("/me", requireAuth, updateMe);
authRoutes.post("/change-password", requireAuth, changePassword);

import { Router } from "express";

import { getUserByUsername } from "../controllers/userController.js";

export const userRoutes = Router();

userRoutes.get("/:username", getUserByUsername);

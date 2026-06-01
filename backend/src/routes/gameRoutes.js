import { Router } from "express";

import { getGameContent, listGames } from "../controllers/gameController.js";

export const gameRoutes = Router();

gameRoutes.get("/", listGames);
gameRoutes.get("/:gameId/content", getGameContent);

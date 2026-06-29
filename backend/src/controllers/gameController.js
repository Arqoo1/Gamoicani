import { Game } from "../models/Game.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getContentPayload } from "../services/contentPackCache.js";
import { sanitizeGameId } from "../utils/validators.js";

export const listGames = asyncHandler(async (req, res) => {
  // Sort by status ascending ("ready" comes before "soon" alphabetically), then by createdAt
  const games = await Game.find({}).sort({ status: 1, createdAt: 1 }).lean();

  res.json({ data: games });
});

export const getGameContent = asyncHandler(async (req, res) => {
  const gameId = sanitizeGameId(req.params.gameId);
  const payload = await getContentPayload(gameId);

  res.json({ data: payload });
});

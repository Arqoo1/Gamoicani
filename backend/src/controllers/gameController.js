import { ContentPack } from "../models/ContentPack.js";
import { Game } from "../models/Game.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { createHttpError, sanitizeGameId } from "../utils/validators.js";

export const listGames = asyncHandler(async (req, res) => {
  // Sort by status ascending ("ready" comes before "soon" alphabetically), then by createdAt
  const games = await Game.find({}).sort({ status: 1, createdAt: 1 }).lean();

  res.json({ data: games });
});

export const getGameContent = asyncHandler(async (req, res) => {
  const gameId = sanitizeGameId(req.params.gameId);
  const contentPack = await ContentPack.findOne({ gameId }).lean();

  if (!contentPack) {
    throw createHttpError(404, "Game content not found");
  }

  res.json({ data: contentPack.payload });
});

import { User } from "../models/User.js";
import { ScoreEvent } from "../models/ScoreEvent.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { createHttpError, normalizeUsername } from "../utils/validators.js";
import { serializeProfileStats, serializeUser } from "../utils/userPresenter.js";

export const getUserByUsername = asyncHandler(async (req, res) => {
  const username = normalizeUsername(req.params.username);
  const user = await User.findOne({ username });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  const scoreEvents = await ScoreEvent.find({ user: user._id }).select("attempts gameId won").lean();

  res.json({
    data: {
      ...serializeUser(user),
      profileStats: serializeProfileStats(scoreEvents)
    }
  });
});

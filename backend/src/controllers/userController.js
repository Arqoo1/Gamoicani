import { User } from "../models/User.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { createHttpError, normalizeUsername } from "../utils/validators.js";

export const getUserByUsername = asyncHandler(async (req, res) => {
  const username = normalizeUsername(req.params.username);
  const user = await User.findOne({ username }).lean();

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  res.json({ data: user });
});

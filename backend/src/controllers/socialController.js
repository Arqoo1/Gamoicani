import { asyncHandler } from "../middleware/asyncHandler.js";
import { ScoreEvent } from "../models/ScoreEvent.js";
import { User } from "../models/User.js";

export const getFeed = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("friends", "_id").lean();
  const friendIds = (user.friends ?? []).map((f) => (f._id ?? f).toString());

  const allIds = [req.user._id, ...friendIds];

  const events = await ScoreEvent.find({
    user: { $in: allIds },
    won: true,
  })
    .sort({ occurredAt: -1 })
    .limit(50)
    .populate("user", "username displayName avatarColor profilePhotoUrl")
    .lean();

  res.json({
    data: events.map((ev) => ({
      id: ev._id,
      gameId: ev.gameId,
      mode: ev.mode,
      points: ev.points,
      attempts: ev.attempts,
      occurredAt: ev.occurredAt,
      user: {
        id: ev.user._id,
        username: ev.user.username,
        displayName: ev.user.displayName,
        avatarColor: ev.user.avatarColor,
        profilePhotoUrl: ev.user.profilePhotoUrl,
      },
    })),
  });
});

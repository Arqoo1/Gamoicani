import { recordScore } from "../services/scoreService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const createScore = asyncHandler(async (req, res) => {
  const result = await recordScore(req.user, req.body);

  res.status(result.duplicate ? 200 : 201).json({
    data: {
      duplicate: result.duplicate,
      event: {
        completionMethod: result.scoreEvent.completionMethod,
        gameId: result.scoreEvent.gameId,
        mode: result.scoreEvent.mode,
        points: result.scoreEvent.points,
        puzzleKey: result.scoreEvent.puzzleKey,
        streakKey: result.scoreEvent.streakKey,
        won: result.scoreEvent.won
      },
      user: {
        displayName: result.user.displayName,
        gameStats: Object.fromEntries(result.user.gameStats ?? []),
        totalPoints: result.user.totalPoints,
        username: result.user.username
      }
    }
  });
});

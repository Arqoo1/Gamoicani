import { User } from "../models/User.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { parseLimit, sanitizeGameId } from "../utils/validators.js";

function getGameStat(user, gameId) {
  return user.gameStats?.[gameId] ?? {};
}

async function getRankByField(fieldPath, value) {
  if (!value || value <= 0) {
    return null;
  }

  return (await User.countDocuments({ [fieldPath]: { $gt: value } })) + 1;
}

export const getGlobalLeaderboard = asyncHandler(async (req, res) => {
  const limit = parseLimit(req.query.limit, 10);
  const users = await User.find({})
    .sort({ totalPoints: -1, updatedAt: 1 })
    .limit(limit)
    .lean();

  res.json({
    data: users.map((user, index) => ({
      displayName: user.displayName,
      rank: index + 1,
      totalPoints: user.totalPoints,
      username: user.username
    }))
  });
});

export const getGamePointsLeaderboard = asyncHandler(async (req, res) => {
  const gameId = sanitizeGameId(req.params.gameId);
  const limit = parseLimit(req.query.limit, 10);
  const pointsPath = `gameStats.${gameId}.points`;
  const users = await User.find({ [pointsPath]: { $gt: 0 } })
    .sort({ [pointsPath]: -1, updatedAt: 1 })
    .limit(limit)
    .lean();

  res.json({
    data: users.map((user, index) => {
      const stats = getGameStat(user, gameId);

      return {
        displayName: user.displayName,
        points: stats.points ?? 0,
        rank: index + 1,
        username: user.username,
        wins: stats.wins ?? 0
      };
    })
  });
});

export const getStreakLeaderboard = asyncHandler(async (req, res) => {
  const gameId = sanitizeGameId(req.params.gameId);
  const limit = parseLimit(req.query.limit, 10);
  const metric = req.query.metric === "current" ? "currentStreak" : "maxStreak";
  const streakPath = `gameStats.${gameId}.${metric}`;
  const users = await User.find({ [streakPath]: { $gt: 0 } })
    .sort({ [streakPath]: -1, [`gameStats.${gameId}.points`]: -1, updatedAt: 1 })
    .limit(limit)
    .lean();

  res.json({
    data: users.map((user, index) => {
      const stats = getGameStat(user, gameId);

      return {
        displayName: user.displayName,
        gameId,
        metric,
        points: stats.points ?? 0,
        rank: index + 1,
        streak: stats[metric] ?? 0,
        username: user.username
      };
    })
  });
});

export const getMyLeaderboardRanks = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).lean();
  const wordleStats = getGameStat(user, "wordle");
  const andazebiStats = getGameStat(user, "andazebi");
  const triviaStats = getGameStat(user, "trivia");

  res.json({
    data: {
      andazebi: {
        points: andazebiStats.points ?? 0,
        pointsRank: await getRankByField("gameStats.andazebi.points", andazebiStats.points ?? 0),
        streak: andazebiStats.maxStreak ?? 0,
        streakRank: await getRankByField("gameStats.andazebi.maxStreak", andazebiStats.maxStreak ?? 0)
      },
      global: {
        rank: await getRankByField("totalPoints", user.totalPoints ?? 0),
        totalPoints: user.totalPoints ?? 0
      },
      wordle: {
        points: wordleStats.points ?? 0,
        pointsRank: await getRankByField("gameStats.wordle.points", wordleStats.points ?? 0),
        streak: wordleStats.maxStreak ?? 0,
        streakRank: await getRankByField("gameStats.wordle.maxStreak", wordleStats.maxStreak ?? 0)
      },
      trivia: {
        points: triviaStats.points ?? 0,
        pointsRank: await getRankByField("gameStats.trivia.points", triviaStats.points ?? 0),
        streak: triviaStats.maxStreak ?? 0,
        streakRank: await getRankByField("gameStats.trivia.maxStreak", triviaStats.maxStreak ?? 0)
      }
    }
  });
});

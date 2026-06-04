import { recordScore } from "../services/scoreService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ScoreEvent } from "../models/ScoreEvent.js";
import { getAchievementDefinitions } from "../hooks/scoreEvents.js";
import { serializeUser } from "../utils/userPresenter.js";
import { sanitizeGameId } from "../utils/validators.js";

function getGameStat(user, gameId) {
  const value = user.gameStats?.get?.(gameId) ?? user.gameStats?.[gameId] ?? {};
  const source = value?.toObject?.() ?? value;

  return {
    currentStreak: source.currentStreak ?? 0,
    lastCompletedKey: source.lastCompletedKey ?? null,
    lastPlayedAt: source.lastPlayedAt ?? null,
    maxStreak: source.maxStreak ?? 0,
    plays: source.plays ?? 0,
    points: source.points ?? 0,
    wins: source.wins ?? 0
  };
}

function serializeAchievements(user) {
  const definitions = getAchievementDefinitions();

  return (user.achievements ?? []).map((achievement) => ({
    ...(definitions[achievement.id] ?? {}),
    earnedAt: achievement.earnedAt,
    id: achievement.id
  }));
}

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
      user: serializeUser(result.user)
    }
  });
});

export const getMyGameSummary = asyncHandler(async (req, res) => {
  const gameId = sanitizeGameId(req.params.gameId);
  const events = await ScoreEvent.find({
    gameId,
    mode: "daily",
    user: req.user._id
  })
    .sort({ occurredAt: 1 })
    .lean();
  const stats = getGameStat(req.user, gameId);
  const guessDistribution = [0, 0, 0, 0, 0, 0];
  const completedPuzzles = {};
  const dailyResults = {};

  events.forEach((event) => {
    if (gameId === "wordle" && event.won && event.attempts >= 1 && event.attempts <= 6) {
      guessDistribution[event.attempts - 1] += 1;
    }

    if (event.puzzleKey) {
      completedPuzzles[event.puzzleKey] = {
        completedAt: event.occurredAt,
        guesses: event.attempts ?? 0,
        won: event.won
      };
    }

    if (gameId === "trivia" && event.puzzleKey) {
      dailyResults[event.puzzleKey] = {
        completedAt: event.occurredAt,
        correctCount: event.metadata?.correctCount ?? 0,
        points: event.points ?? 0,
        totalQuestions: event.metadata?.totalQuestions ?? event.attempts ?? 0,
        won: event.won
      };
    }
  });

  res.json({
    data: {
      achievements: serializeAchievements(req.user),
      completedPuzzles,
      currentStreak: stats.currentStreak,
      dailyResults,
      gameId,
      guessDistribution,
      lastCompletedKey: stats.lastCompletedKey,
      maxStreak: stats.maxStreak,
      played: stats.plays || events.length,
      points: stats.points,
      wins: stats.wins || events.filter((event) => event.won).length
    }
  });
});

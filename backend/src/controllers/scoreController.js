import { recordScore } from "../services/scoreService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ScoreEvent } from "../models/ScoreEvent.js";
import { getAchievementDefinitions, applyScoreEventToUser } from "../hooks/scoreEvents.js";
import { serializeUser } from "../utils/userPresenter.js";
import { sanitizeGameId } from "../utils/validators.js";
import { calculatePoints } from "../utils/points.js";
import { getGeorgianDateKey, ensureDailyQuests, evaluateQuests } from "../services/questService.js";
import { getContentPayload } from "../services/contentPackCache.js";

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

export const repairMyStats = asyncHandler(async (req, res) => {
  const user = req.user;
  const completions = Array.isArray(req.body.completions) ? req.body.completions : [];

  let answers = [];
  try {
    const content = await getContentPayload("wordle");
    answers = (content.answers ?? [])
      .map((w) => String(w).trim())
      .filter((w) => Array.from(String(w)).length === 5);
  } catch {
  }

  let created = 0;
  for (const completion of completions.slice(0, 60)) {
    const puzzleKey = String(completion.puzzleKey ?? "").trim();
    const puzzleNumber = parseInt(puzzleKey, 10);
    if (!puzzleNumber || puzzleNumber < 1) continue;

    const won = Boolean(completion.won);
    const guesses = Array.isArray(completion.guesses)
      ? completion.guesses.map((g) => String(g).trim()).filter(Boolean)
      : [];
    const attempts = guesses.length > 0 ? guesses.length : Number(completion.attempts);
    if (!attempts || attempts < 1 || attempts > 6) continue;

    if (won && guesses.length > 0 && answers.length > 0) {
      const expectedAnswer = answers[(puzzleNumber - 1) % answers.length];
      if (guesses[guesses.length - 1] !== expectedAnswer) continue;
    }

    const eventKey = `${user._id}:wordle:daily:${puzzleKey}`;
    const existing = await ScoreEvent.findOne({ eventKey });
    if (existing) continue;

    const occurredAt = completion.completedAt ? new Date(completion.completedAt) : new Date();
    const points = calculatePoints({ attempts, gameId: "wordle", won });

    try {
      await ScoreEvent.create({
        affectsStreak: true,
        attempts,
        completionMethod: won ? "solved" : "lost",
        eventKey,
        gameId: "wordle",
        level: null,
        metadata: { guesses, repaired: true },
        mode: "daily",
        occurredAt,
        points,
        puzzleKey,
        streakKey: null,
        user: user._id,
        won
      });
      created++;
    } catch (err) {
      if (err?.code !== 11000) {
        console.error("[repair] ScoreEvent.create error:", err.message);
      }
    }
  }

  const allEvents = await ScoreEvent.find({ user: user._id }).sort({ occurredAt: 1 });

  user.gameStats = new Map();
  user.totalPoints = 0;
  user.achievements = [];
  user.dailyQuests = { dateKey: "", quests: [], bonusClaimed: false };

  const todayKey = getGeorgianDateKey();
  const todayEvents = [];

  for (const event of allEvents) {
    const eventDayKey = getGeorgianDateKey(event.occurredAt);
    if (eventDayKey === todayKey) todayEvents.push(event);
    applyStatsOnly(user, event);
  }

  ensureDailyQuests(user, new Date());
  for (const event of todayEvents) {
    evaluateQuests(user, event);
  }

  await user.save();

  res.json({
    data: {
      created,
      replayedEvents: allEvents.length,
      user: serializeUser(user)
    }
  });
});

function applyStatsOnly(user, scoreEvent) {
  const rawStat = user.gameStats.get(scoreEvent.gameId);
  const source = rawStat?.toObject?.() ?? rawStat ?? {};
  const currentStat = {
    currentStreak: source.currentStreak ?? 0,
    lastCompletedKey: source.lastCompletedKey ?? null,
    lastPlayedAt: source.lastPlayedAt ?? null,
    maxStreak: source.maxStreak ?? 0,
    plays: source.plays ?? 0,
    points: source.points ?? 0,
    wins: source.wins ?? 0
  };

  const nextStat = {
    ...currentStat,
    lastPlayedAt: scoreEvent.occurredAt,
    plays: currentStat.plays + 1,
    points: currentStat.points + scoreEvent.points,
    wins: currentStat.wins + (scoreEvent.won ? 1 : 0)
  };

  user.totalPoints += scoreEvent.points;

  if (!scoreEvent.affectsStreak) {
    user.gameStats.set(scoreEvent.gameId, nextStat);
    return;
  }

  const progressKey = scoreEvent.streakKey ?? scoreEvent.puzzleKey;
  if (scoreEvent.won) {
    let continuesStreak = false;
    if (scoreEvent.gameId === "wordle" && currentStat.lastCompletedKey && progressKey) {
      continuesStreak =
        parseInt(progressKey, 10) - parseInt(currentStat.lastCompletedKey, 10) === 1;
    } else if (currentStat.lastCompletedKey && progressKey) {
      const diffDays = Math.round(
        (new Date(progressKey) - new Date(currentStat.lastCompletedKey)) / 86400000
      );
      continuesStreak = diffDays === 1;
    }
    nextStat.currentStreak = continuesStreak ? currentStat.currentStreak + 1 : 1;
    nextStat.lastCompletedKey = progressKey ?? currentStat.lastCompletedKey;
    nextStat.maxStreak = Math.max(currentStat.maxStreak, nextStat.currentStreak);
  } else {
    nextStat.currentStreak = 0;
    nextStat.lastCompletedKey = progressKey ?? currentStat.lastCompletedKey;
  }

  user.gameStats.set(scoreEvent.gameId, nextStat);
  awardAchievementsOnly(user, scoreEvent);
}

function awardAchievementsOnly(user, scoreEvent) {
  if (!scoreEvent.won) return;

  const defs = getAchievementDefinitions();
  const achievements = user.achievements ?? [];

  function ensure(id, earnedAt = scoreEvent.occurredAt) {
    if (!defs[id]) return;
    if (achievements.some((a) => a.id === id)) return;
    achievements.push({ earnedAt, id });
    user.achievements = achievements;
  }

  ensure("first-win");

  if (scoreEvent.gameId === "wordle" && [1, 2, 3].includes(scoreEvent.attempts)) {
    ensure(`wordle-${scoreEvent.attempts}`);
  }

  const rawStat = user.gameStats.get(scoreEvent.gameId);
  const stat = rawStat?.toObject?.() ?? rawStat ?? {};
  if ((stat.currentStreak ?? 0) >= 7) {
    ensure("streak-7");
    ensure("perfect-week");
  }

  const allPlayed = ["wordle", "andazebi", "trivia"].every((gid) => {
    const s = user.gameStats.get(gid);
    const ss = s?.toObject?.() ?? s ?? {};
    return (ss.plays ?? 0) > 0;
  });
  if (allPlayed) ensure("all-games");
}

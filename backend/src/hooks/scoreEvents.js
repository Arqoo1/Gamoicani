import { isConsecutiveProgress } from "../utils/streaks.js";

function emptyGameStat() {
  return {
    currentStreak: 0,
    lastCompletedKey: null,
    lastPlayedAt: null,
    maxStreak: 0,
    plays: 0,
    points: 0,
    wins: 0
  };
}

function plainGameStat(value) {
  const source = value?.toObject?.() ?? value ?? {};

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

export function applyScoreEventToUser(user, scoreEvent) {
  const currentStat = plainGameStat(user.gameStats.get(scoreEvent.gameId) ?? emptyGameStat());
  const nextStat = {
    ...currentStat,
    lastPlayedAt: scoreEvent.occurredAt,
    plays: currentStat.plays + 1,
    points: currentStat.points + scoreEvent.points,
    wins: currentStat.wins + (scoreEvent.won ? 1 : 0)
  };

  if (!scoreEvent.affectsStreak) {
    user.totalPoints += scoreEvent.points;
    user.gameStats.set(scoreEvent.gameId, nextStat);

    return user;
  }

  if (scoreEvent.won) {
    const progressKey = scoreEvent.streakKey ?? scoreEvent.puzzleKey;
    const continuesStreak = isConsecutiveProgress(
      scoreEvent.gameId,
      currentStat.lastCompletedKey,
      progressKey
    );
    nextStat.currentStreak = continuesStreak ? currentStat.currentStreak + 1 : 1;
    nextStat.lastCompletedKey = progressKey ?? currentStat.lastCompletedKey;
    nextStat.maxStreak = Math.max(currentStat.maxStreak, nextStat.currentStreak);
  } else {
    nextStat.currentStreak = 0;
  }

  user.totalPoints += scoreEvent.points;
  user.gameStats.set(scoreEvent.gameId, nextStat);

  return user;
}

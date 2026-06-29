export function serializeUser(user) {
  const source = user?.toObject?.() ?? user;
  const rawGameStats =
    user?.gameStats instanceof Map
      ? Object.fromEntries(user.gameStats)
      : source.gameStats instanceof Map
        ? Object.fromEntries(source.gameStats)
        : source.gameStats ?? {};
  const gameStats = Object.fromEntries(
    Object.entries(rawGameStats).map(([gameId, stat]) => {
      const value = stat?.toObject?.() ?? stat ?? {};

      return [
        gameId,
        {
          currentStreak: value.currentStreak ?? 0,
          lastCompletedKey: value.lastCompletedKey ?? null,
          lastPlayedAt: value.lastPlayedAt ?? null,
          maxStreak: value.maxStreak ?? 0,
          plays: value.plays ?? 0,
          points: value.points ?? 0,
          wins: value.wins ?? 0
        }
      ];
    })
  );

  return {
    achievements: (source.achievements ?? []).map((achievement) => ({
      earnedAt: achievement.earnedAt,
      id: achievement.id
    })),
    avatarColor: source.avatarColor ?? "#2f9e5d",
    bio: source.bio ?? "",
    coverGradient: source.coverGradient ?? 0,
    coverPhotoUrl: source.coverPhotoUrl ?? null,
    createdAt: source.createdAt ?? null,
    displayName: source.displayName,
    email: source.email ?? null,
    gameStats,
    id: String(source._id),
    profilePhotoUrl: source.profilePhotoUrl ?? null,
    role: source.role ?? "user",
    totalPoints: source.totalPoints ?? 0,
    username: source.username,
    dailyQuests: source.dailyQuests ?? null
  };
}

export function serializeUser(user) {
  const source = user?.toObject?.() ?? user;
  const gameStats =
    source.gameStats instanceof Map
      ? Object.fromEntries(source.gameStats)
      : source.gameStats ?? {};

  return {
    achievements: (source.achievements ?? []).map((achievement) => ({
      earnedAt: achievement.earnedAt,
      id: achievement.id
    })),
    displayName: source.displayName,
    email: source.email ?? null,
    gameStats,
    id: String(source._id),
    role: source.role ?? "user",
    totalPoints: source.totalPoints ?? 0,
    username: source.username
  };
}

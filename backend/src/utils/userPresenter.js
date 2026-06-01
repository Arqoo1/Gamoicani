export function serializeUser(user) {
  const source = user?.toObject?.() ?? user;

  return {
    displayName: source.displayName,
    email: source.email ?? null,
    id: String(source._id),
    role: source.role ?? "user",
    totalPoints: source.totalPoints ?? 0,
    username: source.username
  };
}

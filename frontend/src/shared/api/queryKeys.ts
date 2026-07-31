export const queryKeys = {
  friends: {
    all:      () => ["friends"] as const,
    list:     () => ["friends", "list"] as const,
    requests: () => ["friends", "requests"] as const,
    search:   (query: string) => ["friends", "search", query] as const,
  },

  profile: {
    all:    () => ["profile"] as const,
    public: (username: string) => ["profile", "public", username] as const,
  },

  leaderboard: {
    all:    () => ["leaderboard"] as const,
    period: (period: string) => ["leaderboard", period] as const,
  },

  scores: {
    all:  () => ["scores"] as const,
    feed: () => ["scores", "feed"] as const,
    summary: (gameId: string) => ["scores", "summary", gameId] as const,
  },
} as const;

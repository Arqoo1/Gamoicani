export const ALLOWED_SCREENS: Record<string, string> = {
  home: "/",
  wordle: "/wordle",
  andazebi: "/andazebi",
  profile: "/profile",
  leaderboard: "/leaderboard",
  shop: "/shop",
  stats: "/stats",
  settings: "/settings",
  lobby: "/lobby",
};

export function resolveAllowedRoute(targetScreen: string) {
  return ALLOWED_SCREENS[targetScreen] || (Object.values(ALLOWED_SCREENS).includes(targetScreen) ? targetScreen : undefined);
}

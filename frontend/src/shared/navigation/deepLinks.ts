import { Href } from "expo-router";

const ALLOWED_NOTIFICATION_SCREENS = {
  home: "/",
  wordle: "/wordle",
  andazebi: "/andazebi",
  profile: "/profile",
  lobby: "/lobby",
  shop: "/shop",
  leaderboard: "/leaderboard",
  settings: "/settings",
  stats: "/stats",
  feed: "/feed",
} as const satisfies Record<string, Href>;

export type NotificationScreenKey = keyof typeof ALLOWED_NOTIFICATION_SCREENS;

export function resolveNotificationRoute(screen: unknown): Href | null {
  if (typeof screen !== "string") return null;
  const key = screen as NotificationScreenKey;
  return ALLOWED_NOTIFICATION_SCREENS[key] ?? null;
}

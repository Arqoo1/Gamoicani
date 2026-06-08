import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

type ApiEnvelope<T> = {
  data: T;
};

export type AuthUser = {
  achievements: UserAchievement[];
  avatarColor: string;
  bio: string;
  coverGradient: number;
  createdAt: string | null;
  displayName: string;
  email: string | null;
  gameStats: Record<string, GameStat>;
  id: string;
  role: "user" | "admin";
  totalPoints: number;
  username: string;
};

export type GameStat = {
  currentStreak: number;
  lastCompletedKey: string | null;
  lastPlayedAt: string | null;
  maxStreak: number;
  plays: number;
  points: number;
  wins: number;
};

export type UserAchievement = {
  description?: string;
  earnedAt: string;
  id: string;
  title?: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type ScorePayload = {
  attempts?: number;
  clientEventId?: string;
  completionMethod?: "solved" | "lost" | "revealed" | "skipped";
  gameId: string;
  guesses?: string[];
  itemId?: string;
  level?: "easy" | "medium" | "hard";
  metadata?: Record<string, unknown>;
  mode?: "daily" | "practice";
  puzzleKey?: string;
  streakKey?: string;
  won: boolean;
};

export type GameItem = {
  contentPath?: string | null;
  gameId?: string;
  href?: string | null;
  id?: string;
  status: "ready" | "soon";
  subtitle: string;
  title: string;
};

export type LeaderboardEntry = {
  displayName: string;
  gameId?: string;
  metric?: string;
  points?: number;
  rank: number;
  streak?: number;
  totalPoints?: number;
  username: string;
  wins?: number;
};

export type MyLeaderboardRanks = {
  andazebi: {
    points: number;
    pointsRank: number | null;
    streak: number;
    streakRank: number | null;
  };
  global: {
    rank: number | null;
    totalPoints: number;
  };
  wordle: {
    points: number;
    pointsRank: number | null;
    streak: number;
    streakRank: number | null;
  };
  trivia: {
    points: number;
    pointsRank: number | null;
    streak: number;
    streakRank: number | null;
  };
};

export type ScoreResult = {
  duplicate: boolean;
  event: {
    completionMethod: string;
    gameId: string;
    mode: string;
    points: number;
    puzzleKey: string | null;
    streakKey: string | null;
    won: boolean;
  };
  user: AuthUser;
};

export type GameSummary = {
  achievements: UserAchievement[];
  completedPuzzles: Record<
    string,
    {
      completedAt: string;
      guesses: number;
      won: boolean;
    }
  >;
  currentStreak: number;
  dailyResults: Record<
    string,
    {
      completedAt: string;
      correctCount: number;
      points: number;
      totalQuestions: number;
      won: boolean;
    }
  >;
  gameId: string;
  guessDistribution: number[];
  lastCompletedKey: string | null;
  maxStreak: number;
  played: number;
  points: number;
  wins: number;
};

const TOKEN_STORAGE_KEY = "auth:token:v1";
const defaultApiUrl = Platform.OS === "android" ? "http://10.0.2.2:4000/api" : "http://localhost:4000/api";
export const API_BASE_URL = process?.env?.EXPO_PUBLIC_API_URL ?? defaultApiUrl;

export async function getAuthToken() {
  return AsyncStorage.getItem(TOKEN_STORAGE_KEY);
}

export async function setAuthToken(token: string) {
  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export async function clearAuthToken() {
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function requestJson<T>(path: string, init?: RequestInit & { auth?: boolean }) {
  const token = init?.auth === false ? null : await getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    }
  });

  const payload = (await response.json().catch(() => ({}))) as Partial<ApiEnvelope<T>> & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `API request failed with ${response.status}`);
  }

  return payload as ApiEnvelope<T>;
}

export async function registerAccount(input: {
  displayName: string;
  email: string;
  password: string;
  username: string;
}) {
  const response = await requestJson<AuthResponse>("/auth/register", {
    auth: false,
    body: JSON.stringify(input),
    method: "POST"
  });

  await setAuthToken(response.data.token);

  return response.data;
}

export async function loginAccount(input: { email: string; password: string }) {
  const response = await requestJson<AuthResponse>("/auth/login", {
    auth: false,
    body: JSON.stringify(input),
    method: "POST"
  });

  await setAuthToken(response.data.token);

  return response.data;
}

export async function fetchMe() {
  const response = await requestJson<{ user: AuthUser }>("/me");

  return response.data.user;
}

export async function updateMyProfile(input: {
  avatarColor?: string;
  bio?: string;
  coverGradient?: number;
  coverPhotoUrl?: string | null;
  displayName?: string;
  profilePhotoUrl?: string | null;
  username?: string;
}) {
  const response = await requestJson<AuthResponse>("/auth/me", {
    body: JSON.stringify(input),
    method: "PATCH"
  });

  await setAuthToken(response.data.token);

  return response.data;
}

export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  const response = await requestJson<{ message: string }>("/auth/change-password", {
    body: JSON.stringify(input),
    method: "POST"
  });

  return response.data;
}

export async function submitScore(payload: ScorePayload) {
  try {
    const response = await requestJson<ScoreResult>("/scores", {
      body: JSON.stringify(payload),
      method: "POST"
    });

    return response.data;
  } catch {
    return null;
  }
}

export async function fetchGames() {
  const response = await requestJson<GameItem[]>("/games", { auth: false });

  return response.data;
}

export async function fetchGameContent<T>(gameId: string) {
  const response = await requestJson<T>(`/games/${gameId}/content`, { auth: false });

  return response.data;
}

export async function fetchGlobalLeaderboard(limit = 10) {
  const response = await requestJson<LeaderboardEntry[]>(`/leaderboards/global?limit=${limit}`, {
    auth: false
  });

  return response.data;
}

export async function fetchGamePointsLeaderboard(gameId: string, limit = 10) {
  const response = await requestJson<LeaderboardEntry[]>(
    `/leaderboards/${gameId}/points?limit=${limit}`,
    { auth: false }
  );

  return response.data;
}

export async function fetchStreakLeaderboard(gameId: string, limit = 10) {
  const response = await requestJson<LeaderboardEntry[]>(
    `/leaderboards/${gameId}/streaks?metric=max&limit=${limit}`,
    { auth: false }
  );

  return response.data;
}

export async function fetchMyLeaderboardRanks() {
  const response = await requestJson<MyLeaderboardRanks>("/leaderboards/me");

  return response.data;
}

export async function fetchMyGameSummary(gameId: string) {
  const response = await requestJson<GameSummary>(`/scores/me/${gameId}`);

  return response.data;
}

async function uploadFile(path: string, uri: string) {
  const token = await getAuthToken();
  const formData = new FormData();
  
  const filename = uri.split("/").pop() || "photo.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : "image/jpeg";

  formData.append("photo", {
    name: filename,
    type,
    uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri
  } as any);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Upload failed with ${response.status}`);
  }

  return payload as ApiEnvelope<AuthResponse>;
}

export async function uploadProfilePhoto(uri: string) {
  const response = await uploadFile("/uploads/avatar", uri);
  await setAuthToken(response.data.token);
  return response.data;
}

export async function uploadCoverPhoto(uri: string) {
  const response = await uploadFile("/uploads/cover", uri);
  await setAuthToken(response.data.token);
  return response.data;
}

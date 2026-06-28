import { LeaderboardEntry, MyLeaderboardRanks } from "@/entities/score/types";
import { requestJson } from "@/shared/api/client";

export async function fetchGlobalLeaderboard(limit = 10, friendsOnly = false) {
  const query = new URLSearchParams({ limit: limit.toString() });
  if (friendsOnly) query.append("friendsOnly", "true");

  const response = await requestJson<LeaderboardEntry[]>(`/leaderboards/global?${query.toString()}`, {
    auth: friendsOnly
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

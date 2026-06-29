import { FriendRequest, FriendUser } from "@/entities/user/types";
import { requestJson } from "@/shared/api/client";

type RawFriendRequest = FriendRequest | {
  createdAt: string;
  user?: FriendUser;
};

export async function searchUsers(query: string) {
  const response = await requestJson<FriendUser[]>(`/friends/search?q=${encodeURIComponent(query)}`);
  return response.data;
}

export async function sendFriendRequest(userId: string) {
  const response = await requestJson<{ message: string }>("/friends/request", {
    body: JSON.stringify({ userId }),
    method: "POST"
  });
  return response.data;
}

export async function acceptFriendRequest(userId: string) {
  const response = await requestJson<{ message: string }>("/friends/accept", {
    body: JSON.stringify({ userId }),
    method: "POST"
  });
  return response.data;
}

export async function rejectFriendRequest(userId: string) {
  const response = await requestJson<{ message: string }>("/friends/reject", {
    body: JSON.stringify({ userId }),
    method: "POST"
  });
  return response.data;
}

export async function removeFriend(userId: string) {
  const response = await requestJson<{ message: string }>(`/friends/${userId}`, {
    method: "DELETE"
  });
  return response.data;
}

export async function listFriends() {
  const response = await requestJson<FriendUser[]>("/friends");
  return response.data;
}

export async function listFriendRequests() {
  const response = await requestJson<RawFriendRequest[]>("/friends/requests");

  return response.data
    .map((request) => ({
      createdAt: request.createdAt,
      from: "from" in request ? request.from : request.user
    }))
    .filter((request): request is FriendRequest => Boolean(request.from));
}

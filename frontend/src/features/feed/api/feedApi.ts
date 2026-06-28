import { requestJson } from "@/shared/api/client";

export type FeedEvent = {
  id: string;
  gameId: string;
  mode: string;
  points: number;
  attempts: number | null;
  occurredAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarColor: string;
    profilePhotoUrl: string | null;
  };
};

export async function fetchSocialFeed(): Promise<FeedEvent[]> {
  const response = await requestJson<FeedEvent[]>("/social/feed");
  return response.data;
}

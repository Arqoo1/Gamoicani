import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { FriendRequest, FriendUser } from "@/entities/user/types";
import { listFriendRequests, listFriends, searchUsers } from "@/features/social/api/friendsApi";
import { queryKeys } from "@/shared/api/queryKeys";

function getRequestUser(request: FriendRequest & { user?: FriendUser }) {
  return request.from ?? request.user ?? null;
}

export function useFriendsData(enabled: boolean) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: friends = [] } = useQuery({
    queryKey: queryKeys.friends.list(),
    queryFn: listFriends,
    enabled,
    staleTime: 30_000,
  });

  const { data: requests = [] } = useQuery({
    queryKey: queryKeys.friends.requests(),
    queryFn: listFriendRequests,
    enabled,
    staleTime: 15_000,
  });

  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: queryKeys.friends.search(searchQuery),
    queryFn: () => searchUsers(searchQuery),
    enabled: enabled && searchQuery.length >= 2,
    staleTime: 10_000,
  });

  const safeRequests = useMemo(
    () =>
      requests
        .map((request) => ({
          createdAt: request.createdAt,
          from: getRequestUser(request),
        }))
        .filter((request): request is FriendRequest => Boolean(request.from)),
    [requests]
  );

  return {
    friends,
    isSearching,
    safeRequests,
    searchQuery,
    searchResults,
    setSearchQuery,
  };
}

import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { FriendRequest, FriendUser } from "@/entities/user/types";
import {
  acceptFriendRequest,
  listFriendRequests,
  listFriends,
  rejectFriendRequest,
  removeFriend,
  searchUsers,
  sendFriendRequest
} from "@/features/social/api/friendsApi";
import { queryKeys } from "@/shared/api/queryKeys";

function getRequestUser(request: FriendRequest & { user?: FriendUser }) {
  return request.from ?? request.user ?? null;
}

export function useProfileFriends(enabled: boolean) {
  const queryClient = useQueryClient();
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

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const invalidateFriends = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.friends.all() });
  }, [queryClient]);

  const sendMutation = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: (_, id) => {
      Alert.alert("გაგზავნილია", "მეგობრობის მოთხოვნა გაგზავნილია!");
      queryClient.setQueryData<FriendUser[]>(
        queryKeys.friends.search(searchQuery),
        (prev) => prev?.filter((u) => u.id !== id) ?? []
      );
    },
    onError: (e) => {
      Alert.alert("შეცდომა", e instanceof Error ? e.message : "ვერ გაიგზავნა");
    },
  });

  const acceptMutation = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: invalidateFriends,
    onError: (e) => {
      Alert.alert("შეცდომა", e instanceof Error ? e.message : "ვერ მივიღეთ");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess: invalidateFriends,
  });

  const removeMutation = useMutation({
    mutationFn: removeFriend,
    onSuccess: invalidateFriends,
  });

  const handleSendRequest = useCallback(
    (id: string) => sendMutation.mutate(id),
    [sendMutation]
  );

  const handleAcceptRequest = useCallback(
    (id: string) => acceptMutation.mutate(id),
    [acceptMutation]
  );

  const handleRejectRequest = useCallback(
    (id: string) => rejectMutation.mutate(id),
    [rejectMutation]
  );

  const handleRemoveFriend = useCallback(
    (id: string) => {
      Alert.alert("წაშლა", "ნამდვილად გსურთ მეგობრის წაშლა?", [
        { text: "არა", style: "cancel" },
        {
          text: "კი",
          style: "destructive",
          onPress: () => removeMutation.mutate(id),
        },
      ]);
    },
    [removeMutation]
  );

  const safeRequests = useMemo(
    () =>
      requests
        .map((request) => ({
          createdAt: request.createdAt,
          from: getRequestUser(request)
        }))
        .filter((request): request is FriendRequest => Boolean(request.from)),
    [requests]
  );

  return {
    friends,
    handleAcceptRequest,
    handleRejectRequest,
    handleRemoveFriend,
    handleSearch,
    handleSendRequest,
    isSearching,
    safeRequests,
    searchQuery,
    searchResults,
  };
}

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "@/features/social/api/friendsApi";
import { queryKeys } from "@/shared/api/queryKeys";

export function useFriendsActions(searchQuery: string) {
  const queryClient = useQueryClient();

  const invalidateFriends = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.friends.all() });
  }, [queryClient]);

  const sendMutation = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: (_, id) => {
      queryClient.setQueryData(
        queryKeys.friends.search(searchQuery),
        (prev: Array<{ id: string }> | undefined) => prev?.filter((u) => u.id !== id) ?? []
      );
    },
  });

  const acceptMutation = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: invalidateFriends,
  });

  const rejectMutation = useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess: invalidateFriends,
  });

  const removeMutation = useMutation({
    mutationFn: removeFriend,
    onSuccess: invalidateFriends,
  });

  return {
    sendFriendRequest: sendMutation.mutateAsync,
    acceptFriendRequest: acceptMutation.mutateAsync,
    rejectFriendRequest: rejectMutation.mutateAsync,
    removeFriend: removeMutation.mutateAsync,
  };
}

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { getFriendlyErrorMessage } from "@/shared/utils/errorMessages";

import { useAuth } from "@/application/providers/auth";
import { listFriends, sendFriendRequest } from "@/features/social/api/friendsApi";
import { useLobbySocket } from "@/features/lobby/hooks/useLobbySocket";
import { queryKeys } from "@/shared/api/queryKeys";

type LobbyTab = "match" | "chat";
type SelectedUser = { id: string; displayName: string; username: string } | null;

export function useLobbyScreenController() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<LobbyTab>("match");
  const [gameType, setGameType] = useState<"wordle" | "andazebi" | "mix">("wordle");
  const [selectedUser, setSelectedUser] = useState<SelectedUser>(null);
  const [friendRequestStatus, setFriendRequestStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle"
  );

  const socketState = useLobbySocket(activeTab);

  const { data: friendsList = [] } = useQuery({
    queryKey: queryKeys.friends.list(),
    queryFn: listFriends,
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  const openUserProfile = useMemo(
    () => (username: string) => {
      router.push({ pathname: "/public-profile", params: { username } });
      setSelectedUser(null);
    },
    [router]
  );

  const handleAddFriend = async () => {
    if (!selectedUser) return;
    setFriendRequestStatus("loading");
    try {
      await sendFriendRequest(selectedUser.id);
      setFriendRequestStatus("sent");
      Alert.alert("მოთხოვნა გაიგზავნა", `${selectedUser.displayName}-ს მეგობრობის მოთხოვნა გაეგზავნა.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "მოთხოვნა ვერ გაიგზავნა.";
      setFriendRequestStatus("error");
      Alert.alert("შეცდომა", message);
    }
  };

  const onSelectUser = (userToSelect: { id: string; displayName: string; username: string }) => {
    setSelectedUser(userToSelect);
    setFriendRequestStatus("idle");
  };

  return {
    activeTab,
    friendsList,
    friendRequestStatus,
    gameType,
    handleAddFriend,
    onSelectUser,
    openUserProfile,
    router,
    selectedUser,
    setActiveTab,
    setGameType,
    setSelectedUser,
    setFriendRequestStatus,
    socketState,
    user,
  };
}

import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth, useLogoutAndGoLogin } from "@/application/providers/auth";
import { useAppTheme } from "@/application/providers/theme";
import { AuthUser } from "@/entities/user/types";
import { useFriendsActions } from "@/features/profile/hooks/useFriendsActions";
import { useFriendsData } from "@/features/profile/hooks/useFriendsData";
import { equipItem, unequipItem } from "@/features/shop/api/shopApi";
import { fetchMyGameSummary } from "@/features/scores/api/scoresApi";
import { createStyles } from "@/features/profile/screens/ProfileScreen.styles";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  COVER_GRADIENTS,
  SHOP_ITEMS_META,
  getProfileStatsSummary,
  normalizeGuessDistribution,
} from "@/features/profile/model/profileMeta";

type DailyQuest = {
  completed: boolean;
  id: string;
  progress: number;
  target: number;
  title: string;
  type: string;
};

export function useProfileController() {
  const router = useRouter();
  const {
    changePassword,
    refreshUser,
    updateProfile,
    updateUser,
    uploadCoverPhoto,
    uploadProfilePhoto,
    user,
  } = useAuth();
  const logout = useLogoutAndGoLogin();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [actionSheet, setActionSheet] = useState<"none" | "cover" | "avatar">("none");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { friends, isSearching, safeRequests, searchQuery, searchResults, setSearchQuery } = useFriendsData(
    Boolean(user)
  );
  const { acceptFriendRequest, rejectFriendRequest, removeFriend, sendFriendRequest } =
    useFriendsActions(searchQuery);

  const { data: wordleSummary } = useQuery({
    queryKey: queryKeys.scores.summary("wordle"),
    queryFn: () => fetchMyGameSummary("wordle"),
    enabled: Boolean(user),
    staleTime: 60_000,
  });

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const coverIndex = user?.coverGradient ?? 0;
  const avatarColor = user?.avatarColor ?? "#2f9e5d";
  const equippedBannerId = user?.equippedItems?.banner ?? null;
  const equippedAvatarId = user?.equippedItems?.avatar ?? null;
  const equippedNameTagId = user?.equippedItems?.nameTag ?? null;
  const equippedBannerColors = equippedBannerId ? SHOP_ITEMS_META[equippedBannerId]?.colors : null;
  const equippedAvatarEmoji = equippedAvatarId ? SHOP_ITEMS_META[equippedAvatarId]?.emoji : null;
  const equippedNameTagColor = equippedNameTagId ? SHOP_ITEMS_META[equippedNameTagId]?.color : null;
  const coverColors = equippedBannerColors
    ? ([equippedBannerColors[0], equippedBannerColors[equippedBannerColors.length - 1]] as [string, string])
    : COVER_GRADIENTS[coverIndex % COVER_GRADIENTS.length]!;

  const { bestStreak, gameEntries, totalPlays, winPct } = useMemo(() => getProfileStatsSummary(user), [user]);
  const guessDistribution = useMemo(
    () => normalizeGuessDistribution(wordleSummary?.guessDistribution),
    [wordleSummary?.guessDistribution]
  );
  const maxDist = Math.max(1, ...guessDistribution);
  const dailyQuestsData: DailyQuest[] = user?.dailyQuests?.quests ?? [];
  const bonusClaimed = user?.dailyQuests?.bonusClaimed ?? false;

  const handleCoverTap = useCallback(() => setActionSheet("cover"), []);
  const handleAvatarTap = useCallback(() => setActionSheet("avatar"), []);
  const handleLogout = useCallback(() => setShowLogoutConfirm(true), []);
  const handleSearch = useCallback((text: string) => setSearchQuery(text), [setSearchQuery]);

  const handleAvatarColor = useCallback(
    async (color: string) => {
      setShowColorPicker(false);
      setShowCoverPicker(false);
      try {
        if (user?.equippedItems?.avatar) {
          const res = await unequipItem("avatar");
          updateUser({ ...user, equippedItems: res.equippedItems });
        }
        await updateProfile({ avatarColor: color, profilePhotoUrl: null });
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Error updating avatar color");
      }
    },
    [updateProfile, updateUser, user]
  );

  const handleCoverColor = useCallback(
    async (index: number) => {
      setShowCoverPicker(false);
      setShowColorPicker(false);
      try {
        if (user?.equippedItems?.banner) {
          const res = await unequipItem("banner");
          updateUser({ ...user, equippedItems: res.equippedItems });
        }
        await updateProfile({ coverGradient: index, coverPhotoUrl: null });
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Error updating cover gradient");
      }
    },
    [updateProfile, updateUser, user]
  );

  const handleEquipShopItem = useCallback(
    async (itemId: string) => {
      setShowColorPicker(false);
      setShowCoverPicker(false);
      try {
        const category = SHOP_ITEMS_META[itemId]?.category;
        const res = await equipItem(itemId);
        if (category === "avatar") await updateProfile({ profilePhotoUrl: null });
        if (category === "banner") await updateProfile({ coverPhotoUrl: null });
        if (user) {
          updateUser({
            ...user,
            equippedItems: res.equippedItems,
            ...(category === "avatar" ? { profilePhotoUrl: null } : {}),
            ...(category === "banner" ? { coverPhotoUrl: null } : {}),
          } as AuthUser);
        }
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Error equipping item");
      }
    },
    [updateProfile, updateUser, user]
  );

  const handleUnequipShopItem = useCallback(
    async (category: string) => {
      try {
        const res = await unequipItem(category);
        if (user) updateUser({ ...user, equippedItems: res.equippedItems });
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Error unequipping item");
      }
    },
    [updateUser, user]
  );

  const handleSendRequest = useCallback(
    async (id: string) => {
      try {
        await sendFriendRequest(id);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Failed to send request");
      }
    },
    [sendFriendRequest]
  );

  const handleAcceptRequest = useCallback(
    async (id: string) => {
      try {
        await acceptFriendRequest(id);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Failed to accept request");
      }
    },
    [acceptFriendRequest]
  );

  const handleRejectRequest = useCallback(
    async (id: string) => {
      try {
        await rejectFriendRequest(id);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Failed to reject request");
      }
    },
    [rejectFriendRequest]
  );

  const handleRemoveFriend = useCallback(
    async (id: string) => {
      try {
        await removeFriend(id);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Failed to remove friend");
      }
    },
    [removeFriend]
  );

  const handleImageSelect = useCallback(
    async (kind: "cover" | "avatar") => {
      setActionSheet("none");
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: kind === "cover" ? [16, 9] : [1, 1],
        mediaTypes: ["images"],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      try {
        if (kind === "cover") {
          await uploadCoverPhoto(result.assets[0].uri);
          return;
        }
        await uploadProfilePhoto(result.assets[0].uri);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Upload failed");
      }
    },
    [uploadCoverPhoto, uploadProfilePhoto]
  );

  return {
    actionSheet,
    bonusClaimed,
    changePassword,
    colors,
    coverColors,
    dailyQuestsData,
    errorMsg,
    friends,
    gameEntries,
    handleAcceptRequest,
    handleAvatarColor,
    handleAvatarTap,
    handleCoverColor,
    handleCoverTap,
    handleEquipShopItem,
    handleImageSelect,
    handleLogout,
    handleRemoveFriend,
    handleRejectRequest,
    handleSearch,
    handleSendRequest,
    handleUnequipShopItem,
    isDark,
    isSearching,
    logout,
    maxDist,
    router,
    safeRequests,
    searchQuery,
    searchResults,
    setActionSheet,
    setErrorMsg,
    setShowColorPicker,
    setShowCoverPicker,
    setShowLogoutConfirm,
    showColorPicker,
    showCoverPicker,
    showLogoutConfirm,
    styles,
    totalPlays,
    updateProfile,
    updateUser,
    user,
    userAvatarColor: avatarColor,
    userCoverIndex: coverIndex,
    userEquippedAvatarEmoji: equippedAvatarEmoji,
    userEquippedBannerColors: equippedBannerColors,
    userEquippedNameTagColor: equippedNameTagColor,
    userEquippedAvatarId: equippedAvatarId,
    userEquippedBannerId: equippedBannerId,
    userTotalPoints: user?.totalPoints ?? 0,
    winPct,
    bestStreak,
    guessDistribution,
    wordleSummary,
  };
}

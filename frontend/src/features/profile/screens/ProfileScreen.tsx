import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth, useLogoutAndGoLogin } from "@/application/providers/auth";
import { useAppTheme } from "@/application/providers/theme";
import { changePassword as changePasswordAPI, updateMyProfile } from "@/features/auth/api/authApi";
import { useProfileFriends } from "@/features/profile/hooks/useProfileFriends";
import { useProfileActions } from "@/features/profile/hooks/useProfileActions";
import { getProfileStatsSummary, getRankInfo, normalizeGuessDistribution } from "@/features/profile/model/profileMeta";
import { ProfileActionSheets } from "@/features/profile/ui/ProfileActionSheets";
import { ProfileDialogs } from "@/features/profile/ui/ProfileDialogs";
import { ProfileFriendsSection } from "@/features/profile/ui/ProfileFriendsSection";
import { ProfileHeader } from "@/features/profile/ui/ProfileHeader";
import { ProfileHeroSection } from "@/features/profile/ui/ProfileHeroSection";
import { ProfileInfoSection } from "@/features/profile/ui/ProfileInfoSection";
import { ProfileQuestsSection } from "@/features/profile/ui/ProfileQuestsSection";
import { ProfileStatsSection } from "@/features/profile/ui/ProfileStatsSection";
import { fetchMyGameSummary } from "@/features/scores/api/scoresApi";
import { createStyles } from "@/features/profile/screens/ProfileScreen.styles";
import { queryKeys } from "@/shared/api/queryKeys";
import { SHOP_ITEMS_META, COVER_GRADIENTS } from "@/features/profile/model/profileMeta";

export default function ProfileScreen() {
  const { colors } = useAppTheme();
  const { refreshUser, updateUser, user } = useAuth();
  const logout = useLogoutAndGoLogin();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    actionSheet,
    handleAvatarTap,
    handleCoverTap,
    hideActionSheet,
    hidePickers,
    setShowColorPicker,
    setShowCoverPicker,
    showColorPicker,
    showCoverPicker,
  } = useProfileActions();

  const { friends, handleAcceptRequest, handleRejectRequest, handleRemoveFriend, handleSearch, handleSendRequest, isSearching, safeRequests, searchQuery, searchResults } = useProfileFriends(Boolean(user));

  const { data: wordleSummary } = useQuery({
    queryKey: queryKeys.scores.summary("wordle"),
    queryFn: () => fetchMyGameSummary("wordle"),
    enabled: Boolean(user),
    staleTime: 60_000,
  });

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const updateProfile = useCallback(async (input: Parameters<typeof updateMyProfile>[0]) => {
    const result = await updateMyProfile(input);
    updateUser(result.user);
  }, [updateUser]);

  const changePassword = useCallback(async (input: Parameters<typeof changePasswordAPI>[0]) => {
    await changePasswordAPI(input);
  }, []);

  const handleError = useCallback((message: string) => setErrorMsg(message), []);

  const { bestStreak, gameEntries, totalPlays, winPct } = useMemo(
    () => getProfileStatsSummary(user),
    [user?.gameStats]
  );
  const guessDistribution = useMemo(
    () => normalizeGuessDistribution(wordleSummary?.guessDistribution),
    [wordleSummary?.guessDistribution]
  );

  if (!user) return null;

  const rank = getRankInfo(user.totalPoints);
  const coverIndex = user.coverGradient ?? 0;
  const avatarColor = user.avatarColor ?? "#2f9e5d";
  const equippedBannerId = user.equippedItems?.banner ?? null;
  const equippedAvatarId = user.equippedItems?.avatar ?? null;
  const equippedNameTagId = user.equippedItems?.nameTag ?? null;
  const equippedBannerColors = equippedBannerId ? SHOP_ITEMS_META[equippedBannerId]?.colors ?? null : null;
  const equippedAvatarEmoji = equippedAvatarId ? SHOP_ITEMS_META[equippedAvatarId]?.emoji ?? null : null;
  const equippedNameTagColor = equippedNameTagId ? SHOP_ITEMS_META[equippedNameTagId]?.color ?? null : null;
  const coverColors = equippedBannerColors
    ? [equippedBannerColors[0], equippedBannerColors[equippedBannerColors.length - 1]] as [string, string]
    : (COVER_GRADIENTS[coverIndex % COVER_GRADIENTS.length] as [string, string]);
  const maxDist = Math.max(1, ...guessDistribution);
  const dailyQuestsData = user.dailyQuests?.quests || [];
  const bonusClaimed = user.dailyQuests?.bonusClaimed || false;

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <ProfileHeader colors={colors} styles={styles} />
      <ProfileHeroSection
        colors={colors}
        styles={styles}
        user={user}
        rank={rank}
        coverColors={coverColors}
        avatarColor={avatarColor}
        equippedAvatarEmoji={equippedAvatarEmoji}
        equippedNameTagColor={equippedNameTagColor}
        handleAvatarTap={handleAvatarTap}
        handleCoverTap={handleCoverTap}
      />
      <ProfileActionSheets
        actionSheet={actionSheet}
        onClose={hideActionSheet}
        onPickAvatarColor={() => setShowColorPicker(true)}
        onPickCoverColor={() => setShowCoverPicker(true)}
        colors={colors}
        styles={styles}
      />
      <ProfileInfoSection
        colors={colors}
        styles={styles}
        user={user}
        showColorPicker={showColorPicker}
        showCoverPicker={showCoverPicker}
        coverIndex={coverIndex}
        coverColors={coverColors}
        equippedAvatarId={equippedAvatarId}
        equippedBannerId={equippedBannerId}
        onSelectAvatarColor={async (color) => {
          hidePickers();
          try {
            await updateProfile({ avatarColor: color, profilePhotoUrl: null });
          } catch (e) {
            handleError(e instanceof Error ? e.message : "Error updating avatar color");
          }
        }}
        onSelectCoverColor={async (index) => {
          hidePickers();
          try {
            await updateProfile({ coverGradient: index, coverPhotoUrl: null });
          } catch (e) {
            handleError(e instanceof Error ? e.message : "Error updating cover gradient");
          }
        }}
        onEquipShopItem={async (id) => {
          hidePickers();
          try {
            const category = SHOP_ITEMS_META[id]?.category;
            const { equipItem } = await import("@/features/shop/api/shopApi");
            const result = await equipItem(id);
            updateUser({ ...user, equippedItems: result.equippedItems });
            if (category === "avatar") await updateProfile({ profilePhotoUrl: null });
            if (category === "banner") await updateProfile({ coverPhotoUrl: null });
          } catch (e) {
            handleError(e instanceof Error ? e.message : "Error equipping item");
          }
        }}
        onUnequipShopItem={async (category) => {
          try {
            const { unequipItem } = await import("@/features/shop/api/shopApi");
            const result = await unequipItem(category);
            updateUser({ ...user, equippedItems: result.equippedItems });
          } catch (e) {
            handleError(e instanceof Error ? e.message : "Error unequipping item");
          }
        }}
        updateProfile={updateProfile}
        changePassword={changePassword}
      />
      <ProfileStatsSection
        colors={colors}
        styles={styles}
        bestStreak={bestStreak}
        totalPlays={totalPlays}
        winPct={winPct}
        totalPoints={user.totalPoints}
        gameEntries={gameEntries}
        guessDistribution={guessDistribution}
        maxDist={maxDist}
      />
      <ProfileQuestsSection colors={colors} styles={styles} dailyQuestsData={dailyQuestsData} bonusClaimed={bonusClaimed} />
      <ProfileFriendsSection
        colors={colors}
        styles={styles}
        friends={friends}
        handleAcceptRequest={handleAcceptRequest}
        handleRejectRequest={handleRejectRequest}
        handleRemoveFriend={handleRemoveFriend}
        handleSearch={handleSearch}
        handleSendRequest={handleSendRequest}
        isSearching={isSearching}
        safeRequests={safeRequests}
        searchQuery={searchQuery}
        searchResults={searchResults}
      />
      <ProfileDialogs
        colors={colors}
        errorMsg={errorMsg}
        logout={logout}
        showLogoutConfirm={showLogoutConfirm}
        styles={styles}
        onCloseError={() => setErrorMsg("")}
        onCloseLogout={() => setShowLogoutConfirm(false)}
        onConfirmLogout={logout}
      />
    </SafeAreaView>
  );
}

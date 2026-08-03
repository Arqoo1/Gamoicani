import { Feather } from "@expo/vector-icons";
import { Pressable, ScrollView, StatusBar, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProfileActionSheet } from "@/features/profile/components/ProfileActionSheet";
import { ProfileActivitySections } from "@/features/profile/components/ProfileActivitySections";
import { ProfileDialogModals } from "@/features/profile/components/ProfileDialogModals";
import { ProfileFriendsSection } from "@/features/profile/components/ProfileFriendsSection";
import { ProfileHeader } from "@/features/profile/components/ProfileHeader";
import { ProfileHero } from "@/features/profile/components/ProfileHero";
import { ProfileInfoCard } from "@/features/profile/components/ProfileInfoCard";
import { ProfileStatsBar } from "@/features/profile/components/ProfileStatsBar";
import { useProfileController } from "@/features/profile/hooks/useProfileController";
import { AvatarColorPicker } from "@/features/profile/ui/AvatarColorPicker";
import { CoverColorPicker } from "@/features/profile/ui/CoverColorPicker";

export default function ProfileScreen() {
  const {
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
    user,
    userAvatarColor,
    userCoverIndex,
    userEquippedAvatarEmoji,
    userEquippedBannerColors,
    userEquippedNameTagColor,
    userTotalPoints,
    winPct,
    bestStreak,
    guessDistribution,
  } = useProfileController();

  const handleOpenColorPicker = (kind: "cover" | "avatar") => {
    setActionSheet("none");
    if (kind === "cover") {
      setShowCoverPicker(true);
      setShowColorPicker(false);
      return;
    }
    setShowColorPicker(true);
    setShowCoverPicker(false);
  };

  if (!user) return null;

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={coverColors[0]} />

      <ProfileHeader styles={styles} onBack={() => router.push("/")} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHero
          coverColors={coverColors}
          equippedAvatarEmoji={userEquippedAvatarEmoji ?? null}
          equippedBannerColors={
            userEquippedBannerColors && userEquippedBannerColors.length >= 2
              ? ([userEquippedBannerColors[0], userEquippedBannerColors[1]] as [string, string])
              : null
          }
          equippedNameTagColor={userEquippedNameTagColor ?? null}
          avatarColor={userAvatarColor ?? null}
          onAvatarTap={handleAvatarTap}
          onCoverTap={handleCoverTap}
          styles={styles}
          user={user}
        />

        {showCoverPicker && (
          <CoverColorPicker
            user={user}
            coverIndex={userCoverIndex}
            equippedBannerId={user?.equippedItems?.banner ?? null}
            styles={styles}
            onSelectColor={handleCoverColor}
            onEquipShopItem={handleEquipShopItem}
            onUnequipShopItem={handleUnequipShopItem}
          />
        )}

        {showColorPicker && (
          <AvatarColorPicker
            user={user}
            avatarColor={userAvatarColor}
            equippedAvatarId={user?.equippedItems?.avatar ?? null}
            styles={styles}
            colors={colors}
            onSelectColor={handleAvatarColor}
            onEquipShopItem={handleEquipShopItem}
            onUnequipShopItem={handleUnequipShopItem}
          />
        )}

        <ProfileStatsBar
          styles={styles}
          totalPlays={totalPlays}
          winPct={winPct}
          bestStreak={bestStreak}
          points={userTotalPoints}
        />

        <ProfileInfoCard colors={colors} styles={styles} user={user} onUpdate={updateProfile} />

        <ProfileActivitySections
          colors={colors}
          styles={styles}
          user={user}
          dailyQuestsData={dailyQuestsData}
          bonusClaimed={bonusClaimed}
          changePassword={changePassword}
          gameEntries={gameEntries}
          guessDistribution={guessDistribution}
          maxDist={maxDist}
        />

        <ProfileFriendsSection
          colors={colors}
          friends={friends}
          isSearching={isSearching}
          onAcceptRequest={handleAcceptRequest}
          onRemoveFriend={handleRemoveFriend}
          onRejectRequest={handleRejectRequest}
          onSearch={handleSearch}
          onSendRequest={handleSendRequest}
          safeRequests={safeRequests}
          searchQuery={searchQuery}
          searchResults={searchResults}
          styles={styles}
        />

        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={20} color="#e63946" />
          <Text style={styles.logoutText}>გასვლა</Text>
        </Pressable>
      </ScrollView>

      <ProfileActionSheet
        actionSheet={actionSheet}
        onClose={() => setActionSheet("none")}
        onImageSelect={handleImageSelect}
        onOpenColorPicker={handleOpenColorPicker}
        styles={styles}
      />

      <ProfileDialogModals
        errorMsg={errorMsg}
        logout={logout}
        onCloseError={() => setErrorMsg("")}
        onCloseLogout={() => setShowLogoutConfirm(false)}
        showLogoutConfirm={showLogoutConfirm}
        styles={styles}
      />
    </SafeAreaView>
  );
}

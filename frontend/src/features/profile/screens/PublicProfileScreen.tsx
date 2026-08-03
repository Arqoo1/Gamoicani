import { useRouter } from "expo-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppColors, useAppTheme } from "@/application/providers/theme";
import { UserAchievement } from "@/entities/user/types";
import {
  ACHIEVEMENTS_META,
  COVER_GRADIENTS,
  SHOP_ITEMS_META,
  formatDate,
  getInitials,
  getMediaUrl,
  getProfileStatsSummary,
  getRankInfo,
  normalizeGuessDistribution,
} from "@/features/profile/model/profileMeta";
import { getPublicProfile } from "@/features/profile/api/profileApi";
import { queryKeys } from "@/shared/api/queryKeys";
import { createStyles } from "@/features/profile/screens/PublicProfileScreen.styles";

export default function PublicProfileScreen({ username }: { username: string }) {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.profile.public(username),
    queryFn: () => getPublicProfile(username),
    enabled: Boolean(username),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (error || !user) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.primaryText }}>
          {error instanceof Error ? error.message : "User not found"}
        </Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const coverIndex = user.coverGradient ?? 0;
  const avatarColor = user.avatarColor ?? "#2f9e5d";
  const coverColors = COVER_GRADIENTS[coverIndex % COVER_GRADIENTS.length]!;

  const equippedBannerId = user.equippedItems?.banner ?? null;
  const equippedAvatarId = user.equippedItems?.avatar ?? null;
  const equippedNameTagId = user.equippedItems?.nameTag ?? null;
  const equippedBannerColors = equippedBannerId ? SHOP_ITEMS_META[equippedBannerId]?.colors : null;
  const equippedAvatarEmoji = equippedAvatarId ? SHOP_ITEMS_META[equippedAvatarId]?.emoji : null;
  const equippedNameTagColor = equippedNameTagId ? SHOP_ITEMS_META[equippedNameTagId]?.color : null;

  const activeCoverColors = equippedBannerColors
    ? ([equippedBannerColors[0], equippedBannerColors[equippedBannerColors.length - 1]] as [string, string])
    : coverColors;

  const rank = getRankInfo(user.totalPoints ?? 0);
  const initials = getInitials(user.displayName ?? user.username);

  const { bestStreak, gameEntries, totalPlays, winPct } = getProfileStatsSummary(user);
  const guessDistribution = normalizeGuessDistribution(user.profileStats?.wordleGuessDistribution);
  const maxDist = Math.max(1, ...guessDistribution);

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Pressable
          style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
          onPress={() => router.back()}
        >
          <Text style={styles.headerIcon}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{user.displayName}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cover}>
          {equippedBannerColors ? (
            <>
              <View style={[styles.coverGradientTop, { backgroundColor: activeCoverColors[0] }]} />
              <View style={[styles.coverGradientBottom, { backgroundColor: activeCoverColors[1] }]} />
            </>
          ) : user.coverPhotoUrl ? (
            <Image
              contentFit="cover"
              source={{ uri: getMediaUrl(user.coverPhotoUrl) }}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <>
              <View style={[styles.coverGradientTop, { backgroundColor: activeCoverColors[0] }]} />
              <View style={[styles.coverGradientBottom, { backgroundColor: activeCoverColors[1] }]} />
            </>
          )}
          <View style={styles.coverOverlay} />
        </View>

        <View style={styles.avatarRow}>
          <View
            style={[
              styles.avatar,
              !equippedAvatarEmoji && !user.profilePhotoUrl && { backgroundColor: avatarColor },
            ]}
          >
            {equippedAvatarEmoji ? (
              <Text style={styles.avatarEmoji}>{equippedAvatarEmoji}</Text>
            ) : user.profilePhotoUrl ? (
              <Image
                contentFit="cover"
                source={{ uri: getMediaUrl(user.profilePhotoUrl) }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </View>

          <View style={styles.heroInfo}>
            <View style={styles.heroNameRow}>
              <Text
                style={[styles.heroName, equippedNameTagColor ? { color: equippedNameTagColor } : undefined]}
                numberOfLines={1}
              >
                {user.displayName}
              </Text>
              <View style={[styles.rankBadge, { borderColor: rank.color }]}>
                <Text style={styles.rankBadgeIcon}>{rank.icon}</Text>
                <Text style={[styles.rankBadgeText, { color: rank.color }]}>{rank.label}</Text>
              </View>
            </View>
            <Text style={styles.heroUsername}>@{user.username}</Text>
          </View>
        </View>

        <View style={styles.statsBar}>
          <View style={styles.statBarItem}>
            <Text style={styles.statBarNum}>{totalPlays}</Text>
            <Text style={styles.statBarLbl}>თამაში</Text>
          </View>
          <View style={styles.statBarDivider} />
          <View style={styles.statBarItem}>
            <Text style={styles.statBarNum}>{winPct}%</Text>
            <Text style={styles.statBarLbl}>მოგება</Text>
          </View>
          <View style={styles.statBarDivider} />
          <View style={styles.statBarItem}>
            <Text style={styles.statBarNum}>{bestStreak}</Text>
            <Text style={styles.statBarLbl}>რეკორდი</Text>
          </View>
          <View style={styles.statBarDivider} />
          <View style={styles.statBarItem}>
            <Text style={styles.statBarNum}>{user.totalPoints ?? 0}</Text>
            <Text style={styles.statBarLbl}>ქულა</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>პროფილის ინფო</Text>

          <View style={styles.fieldRow}>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>სახელი</Text>
              <Text style={styles.fieldValue}>{user.displayName}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>ბიო</Text>
              <Text style={styles.fieldValue}>{user.bio ?? "—"}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>წევრი</Text>
              <Text style={styles.fieldValue}>{formatDate(user.createdAt)}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>როლი</Text>
              <Text style={styles.fieldValue}>{user.role === "admin" ? "👑 ადმინი" : "👤 მომხმარებელი"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏆 მიღწევები</Text>
          <View style={styles.achievementsGrid}>
            {Object.entries(ACHIEVEMENTS_META).map(([id, meta]) => {
              const achievement = user.achievements?.find((a: UserAchievement) => a.id === id);
              const isLocked = !achievement;
              return (
                <View key={id} style={[styles.achievementBadge, isLocked && styles.achievementBadgeLocked]}>
                  <Text style={[styles.achievementEmoji, isLocked && styles.achievementEmojiLocked]}>
                    {meta.emoji}
                  </Text>
                  <Text style={styles.achievementLabel}>{meta.label}</Text>
                  {isLocked && (
                    <Feather name="lock" size={12} color={colors.secondaryText} style={{ marginTop: 4 }} />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 სტატისტიკა</Text>
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Text style={styles.sectionSubtitle}>სიტყვობანას ცდების განაწილება</Text>
            <View style={styles.distribution}>
              {guessDistribution.map((count, index) => {
                const widthPercent = `${Math.max(8, (count / maxDist) * 100)}%` as `${number}%`;
                return (
                  <View key={index} style={styles.distributionRow}>
                    <Text style={styles.guessNumber}>{index + 1}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.bar, { width: widthPercent, backgroundColor: colors.accent }]}>
                        <Text style={styles.barText}>{count}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {gameEntries.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎮 თამაშის ჩანაწერები</Text>
            {gameEntries.map(({ emoji, gameId, label, stat }, index) => {
              const gWinPct = stat.plays > 0 ? Math.round((stat.wins / stat.plays) * 100) : 0;
              return (
                <View key={gameId}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.gameRow}>
                    <View style={styles.gameHeader}>
                      <Text style={styles.gameEmoji}>{emoji}</Text>
                      <Text style={styles.gameLabel}>{label}</Text>
                      <View style={[styles.gamePointsBadge, { backgroundColor: colors.accentMuted }]}>
                        <Text style={[styles.gamePointsText, { color: colors.accent }]}>
                          {stat.points} ქულა
                        </Text>
                      </View>
                    </View>
                    <View style={styles.gameStats}>
                      <View style={styles.gameStatItem}>
                        <Text style={styles.gameStatNum}>{stat.plays}</Text>
                        <Text style={styles.gameStatLbl}>თამაში</Text>
                      </View>
                      <View style={styles.gameStatItem}>
                        <Text style={styles.gameStatNum}>{stat.wins}</Text>
                        <Text style={styles.gameStatLbl}>მოგება</Text>
                      </View>
                      <View style={styles.gameStatItem}>
                        <Text style={styles.gameStatNum}>{gWinPct}%</Text>
                        <Text style={styles.gameStatLbl}>%</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

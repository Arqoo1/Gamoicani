import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppColors, useAppTheme } from "@/application/providers/theme";
import {
  ACHIEVEMENTS_META,
  COVER_GRADIENTS,
  GAME_META,
  formatDate,
  getInitials,
  getMediaUrl,
  getRankInfo
} from "@/features/profile/model/profileMeta";
import { getPublicProfile } from "@/features/profile/api/profileApi";

export default function PublicProfileScreen({ username }: { username: string }) {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    getPublicProfile(username)
      .then(setUser)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (error || !user) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.primaryText }}>{error || "User not found"}</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const coverIndex = user.coverGradient ?? 0;
  const avatarColor = user.avatarColor ?? "#2f9e5d";
  const coverColors = COVER_GRADIENTS[coverIndex % COVER_GRADIENTS.length]!;

  const rank = getRankInfo(user.totalPoints ?? 0);
  const initials = getInitials(user.displayName ?? user.username);

  const gameEntries = (() => {
    if (!user?.gameStats) return [];
    return Object.entries(user.gameStats).map(([gameId, stat]: [string, any]) => ({
      emoji: GAME_META[gameId]?.emoji ?? "🎮",
      gameId,
      label: GAME_META[gameId]?.label ?? gameId,
      stat
    }));
  })();

  const totalWins = gameEntries.reduce((sum, g) => sum + (g.stat.wins ?? 0), 0);
  const totalPlays = gameEntries.reduce((sum, g) => sum + (g.stat.plays ?? 0), 0);
  const bestStreak = Math.max(0, ...gameEntries.map((g) => g.stat.maxStreak ?? 0));

  const winPct = totalPlays > 0 ? Math.round((totalWins / totalPlays) * 100) : 0;

  const mockDistribution = (() => {
    let remaining = totalWins;
    const dist = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 6; i++) {
      if (i === 5) { dist[i] = remaining; break; }
      const alloc = Math.floor(Math.random() * (remaining / 2));
      dist[i] = alloc;
      remaining -= alloc;
    }
    return dist;
  })();

  const maxDist = Math.max(1, ...mockDistribution);

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      <View style={[styles.header, { backgroundColor: colors.card }]}>
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
        {/* Cover */}
        <View style={styles.cover}>
          {user.coverPhotoUrl ? (
            <Image source={{ uri: getMediaUrl(user.coverPhotoUrl) }} style={StyleSheet.absoluteFill} />
          ) : (
            <>
              <View style={[styles.coverGradientTop, { backgroundColor: coverColors[0] }]} />
              <View style={[styles.coverGradientBottom, { backgroundColor: coverColors[1] }]} />
            </>
          )}
          <View style={styles.coverOverlay} />
        </View>

        {/* Avatar & Hero Info */}
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, !user.profilePhotoUrl && { backgroundColor: avatarColor }]}>
            {user.profilePhotoUrl ? (
              <Image source={{ uri: getMediaUrl(user.profilePhotoUrl) }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </View>

          <View style={styles.heroInfo}>
            <View style={styles.heroNameRow}>
              <Text style={styles.heroName} numberOfLines={1}>{user.displayName}</Text>
              <View style={[styles.rankBadge, { borderColor: rank.color }]}>
                <Text style={styles.rankBadgeIcon}>{rank.icon}</Text>
                <Text style={[styles.rankBadgeText, { color: rank.color }]}>{rank.label}</Text>
              </View>
            </View>
            <Text style={styles.heroUsername}>@{user.username}</Text>
          </View>
        </View>

        {/* Global Stats */}
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

        {/* Basic Info */}
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

        {/* Achievements */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏆 მიღწევები</Text>
          <View style={styles.achievementsGrid}>
            {Object.entries(ACHIEVEMENTS_META).map(([id, meta]) => {
              const achievement = user.achievements?.find((a: any) => a.id === id);
              const isLocked = !achievement;
              return (
                <View key={id} style={[styles.achievementBadge, isLocked && styles.achievementBadgeLocked]}>
                  <Text style={[styles.achievementEmoji, isLocked && styles.achievementEmojiLocked]}>{meta.emoji}</Text>
                  <Text style={styles.achievementLabel}>{meta.label}</Text>
                  {isLocked && <Feather name="lock" size={12} color={colors.secondaryText} style={{ marginTop: 4 }} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 სტატისტიკა</Text>
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Text style={styles.sectionSubtitle}>სიტყვობანას ცდების განაწილება</Text>
            <View style={styles.distribution}>
              {mockDistribution.map((count, index) => {
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

        {/* Game Entries */}
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
                        <Text style={[styles.gamePointsText, { color: colors.accent }]}>{stat.points} ქულა</Text>
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

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      height: 60,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      zIndex: 10,
    },
    headerBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    headerIcon: { color: colors.primaryText, fontSize: 36, fontWeight: "300", marginTop: -6 },
    headerTitle: { color: colors.primaryText, fontSize: 18, fontWeight: "900" },
    headerSpacer: { width: 44 },
    pressed: { opacity: 0.7 },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    cover: { height: 160, width: "100%", backgroundColor: colors.card, position: "relative" },
    coverGradientTop: { position: "absolute", top: 0, left: 0, right: 0, bottom: "50%" },
    coverGradientBottom: { position: "absolute", top: "50%", left: 0, right: 0, bottom: 0 },
    coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.15)" },
    avatarRow: { flexDirection: "row", paddingHorizontal: 20, marginTop: -36, marginBottom: 20, alignItems: "flex-end", zIndex: 10 },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 4,
      borderColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      backgroundColor: colors.card,
    },
    avatarImage: { width: 88, height: 88, borderRadius: 44, resizeMode: "cover" },
    avatarInitials: { color: "#fff", fontSize: 36, fontWeight: "900" },
    heroInfo: { flex: 1, marginLeft: 16, paddingBottom: 4 },
    heroNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
    heroName: { color: colors.primaryText, fontSize: 24, fontWeight: "900", flexShrink: 1 },
    rankBadge: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, gap: 4 },
    rankBadgeIcon: { fontSize: 10 },
    rankBadgeText: { fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
    heroUsername: { color: colors.secondaryText, fontSize: 15, fontWeight: "700" },
    statsBar: {
      flexDirection: "row",
      backgroundColor: colors.card,
      marginHorizontal: 16,
      borderRadius: 16,
      paddingVertical: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    statBarItem: { flex: 1, alignItems: "center", gap: 4 },
    statBarNum: { color: colors.primaryText, fontSize: 20, fontWeight: "900" },
    statBarLbl: { color: colors.secondaryText, fontSize: 12, fontWeight: "700" },
    statBarDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
    card: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      borderRadius: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    cardTitle: { color: colors.primaryText, fontSize: 18, fontWeight: "900", padding: 20 },
    divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 20 },
    fieldRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
    fieldContent: { flex: 1 },
    fieldLabel: { color: colors.secondaryText, fontSize: 13, fontWeight: "700", marginBottom: 4 },
    fieldValue: { color: colors.primaryText, fontSize: 16, fontWeight: "600" },
    achievementsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
    achievementBadge: {
      width: "30%",
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    achievementBadgeLocked: { opacity: 0.5, backgroundColor: colors.card },
    achievementEmoji: { fontSize: 28, marginBottom: 8 },
    achievementEmojiLocked: { opacity: 0.5 },
    achievementLabel: { color: colors.primaryText, fontSize: 11, fontWeight: "800", textAlign: "center" },
    sectionSubtitle: { color: colors.primaryText, fontSize: 15, fontWeight: "800", marginBottom: 16 },
    distribution: { gap: 8 },
    distributionRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    guessNumber: { color: colors.secondaryText, fontSize: 14, fontWeight: "900", width: 16, textAlign: "center" },
    barTrack: { flex: 1, height: 28, backgroundColor: colors.background, borderRadius: 14, overflow: "hidden" },
    bar: { height: "100%", borderRadius: 14, justifyContent: "center", paddingHorizontal: 12 },
    barText: { color: "#fff", fontSize: 12, fontWeight: "900", textAlign: "right" },
    gameRow: { padding: 20 },
    gameHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
    gameEmoji: { fontSize: 24 },
    gameLabel: { color: colors.primaryText, fontSize: 16, fontWeight: "900", flex: 1 },
    gamePointsBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    gamePointsText: { fontSize: 13, fontWeight: "900" },
    gameStats: { flexDirection: "row", gap: 12 },
    gameStatItem: { flex: 1, backgroundColor: colors.background, borderRadius: 12, padding: 12, alignItems: "center" },
    gameStatNum: { color: colors.primaryText, fontSize: 18, fontWeight: "900", marginBottom: 2 },
    gameStatLbl: { color: colors.secondaryText, fontSize: 12, fontWeight: "700" },
    primaryBtn: { backgroundColor: colors.accent, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
    primaryBtnText: { color: "#fff", fontWeight: "bold" },
  });
}

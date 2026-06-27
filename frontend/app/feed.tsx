import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_BASE_URL, FeedEvent, fetchSocialFeed } from "../src/api";
import { AppColors, useAppTheme } from "../src/theme";

const GAME_META: Record<string, { label: string; emoji: string }> = {
  wordle:   { label: "სიტყვობანა", emoji: "🟩" },
  andazebi: { label: "ანდაზები",   emoji: "🎯" },
  trivia:   { label: "ვიქტორინა",  emoji: "🧠" },
};

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "ახლახანს";
  if (minutes < 60) return `${minutes} წუთის წინ`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} საათის წინ`;
  const days = Math.floor(hours / 24);
  return `${days} დღის წინ`;
}

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");
}

export default function FeedScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await fetchSocialFeed();
      setEvents(data);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getGameDescription = (ev: FeedEvent) => {
    const meta = GAME_META[ev.gameId] ?? { label: ev.gameId, emoji: "🎮" };
    const modeLabel = ev.mode === "practice" ? "(პრაქტიკა)" : "";
    const attemptsLabel = ev.attempts ? ` — ${ev.attempts} ცდა` : "";
    return `${meta.emoji} ${meta.label}${modeLabel}${attemptsLabel}`;
  };

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Feather color={colors.primaryText} name="chevron-left" size={28} />
        </Pressable>
        <Text style={styles.title}>თამაშების ისტორია</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {events.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🌐</Text>
              <Text style={styles.emptyTitle}>ჯერ არავის შედეგი</Text>
              <Text style={styles.emptyHint}>დაამეგობრდი სხვებს, რომ მათი გამარჯვებები იხილო</Text>
            </View>
          ) : (
            events.map((ev) => {
              const avatarUrl = ev.user.profilePhotoUrl
                ? API_BASE_URL.replace("/api", "") + ev.user.profilePhotoUrl
                : null;
              return (
                <View key={ev.id} style={styles.card}>
                  {/* Avatar */}
                  <View style={[styles.avatar, { backgroundColor: ev.user.avatarColor }]}>
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
                    ) : (
                      <Text style={styles.avatarText}>{getInitials(ev.user.displayName)}</Text>
                    )}
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                      <Text style={styles.displayName}>{ev.user.displayName}</Text>
                      <Text style={styles.timeAgo}>{timeAgo(ev.occurredAt)}</Text>
                    </View>
                    <Text style={styles.gameDesc}>{getGameDescription(ev)}</Text>
                    <Text style={styles.wonBadge}>🏆 მოიგო! +{ev.points} ქულა</Text>
                  </View>
                </View>
              );
            })
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background , paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) : 0 },
    header: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    backBtn: { alignItems: "center", height: 44, justifyContent: "center", width: 44 },
    title: { color: colors.primaryText, fontSize: 18, fontWeight: "900" },
    pressed: { opacity: 0.65 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    content: { padding: 16 },
    empty: { alignItems: "center", marginTop: 80, gap: 12 },
    emptyEmoji: { fontSize: 56 },
    emptyTitle: { color: colors.primaryText, fontSize: 20, fontWeight: "900" },
    emptyHint: { color: colors.secondaryText, fontSize: 14, textAlign: "center", maxWidth: 260 },
    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: "row",
      gap: 12,
      marginBottom: 12,
      padding: 14,
    },
    avatar: {
      alignItems: "center",
      borderRadius: 24,
      height: 48,
      justifyContent: "center",
      width: 48,
      overflow: "hidden",
      flexShrink: 0,
    },
    avatarImg: { width: 48, height: 48, borderRadius: 24 },
    avatarText: { color: "#fff", fontSize: 18, fontWeight: "900" },
    cardBody: { flex: 1 },
    cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
    displayName: { color: colors.primaryText, fontSize: 15, fontWeight: "900" },
    timeAgo: { color: colors.secondaryText, fontSize: 11, fontWeight: "600" },
    gameDesc: { color: colors.secondaryText, fontSize: 13, fontWeight: "600", marginBottom: 6 },
    wonBadge: { color: colors.accent, fontSize: 13, fontWeight: "800" },
  });
}

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, ActivityIndicator, FlatList, Pressable, RefreshControl, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppColors, useAppTheme } from "@/application/providers/theme";
import { FeedEvent, fetchSocialFeed } from "@/features/feed/api/feedApi";
import { FeedEventCard } from "@/features/feed/ui/FeedEventCard";
import { createStyles } from "@/features/feed/screens/FeedScreen.styles";
import { getMediaUrl } from "@/features/profile/model/profileMeta";
import { getInitials } from "@/shared/utils/avatar";

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


export default function FeedScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setErrorMessage("");
    try {
      const data = await fetchSocialFeed();
      setEvents(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Feed failed to load");
    } finally {
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
      ) : errorMessage ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>{errorMessage}</Text>
          <Pressable style={styles.retryButton} onPress={() => load()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(ev) => ev.id}
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
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🌐</Text>
              <Text style={styles.emptyTitle}>ჯერ არავის შედეგი</Text>
              <Text style={styles.emptyHint}>დაამეგობრდი სხვებს, რომ მათი გამარჯვებები იხილო</Text>
            </View>
          }
          renderItem={({ item: ev }) => {
            const avatarUrl = getMediaUrl(ev.user.profilePhotoUrl) ?? null;
            return (
              <FeedEventCard
                avatarColor={ev.user.avatarColor}
                avatarText={getInitials(ev.user.displayName)}
                avatarUrl={avatarUrl}
                displayName={ev.user.displayName}
                gameDescription={getGameDescription(ev)}
                styles={styles}
                timeLabel={timeAgo(ev.occurredAt)}
                winText={`🏆 მოიგო! +${ev.points} ქულა`}
              />
            );
          }}
          ListFooterComponent={<View style={{ height: 24 }} />}
        />
      )}
    </SafeAreaView>
  );
}


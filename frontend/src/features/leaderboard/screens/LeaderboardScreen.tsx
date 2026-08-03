import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/application/providers/theme";
import { LeaderboardEntry, MyLeaderboardRanks } from "@/entities/score/types";
import {
  fetchGlobalLeaderboard,
  fetchMyLeaderboardRanks,
  fetchStreakLeaderboard,
} from "@/features/leaderboard/api/leaderboardApi";
import { LeaderboardRow } from "@/features/leaderboard/ui/LeaderboardRow";
import { createStyles } from "@/features/leaderboard/ui/LeaderboardScreen.styles";
import { listFriends } from "@/features/social/api/friendsApi";

type BoardMode = "global" | "wordle" | "andazebi" | "friends";
type LoadState = "idle" | "loading" | "ready" | "error";

const boardCopy: Record<BoardMode, { empty: string; title: string }> = {
  andazebi: {
    empty: "ანდაზების სერია ჯერ ცარიელია",
    title: "ანდაზების სერია",
  },
  global: {
    empty: "ქულები ჯერ არ არის",
    title: "გლობალური TOP 10",
  },
  wordle: {
    empty: "სიტყვობანას სერია ჯერ ცარიელია",
    title: "სიტყვობანას სერია",
  },
  friends: {
    empty: "მეგობრები არ გყავთ",
    title: "ჩემი მეგობრები",
  },
};

export default function LeaderboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [mode, setMode] = useState<BoardMode>("global");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRanks, setMyRanks] = useState<MyLeaderboardRanks | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [friendsOnly, setFriendsOnly] = useState(false);

  useEffect(() => {
    let active = true;

    setLoadState("loading");
    let request: Promise<LeaderboardEntry[]>;
    if (mode === "global") {
      request = fetchGlobalLeaderboard(10, friendsOnly);
    } else if (mode === "friends") {
      request = listFriends().then((friends) =>
        friends.map((f, i) => ({
          displayName: f.displayName,
          username: f.username,
          rank: i + 1,
          totalPoints: f.totalPoints || 0,
        }))
      );
    } else {
      request = fetchStreakLeaderboard(mode, 10);
    }

    Promise.all([request, fetchMyLeaderboardRanks().catch(() => null)])
      .then(([nextEntries, nextRanks]) => {
        if (active) {
          setEntries(nextEntries);
          setMyRanks(nextRanks);
          setLoadState("ready");
        }
      })
      .catch(() => {
        if (active) {
          setEntries([]);
          setLoadState("error");
        }
      });

    return () => {
      active = false;
    };
  }, [mode, friendsOnly]);

  const title = boardCopy[mode].title;
  const emptyText =
    loadState === "loading"
      ? "იტვირთება"
      : loadState === "error"
        ? "სერვერთან კავშირი ვერ მოხერხდა"
        : boardCopy[mode].empty;

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.card} />
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          onPress={() => router.push("/")}
        >
          <Text style={styles.headerIcon}>‹</Text>
        </Pressable>
        <Text style={styles.logo}>ლიდერბორდი</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.modeRow}>
          {(["global", "wordle", "andazebi", "friends"] as BoardMode[]).map((nextMode) => (
            <Pressable
              key={nextMode}
              style={({ pressed }) => [
                styles.modeButton,
                mode === nextMode && styles.modeButtonActive,
                pressed && styles.pressed,
              ]}
              onPress={() => setMode(nextMode)}
            >
              <Text style={[styles.modeButtonText, mode === nextMode && styles.modeButtonTextActive]}>
                {nextMode === "global"
                  ? "ქულები"
                  : nextMode === "wordle"
                    ? "სიტყვა"
                    : nextMode === "andazebi"
                      ? "ანდაზები"
                      : "მეგობრები"}
              </Text>
            </Pressable>
          ))}
        </View>

        {mode === "global" && (
          <View style={styles.friendsToggleBox}>
            <Pressable
              style={({ pressed }) => [
                styles.friendsToggleBtn,
                !friendsOnly && styles.friendsToggleActive,
                pressed && styles.pressed,
              ]}
              onPress={() => setFriendsOnly(false)}
            >
              <Text style={[styles.friendsToggleText, !friendsOnly && styles.friendsToggleTextActive]}>
                ყველა
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.friendsToggleBtn,
                friendsOnly && styles.friendsToggleActive,
                pressed && styles.pressed,
              ]}
              onPress={() => setFriendsOnly(true)}
            >
              <Text style={[styles.friendsToggleText, friendsOnly && styles.friendsToggleTextActive]}>
                მეგობრები
              </Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.sectionTitle}>{title}</Text>

        <View style={styles.myRankBox}>
          <Text style={styles.myRankLabel}>ჩემი ადგილი</Text>
          <Text style={styles.myRankValue}>
            {mode === "global" || mode === "friends"
              ? myRanks?.global.rank
                ? `#${myRanks.global.rank} · ${myRanks.global.totalPoints} ქულა`
                : "ჯერ ქულა არ გაქვს"
              : myRanks?.[mode]?.streakRank
                ? `#${myRanks[mode].streakRank} · ${myRanks[mode].streak} სერია`
                : "ჯერ სერია არ გაქვს"}
          </Text>
        </View>

        <View style={styles.board}>
          {entries.length > 0 ? (
            entries.map((entry) => (
              <LeaderboardRow
                key={`${entry.username}-${entry.rank}`}
                entry={entry}
                mode={mode}
                styles={styles}
              />
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

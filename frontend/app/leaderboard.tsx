import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  fetchGlobalLeaderboard,
  fetchMyLeaderboardRanks,
  fetchStreakLeaderboard,
  LeaderboardEntry,
  MyLeaderboardRanks
} from "../src/api";
import { AppColors, useAppTheme } from "../src/theme";

type BoardMode = "global" | "wordle" | "andazebi";
type LoadState = "idle" | "loading" | "ready" | "error";

const boardCopy: Record<BoardMode, { empty: string; title: string }> = {
  andazebi: {
    empty: "ანდაზების სერია ჯერ ცარიელია",
    title: "ანდაზების სერია"
  },
  global: {
    empty: "ქულები ჯერ არ არის",
    title: "გლობალური TOP 10"
  },
  wordle: {
    empty: "სიტყვობანას სერია ჯერ ცარიელია",
    title: "სიტყვობანას სერია"
  }
};

export default function LeaderboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [mode, setMode] = useState<BoardMode>("global");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRanks, setMyRanks] = useState<MyLeaderboardRanks | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");

  useEffect(() => {
    let active = true;

    setLoadState("loading");
    const request =
      mode === "global"
        ? fetchGlobalLeaderboard(10)
        : fetchStreakLeaderboard(mode, 10);

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
  }, [mode]);

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

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.modeRow}>
          {(["global", "wordle", "andazebi"] as BoardMode[]).map((nextMode) => (
            <Pressable
              key={nextMode}
              style={({ pressed }) => [
                styles.modeButton,
                mode === nextMode && styles.modeButtonActive,
                pressed && styles.pressed
              ]}
              onPress={() => setMode(nextMode)}
            >
              <Text style={[styles.modeButtonText, mode === nextMode && styles.modeButtonTextActive]}>
                {nextMode === "global" ? "ქულები" : nextMode === "wordle" ? "სიტყვა" : "ანდაზები"}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{title}</Text>

        <View style={styles.myRankBox}>
          <Text style={styles.myRankLabel}>ჩემი ადგილი</Text>
          <Text style={styles.myRankValue}>
            {mode === "global"
              ? myRanks?.global.rank
                ? `#${myRanks.global.rank} · ${myRanks.global.totalPoints} ქულა`
                : "ჯერ ქულა არ გაქვს"
              : myRanks?.[mode].streakRank
                ? `#${myRanks[mode].streakRank} · ${myRanks[mode].streak} სერია`
                : "ჯერ სერია არ გაქვს"}
          </Text>
        </View>

        <View style={styles.board}>
          {entries.length > 0 ? (
            entries.map((entry) => {
              const score = mode === "global" ? entry.totalPoints ?? 0 : entry.streak ?? 0;
              const label = mode === "global" ? "ქულა" : "სერია";

              return (
                <View key={`${entry.username}-${entry.rank}`} style={styles.row}>
                  <Text style={styles.rank}>{entry.rank}</Text>
                  <View style={styles.playerCopy}>
                    <Text style={styles.playerName}>{entry.displayName}</Text>
                    <Text style={styles.username}>@{entry.username}</Text>
                  </View>
                  <View style={styles.scoreBox}>
                    <Text style={styles.score}>{score}</Text>
                    <Text style={styles.scoreLabel}>{label}</Text>
                  </View>
                </View>
              );
            })
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

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      backgroundColor: colors.card,
      flex: 1
    },
    scrollView: {
      backgroundColor: colors.background
    },
    header: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      elevation: 2,
      flexDirection: "row",
      height: 56,
      justifyContent: "space-between",
      paddingHorizontal: 10,
      shadowColor: colors.shadow,
      shadowOffset: { height: 2, width: 0 },
      shadowOpacity: 0.08,
      shadowRadius: 8
    },
    headerButton: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderRadius: 8,
      height: 42,
      justifyContent: "center",
      width: 42
    },
    headerSpacer: {
      height: 42,
      width: 42
    },
    headerIcon: {
      color: colors.primaryText,
      fontSize: 30,
      fontWeight: "700",
      lineHeight: 36
    },
    logo: {
      color: colors.primaryText,
      fontSize: 22,
      fontWeight: "900",
      letterSpacing: 0
    },
    content: {
      paddingBottom: 32,
      paddingHorizontal: 20,
      paddingTop: 24
    },
    modeRow: {
      alignSelf: "center",
      backgroundColor: colors.button,
      borderRadius: 8,
      flexDirection: "row",
      gap: 4,
      marginBottom: 20,
      maxWidth: 420,
      padding: 4,
      width: "100%"
    },
    modeButton: {
      alignItems: "center",
      borderRadius: 7,
      flex: 1,
      justifyContent: "center",
      minHeight: 38,
      paddingHorizontal: 4
    },
    modeButtonActive: {
      backgroundColor: colors.card
    },
    modeButtonText: {
      color: colors.secondaryText,
      fontSize: 13,
      fontWeight: "900",
      textAlign: "center"
    },
    modeButtonTextActive: {
      color: colors.primaryText
    },
    sectionTitle: {
      color: colors.primaryText,
      fontSize: 18,
      fontWeight: "900",
      letterSpacing: 0,
      marginBottom: 14,
      textAlign: "center"
    },
    board: {
      alignSelf: "center",
      gap: 10,
      maxWidth: 560,
      width: "100%"
    },
    myRankBox: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 14,
      maxWidth: 560,
      paddingHorizontal: 14,
      paddingVertical: 12,
      width: "100%"
    },
    myRankLabel: {
      color: colors.secondaryText,
      fontSize: 12,
      fontWeight: "900",
      marginBottom: 3
    },
    myRankValue: {
      color: colors.primaryText,
      fontSize: 17,
      fontWeight: "900"
    },
    row: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      elevation: 1,
      flexDirection: "row",
      minHeight: 70,
      paddingHorizontal: 12,
      paddingVertical: 10,
      shadowColor: colors.shadow,
      shadowOffset: { height: 2, width: 0 },
      shadowOpacity: 0.06,
      shadowRadius: 6
    },
    rank: {
      color: colors.accent,
      fontSize: 20,
      fontWeight: "900",
      textAlign: "center",
      width: 34
    },
    playerCopy: {
      flex: 1,
      minWidth: 0,
      paddingHorizontal: 10
    },
    playerName: {
      color: colors.primaryText,
      fontSize: 17,
      fontWeight: "900"
    },
    username: {
      color: colors.secondaryText,
      fontSize: 12,
      fontWeight: "800",
      marginTop: 2
    },
    scoreBox: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderRadius: 8,
      minWidth: 68,
      paddingHorizontal: 8,
      paddingVertical: 8
    },
    score: {
      color: colors.primaryText,
      fontSize: 21,
      fontWeight: "900",
      lineHeight: 24
    },
    scoreLabel: {
      color: colors.secondaryText,
      fontSize: 11,
      fontWeight: "900",
      marginTop: 2
    },
    emptyBox: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      minHeight: 112,
      justifyContent: "center",
      padding: 18
    },
    emptyText: {
      color: colors.secondaryText,
      fontSize: 15,
      fontWeight: "800",
      textAlign: "center"
    },
    pressed: {
      opacity: 0.64
    }
  });
}

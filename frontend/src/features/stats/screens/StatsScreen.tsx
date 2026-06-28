import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createEmptyStats, loadWordleStats, WordleStats } from "@/features/wordle/model/storage";
import { AppColors, useAppTheme } from "@/application/providers/theme";
import { getDailyPuzzleNumber, WORDLE_EPOCH } from "@/features/wordle/model/wordle";

const CALENDAR_DAYS = 28;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

type CalendarDay = {
  dateLabel: string;
  key: string;
  puzzleNumber: number;
  status: "won" | "lost" | "missed" | "today";
};

export default function StatsScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [stats, setStats] = useState<WordleStats>(() => createEmptyStats());

  useEffect(() => {
    let active = true;

    loadWordleStats().then((nextStats) => {
      if (active) {
        setStats(nextStats);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const winPercent = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;
  const maxDistribution = useMemo(
    () => Math.max(1, ...stats.guessDistribution),
    [stats.guessDistribution]
  );
  const calendarDays = useMemo<CalendarDay[]>(() => {
    const todayPuzzleNumber = getDailyPuzzleNumber(WORDLE_EPOCH);
    const firstPuzzleNumber = Math.max(1, todayPuzzleNumber - CALENDAR_DAYS + 1);

    return Array.from({ length: CALENDAR_DAYS }).map((_, index) => {
      const puzzleNumber = firstPuzzleNumber + index;
      const completedPuzzle = stats.completedPuzzles[String(puzzleNumber)];
      const date = new Date(WORDLE_EPOCH.getTime() + (puzzleNumber - 1) * DAY_IN_MS);
      const status = completedPuzzle
        ? completedPuzzle.won
          ? "won"
          : "lost"
        : puzzleNumber === todayPuzzleNumber
          ? "today"
          : "missed";

      return {
        dateLabel: String(date.getUTCDate()),
        key: String(puzzleNumber),
        puzzleNumber,
        status
      };
    });
  }, [stats.completedPuzzles]);

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.card} />
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          onPress={() => router.push("/wordle")}
        >
          <Text style={styles.headerIcon}>‹</Text>
        </Pressable>
        <Text style={styles.logo}>სტატისტიკა</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.played}</Text>
            <Text style={styles.statLabel}>თამაში</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{winPercent}</Text>
            <Text style={styles.statLabel}>მოგება %</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>სერია</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.maxStreak}</Text>
            <Text style={styles.statLabel}>რეკორდი</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>დღიური სერია</Text>
        <View style={styles.calendar}>
          {calendarDays.map((day) => (
            <View
              key={day.key}
              style={[
                styles.calendarDay,
                day.status === "won" && styles.calendarDayWon,
                day.status === "lost" && styles.calendarDayLost,
                day.status === "today" && styles.calendarDayToday
              ]}
            >
              <Text
                style={[
                  styles.calendarDayText,
                  (day.status === "won" || day.status === "lost") && styles.calendarDayTextStrong
                ]}
              >
                {day.dateLabel}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.legend}>
          <Text style={styles.legendItem}>მოგება</Text>
          <Text style={styles.legendItem}>წაგება</Text>
          <Text style={styles.legendItem}>ღია</Text>
        </View>

        <Text style={styles.sectionTitle}>ცდების განაწილება</Text>
        <View style={styles.distribution}>
          {stats.guessDistribution.map((count, index) => {
            const widthPercent = `${Math.max(8, (count / maxDistribution) * 100)}%` as `${number}%`;

            return (
              <View key={index} style={styles.distributionRow}>
                <Text style={styles.guessNumber}>{index + 1}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, { width: widthPercent }]}>
                    <Text style={styles.barText}>{count}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.card
    , paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) : 0 },
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
      paddingBottom: 30,
      paddingHorizontal: 24,
      paddingTop: 28
    },
    statsGrid: {
      flexDirection: "row",
      gap: 10,
      justifyContent: "center",
      marginBottom: 32
    },
    statBox: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      elevation: 1,
      flex: 1,
      paddingHorizontal: 6,
      paddingVertical: 13,
      shadowColor: colors.shadow,
      shadowOffset: { height: 2, width: 0 },
      shadowOpacity: 0.06,
      shadowRadius: 6
    },
    statNumber: {
      color: colors.primaryText,
      fontSize: 30,
      fontWeight: "800",
      lineHeight: 36
    },
    statLabel: {
      color: colors.secondaryText,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 4,
      textAlign: "center"
    },
    sectionTitle: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: "900",
      marginBottom: 16,
      textAlign: "center"
    },
    calendar: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "center",
      marginBottom: 12
    },
    calendarDay: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      height: 34,
      justifyContent: "center",
      width: 34
    },
    calendarDayWon: {
      backgroundColor: colors.correct,
      borderColor: colors.correct
    },
    calendarDayLost: {
      backgroundColor: colors.absent,
      borderColor: colors.absent
    },
    calendarDayToday: {
      borderColor: colors.accent,
      borderWidth: 2
    },
    calendarDayText: {
      color: colors.secondaryText,
      fontSize: 12,
      fontWeight: "900"
    },
    calendarDayTextStrong: {
      color: "#ffffff"
    },
    legend: {
      flexDirection: "row",
      gap: 10,
      justifyContent: "center",
      marginBottom: 30
    },
    legendItem: {
      color: colors.secondaryText,
      fontSize: 12,
      fontWeight: "800"
    },
    distribution: {
      gap: 7
    },
    distributionRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8
    },
    guessNumber: {
      color: colors.primaryText,
      fontSize: 14,
      fontWeight: "700",
      width: 14
    },
    barTrack: {
      backgroundColor: colors.key,
      borderRadius: 8,
      flex: 1,
      overflow: "hidden"
    },
    bar: {
      alignItems: "flex-end",
      backgroundColor: colors.accent,
      borderRadius: 8,
      justifyContent: "center",
      minHeight: 24,
      paddingHorizontal: 8
    },
    barText: {
      color: "#ffffff",
      fontSize: 13,
      fontWeight: "900"
    },
    pressed: {
      opacity: 0.64
    }
  });
}

import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createEmptyStats, loadWordleStats, WordleStats } from "@/features/wordle/model/storage";
import { AppColors, useAppTheme } from "@/application/providers/theme";
import { getDailyPuzzleNumber, WORDLE_EPOCH } from "@/features/wordle/model/wordle";
import { createStyles } from "@/features/stats/screens/StatsScreen.styles";

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
  const maxDistribution = useMemo(() => Math.max(1, ...stats.guessDistribution), [stats.guessDistribution]);
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
        status,
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
                day.status === "today" && styles.calendarDayToday,
              ]}
            >
              <Text
                style={[
                  styles.calendarDayText,
                  (day.status === "won" || day.status === "lost") && styles.calendarDayTextStrong,
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

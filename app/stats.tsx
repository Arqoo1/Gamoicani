import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createEmptyStats, loadWordleStats, WordleStats } from "../src/storage";

export default function StatsScreen() {
  const router = useRouter();
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

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          onPress={() => router.push("/wordle")}
        >
          <Text style={styles.headerIcon}>‹</Text>
        </Pressable>
        <Text style={styles.logo}>STATISTICS</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
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

        <Text style={styles.sectionTitle}>GUESS DISTRIBUTION</Text>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f4f7fb"
  },
  header: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#dce3e8",
    borderBottomWidth: 1,
    elevation: 2,
    flexDirection: "row",
    height: 56,
    justifyContent: "space-between",
    paddingHorizontal: 10,
    shadowColor: "#17352d",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8
  },
  headerButton: {
    alignItems: "center",
    backgroundColor: "#eef4f2",
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
    color: "#17352d",
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 36
  },
  logo: {
    color: "#17352d",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginBottom: 36
  },
  statBox: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#dce3e8",
    borderRadius: 8,
    borderWidth: 1,
    elevation: 1,
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 13,
    shadowColor: "#17352d",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 6
  },
  statNumber: {
    color: "#17352d",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36
  },
  statLabel: {
    color: "#66727f",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "center"
  },
  sectionTitle: {
    color: "#17352d",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 18,
    textAlign: "center"
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
    color: "#17352d",
    fontSize: 14,
    fontWeight: "700",
    width: 14
  },
  barTrack: {
    backgroundColor: "#e3e9ed",
    borderRadius: 8,
    flex: 1,
    overflow: "hidden"
  },
  bar: {
    alignItems: "flex-end",
    backgroundColor: "#2f9e5d",
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

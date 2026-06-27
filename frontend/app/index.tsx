import { Href, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, View, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import games from "../data/games.json";
import { fetchGames, GameItem as ApiGameItem } from "../src/api";
import { useAuth } from "../src/auth";
import { AppColors, useAppTheme } from "../src/theme";
import { getDailyPuzzleNumber, WORDLE_EPOCH } from "../src/wordle";

type GameItem = {
  href?: Href;
  id: string;
  status: "ready" | "soon";
  subtitle: string;
  title: string;
};

const fallbackGameList = games as GameItem[];

/** Returns today's date as "YYYY-MM-DD" in local time — same logic as andazebi.tsx */
function getLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Returns true if the user has already completed today's daily for this gameId.
 * Uses the same key format the backend uses:
 *   wordle   → lastCompletedKey === String(todayPuzzleNumber)
 *   andazebi → lastCompletedKey === "YYYY-MM-DD" (streakKey)
 *   trivia   → lastCompletedKey === "YYYY-MM-DD"
 */
function isDoneToday(gameId: string, gameStats: Record<string, any> | undefined): boolean {
  if (!gameStats) return false;
  const stat = gameStats[gameId];
  if (!stat?.lastCompletedKey) return false;

  if (gameId === "wordle") {
    const todayKey = String(getDailyPuzzleNumber(WORDLE_EPOCH));
    return stat.lastCompletedKey === todayKey;
  }

  // andazebi and trivia both use date string as streakKey/lastCompletedKey
  if (gameId === "andazebi" || gameId === "trivia") {
    return stat.lastCompletedKey === getLocalDateKey();
  }

  return false;
}
const normalGuideRows = [
  ["ქ", "წ", "ე", "რ", "ტ", "ყ", "უ", "ი", "ო", "პ"],
  ["ა", "ს", "დ", "ფ", "გ", "ჰ", "ჯ", "კ", "ლ"],
  ["⇧", "ზ", "ხ", "ც", "ვ", "ბ", "ნ", "მ", "⌫"]
];
const shiftedGuideRows = [
  ["ქ", "ჭ", "ე", "ღ", "თ", "ყ", "უ", "ი", "ო", "პ"],
  ["ა", "შ", "დ", "ფ", "გ", "ჰ", "ჟ", "კ", "ლ"],
  ["⇧", "ძ", "ხ", "ჩ", "ვ", "ბ", "ნ", "მ", "⌫"]
];


function MoonIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 18, height: 18, alignItems: "center", justifyContent: "center" }}>
      {/* outer circle */}
      <View
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          borderWidth: 2,
          borderColor: color,
          overflow: "hidden",
          position: "relative"
        }}
      >
        {/* "bite" that makes the crescent */}
        <View
          style={{
            position: "absolute",
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: "transparent",
            top: -3,
            right: -3,
            borderWidth: 3,
            borderColor: color,
          }}
        />
      </View>
    </View>
  );
}


function SunIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 18, height: 18, alignItems: "center", justifyContent: "center" }}>
      {/* center circle */}
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
          position: "absolute"
        }}
      />
      {/* rays — 8 tiny bars rotated */}
      {[0, 45, 90, 135].map((deg) => (
        <View
          key={deg}
          style={{
            position: "absolute",
            width: 18,
            height: 2,
            borderRadius: 1,
            backgroundColor: color,
            transform: [{ rotate: `${deg}deg` }],
            opacity: 0.85
          }}
        />
      ))}
    </View>
  );
}


function BookIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 20, height: 18, alignItems: "center", justifyContent: "center" }}>
      {/* left page */}
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 1,
          width: 8,
          height: 14,
          borderTopLeftRadius: 2,
          borderBottomLeftRadius: 2,
          borderWidth: 2,
          borderRightWidth: 0,
          borderColor: color
        }}
      />
      {/* right page */}
      <View
        style={{
          position: "absolute",
          right: 0,
          top: 1,
          width: 8,
          height: 14,
          borderTopRightRadius: 2,
          borderBottomRightRadius: 2,
          borderWidth: 2,
          borderLeftWidth: 0,
          borderColor: color
        }}
      />
      {/* spine */}
      <View
        style={{
          position: "absolute",
          width: 2,
          height: 14,
          top: 1,
          backgroundColor: color
        }}
      />
      {/* top arc */}
      <View
        style={{
          position: "absolute",
          top: 0,
          width: 6,
          height: 4,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          borderWidth: 2,
          borderBottomWidth: 0,
          borderColor: color
        }}
      />
    </View>
  );
}

function LeaderboardIcon({ color }: { color: string }) {
  return (
    <View style={{ alignItems: "flex-end", flexDirection: "row", gap: 3, height: 20, width: 22 }}>
      <View style={{ backgroundColor: color, borderRadius: 2, height: 9, width: 4 }} />
      <View style={{ backgroundColor: color, borderRadius: 2, height: 16, width: 4 }} />
      <View style={{ backgroundColor: color, borderRadius: 2, height: 12, width: 4 }} />
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark, toggleTheme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [guideVisible, setGuideVisible] = useState(false);
  const [gameList, setGameList] = useState<GameItem[]>(fallbackGameList);

  useEffect(() => {
    let active = true;

    fetchGames()
      .then((nextGames: ApiGameItem[]) => {
        if (!active) {
          return;
        }

        setGameList(
          nextGames.map((game) => ({
            href: (game.href ?? undefined) as Href | undefined,
            id: game.id ?? game.gameId ?? game.title,
            status: game.status,
            subtitle: game.subtitle,
            title: game.title
          }))
        );
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── HEADER ─────────────────────────────────────────── */}
        <View style={styles.header}>
          {/* titles — centered */}
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>ქართული თამაშები</Text>
            <Text style={styles.title}>გამოიცანი</Text>
          </View>

          {/* icon buttons row — centered */}
          <View style={styles.toolRow}>
            {/* settings */}
            <Pressable
              accessibilityLabel="პარამეტრები"
              style={({ pressed }) => [styles.toolButton, pressed && styles.cardPressed]}
              onPress={() => router.push("/settings" as any)}
            >
              <Feather name="settings" size={18} color={colors.primaryText} />
            </Pressable>

            {/* keyboard guide */}
            <Pressable
              accessibilityLabel="კლავიატურის გზამკვლევის გახსნა"
              style={({ pressed }) => [styles.toolButton, pressed && styles.cardPressed]}
              onPress={() => setGuideVisible(true)}
            >
              <BookIcon color={colors.primaryText} />
            </Pressable>

            <Pressable
              accessibilityLabel="ლიდერბორდის გახსნა"
              style={({ pressed }) => [styles.toolButton, pressed && styles.cardPressed]}
              onPress={() => router.push("/leaderboard")}
            >
              <LeaderboardIcon color={colors.primaryText} />
            </Pressable>

            <Pressable
              accessibilityLabel="მულტიპლეერი"
              style={({ pressed }) => [styles.toolButton, pressed && styles.cardPressed]}
              onPress={() => router.push("/lobby")}
            >
              <Feather name="users" size={18} color={colors.primaryText} />
            </Pressable>

            <Pressable
              accessibilityLabel="პროფილის გახსნა"
              style={({ pressed }) => [styles.profileButton, pressed && styles.cardPressed]}
              onPress={() => router.push("/profile")}
            >
              <Text style={styles.profileButtonText}>{user?.username.slice(0, 2).toUpperCase()}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.list}>
          {gameList.map((game) => {
            const ready = game.status === "ready";
            const done = ready && isDoneToday(game.id, user?.gameStats as any);

            return (
              <Pressable
                key={game.id}
                disabled={!ready}
                style={({ pressed }) => [
                  styles.card,
                  !ready && styles.cardDisabled,
                  pressed && styles.cardPressed
                ]}
                onPress={() => {
                  if (game.href) {
                    router.push(game.href);
                  }
                }}
              >
                {done && (
                  <View style={styles.doneCorner}>
                    <Text style={styles.doneCornerText}>✓</Text>
                  </View>
                )}
                <View style={styles.cardCopy}>
                  <Text style={[styles.cardTitle, !ready && styles.disabledText]}>
                    {game.title}
                  </Text>
                  <Text style={[styles.cardSubtitle, !ready && styles.disabledText]}>
                    {game.subtitle}
                  </Text>
                </View>
                <Text
                  style={[
                    ready ? styles.cardArrow : styles.cardStatus,
                    !ready && styles.disabledText
                  ]}
                >
                  {ready ? "›" : "მალე"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={guideVisible}
        onRequestClose={() => setGuideVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.guideModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>კლავიატურის გზამკვლევი</Text>
              <Pressable
                accessibilityLabel="კლავიატურის გზამკვლევის დახურვა"
                style={({ pressed }) => [styles.closeButton, pressed && styles.cardPressed]}
                onPress={() => setGuideVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>

            <Text style={styles.guideCopy}>
              ქართული ასოები ტელეფონის ჩვეულებრივ განლაგებას მიჰყვება. დააჭირე ⇧-ს
              დამატებითი ასოებისთვის, ერთი ასოს შემდეგ კი კლავიატურა ჩვეულებრივ რეჟიმს დაუბრუნდება.
            </Text>

            <View style={styles.guideSection}>
              <Text style={styles.guideLabel}>ჩვეულებრივი</Text>
              {normalGuideRows.map((row) => (
                <View key={row.join("")} style={styles.guideRow}>
                  {row.map((key) => (
                    <View key={key} style={styles.guideKey}>
                      <Text style={styles.guideKeyText}>{key}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>

            <View style={styles.guideSection}>
              <Text style={styles.guideLabel}>დამატებითი ასოები</Text>
              {shiftedGuideRows.map((row) => (
                <View key={row.join("")} style={styles.guideRow}>
                  {row.map((key) => (
                    <View key={key} style={[styles.guideKey, key === "⇧" && styles.guideKeyActive]}>
                      <Text style={[styles.guideKeyText, key === "⇧" && styles.guideKeyTextActive]}>
                        {key}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>

            <View style={styles.guidePairs}>
              <Text style={styles.guidePairText}>წ → ჭ</Text>
              <Text style={styles.guidePairText}>რ → ღ</Text>
              <Text style={styles.guidePairText}>ტ → თ</Text>
              <Text style={styles.guidePairText}>ს → შ</Text>
              <Text style={styles.guidePairText}>ზ → ძ</Text>
              <Text style={styles.guidePairText}>ც → ჩ</Text>
              <Text style={styles.guidePairText}>ჯ → ჟ</Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) : 0
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingBottom: 32,
      paddingTop: 24
    },
    header: {
      alignItems: "center",
      gap: 16,
      marginBottom: 26
    },
    headerCopy: {
      alignItems: "center",
      gap: 5
    },
    kicker: {
      color: colors.accent,
      fontSize: 15,
      fontWeight: "900",
      textAlign: "center"
    },
    title: {
      color: colors.primaryText,
      fontSize: 40,
      fontWeight: "900",
      letterSpacing: 0,
      textAlign: "center"
    },
    toolRow: {
      flexDirection: "row",
      gap: 10,
      justifyContent: "center"
    },
    toolButton: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      height: 42,
      justifyContent: "center",
      width: 42
    },
    profileButton: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 8,
      height: 42,
      justifyContent: "center",
      minWidth: 42,
      paddingHorizontal: 8
    },
    profileButtonText: {
      color: "#ffffff",
      fontSize: 13,
      fontWeight: "900"
    },
    list: {
      gap: 14
    },
    card: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      elevation: 2,
      flexDirection: "row",
      justifyContent: "space-between",
      minHeight: 84,
      overflow: "hidden",
      paddingHorizontal: 18,
      paddingVertical: 15,
      position: "relative",
      shadowColor: colors.shadow,
      shadowOffset: { height: 3, width: 0 },
      shadowOpacity: 0.08,
      shadowRadius: 10
    },
    cardDisabled: {
      backgroundColor: colors.button
    },
    cardCopy: {
      flex: 1,
      paddingRight: 12
    },
    cardPressed: {
      opacity: 0.72
    },
    cardTitle: {
      color: colors.primaryText,
      fontSize: 22,
      fontWeight: "900",
      letterSpacing: 0
    },
    cardSubtitle: {
      color: colors.secondaryText,
      fontSize: 14,
      fontWeight: "700",
      marginTop: 3
    },
    cardArrow: {
      color: colors.accent,
      fontSize: 38,
      fontWeight: "500",
      lineHeight: 38
    },
    cardStatus: {
      color: colors.disabled,
      fontSize: 13,
      fontWeight: "900"
    },
    doneCorner: {
      position: "absolute",
      top: 0,
      right: 0,
      backgroundColor: colors.correct,
      borderBottomLeftRadius: 7,
      paddingHorizontal: 7,
      paddingVertical: 3,
      zIndex: 1
    },
    doneCornerText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "900"
    },
    disabledText: {
      color: colors.disabled
    },
    modalBackdrop: {
      alignItems: "center",
      backgroundColor: colors.overlay,
      flex: 1,
      justifyContent: "center",
      padding: 18
    },
    guideModal: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      maxWidth: 520,
      padding: 18,
      width: "100%"
    },
    modalHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12
    },
    modalTitle: {
      color: colors.primaryText,
      fontSize: 22,
      fontWeight: "900"
    },
    closeButton: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderRadius: 8,
      height: 36,
      justifyContent: "center",
      width: 36
    },
    closeButtonText: {
      color: colors.primaryText,
      fontSize: 25,
      fontWeight: "700",
      lineHeight: 28
    },
    guideCopy: {
      color: colors.secondaryText,
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 20,
      marginBottom: 16
    },
    guideSection: {
      marginBottom: 14
    },
    guideLabel: {
      color: colors.primaryText,
      fontSize: 13,
      fontWeight: "900",
      marginBottom: 7
    },
    guideRow: {
      flexDirection: "row",
      gap: 3,
      justifyContent: "center",
      marginBottom: 4,
      width: "100%"
    },
    guideKey: {
      alignItems: "center",
      backgroundColor: colors.key,
      borderRadius: 6,
      flex: 1,
      height: 30,
      justifyContent: "center",
      minWidth: 0,
      paddingHorizontal: 2
    },
    guideKeyActive: {
      backgroundColor: colors.keyActive
    },
    guideKeyText: {
      color: colors.primaryText,
      fontSize: 13,
      fontWeight: "900"
    },
    guideKeyTextActive: {
      color: colors.card
    },
    guidePairs: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 2
    },
    guidePairText: {
      backgroundColor: colors.button,
      borderRadius: 8,
      color: colors.primaryText,
      fontSize: 13,
      fontWeight: "900",
      paddingHorizontal: 10,
      paddingVertical: 7
    }
  });
}

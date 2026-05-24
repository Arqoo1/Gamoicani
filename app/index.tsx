import { Href, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import games from "../data/games.json";
import { AppColors, useAppTheme } from "../src/theme";

type GameItem = {
  href?: Href;
  id: string;
  status: "ready" | "soon";
  subtitle: string;
  title: string;
};

const gameList = games as GameItem[];
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

/** Moon crescent icon built from Views */
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
            // This overlay darkens the right side, forming the crescent
          }}
        />
      </View>
    </View>
  );
}

/** Sun icon built from Views */
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

/** Open book icon built from Views */
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

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [guideVisible, setGuideVisible] = useState(false);

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
            {/* dark-mode toggle */}
            <Pressable
              accessibilityLabel="თემის შეცვლა"
              style={({ pressed }) => [styles.toolButton, pressed && styles.cardPressed]}
              onPress={toggleTheme}
            >
              {isDark ? <SunIcon color={colors.primaryText} /> : <MoonIcon color={colors.primaryText} />}
            </Pressable>

            {/* keyboard guide */}
            <Pressable
              accessibilityLabel="კლავიატურის გზამკვლევის გახსნა"
              style={({ pressed }) => [styles.toolButton, pressed && styles.cardPressed]}
              onPress={() => setGuideVisible(true)}
            >
              <BookIcon color={colors.primaryText} />
            </Pressable>
          </View>
        </View>

        <View style={styles.list}>
          {gameList.map((game) => {
            const ready = game.status === "ready";

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
      backgroundColor: colors.background
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
      paddingHorizontal: 18,
      paddingVertical: 15,
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

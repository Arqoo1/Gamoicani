import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Animated, Easing, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSocket } from "../src/socket";
import { AppColors, useAppTheme } from "../src/theme";

export default function MultiplayerScreen() {
  const router = useRouter();
  const { roomId, gameType, puzzle: puzzleStr } = useLocalSearchParams<{ roomId: string, gameType: string, puzzle: string }>();
  const puzzle = useMemo(() => puzzleStr ? JSON.parse(puzzleStr) : null, [puzzleStr]);
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { socket, opponentProfile } = useSocket();

  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [guessResults, setGuessResults] = useState<any[]>([]); 
  const [opponentProgress, setOpponentProgress] = useState<any[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [results, setResults] = useState<any>(null);

  const [activeEmote, setActiveEmote] = useState<string | null>(null);
  const emoteAnimY = useRef(new Animated.Value(0)).current;
  const emoteAnimOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!socket) return;

    function onGuessResult(data: any) {
      setGuessResults(prev => [...prev, data]);
    }

    function onOpponentGuess(data: any) {
      setOpponentProgress(prev => [...prev, data]);
    }

    function onGameOver(data: any) {
      setGameOver(true);
      setResults(data);
    }

    function onReceiveEmote(data: { emote: string }) {
      setActiveEmote(data.emote);
      emoteAnimY.setValue(20);
      emoteAnimOpacity.setValue(1);
      
      Animated.parallel([
        Animated.timing(emoteAnimY, {
          toValue: -40,
          duration: 1500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(emoteAnimOpacity, {
          toValue: 0,
          duration: 1500,
          delay: 500,
          useNativeDriver: true
        })
      ]).start(() => setActiveEmote(null));
    }

    socket.on("guess-result", onGuessResult);
    socket.on("opponent-guess", onOpponentGuess);
    socket.on("game-over", onGameOver);
    socket.on("receive-emote", onReceiveEmote);

    return () => {
      socket.off("guess-result", onGuessResult);
      socket.off("opponent-guess", onOpponentGuess);
      socket.off("game-over", onGameOver);
      socket.off("receive-emote", onReceiveEmote);
    };
  }, [socket, emoteAnimY, emoteAnimOpacity]);

  const sendEmote = (emote: string) => {
    socket?.emit("send-emote", { roomId, emote });
    setActiveEmote(emote);
    emoteAnimY.setValue(20);
    emoteAnimOpacity.setValue(1);
    
    Animated.parallel([
      Animated.timing(emoteAnimY, {
        toValue: -40,
        duration: 1500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      }),
      Animated.timing(emoteAnimOpacity, {
        toValue: 0,
        duration: 1500,
        delay: 500,
        useNativeDriver: true
      })
    ]).start(() => setActiveEmote(null));
  };

  const submitGuess = () => {
    if (currentGuess.length !== 5) return;
    socket?.emit("submit-guess", { roomId, guess: currentGuess });
    setGuesses(prev => [...prev, currentGuess]);
    setCurrentGuess("");
  };

  const handleKeyPress = (key: string) => {
    if (gameOver) return;
    if (key === "⌫") {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (key === "ENTER") {
      submitGuess();
    } else if (currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key);
    }
  };

  const playAgain = () => {
    router.replace("/lobby");
  };

  const kbRows = [
    ["ქ", "წ", "ე", "რ", "ტ", "ყ", "უ", "ი", "ო", "პ"],
    ["ა", "ს", "დ", "ფ", "გ", "ჰ", "ჯ", "კ", "ლ"],
    ["ENTER", "ზ", "ხ", "ც", "ვ", "ბ", "ნ", "მ", "⌫"]
  ];

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="უკან დაბრუნება"
          onPress={() => router.replace("/lobby")}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Feather color={colors.primaryText} name="chevron-left" size={28} />
        </Pressable>
        <Text style={styles.title}>
          {gameType === "wordle" ? "სიტყვობანა" : gameType === "andazebi" ? "ანდაზები" : "მატჩი"}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Opponent Progress (Mini Grid) */}
        <View style={styles.opponentBox}>
          {/* Opponent Profile Sync */}
          {opponentProfile?.equippedItems?.banner && (
            <View style={styles.opponentBannerStrip}>
              {/* Note: In a full app we'd fetch the exact colors for the banner ID here, 
                  but we'll use a stylized fallback for the live sync demo if colors aren't passed via socket */}
              <View style={[styles.opponentBannerFill, { backgroundColor: colors.accent + "55" }]} />
            </View>
          )}
          <View style={styles.opponentProfileHeader}>
            <View style={[styles.opponentAvatar, { backgroundColor: colors.button }]}>
              <Text style={styles.opponentAvatarText}>
                {opponentProfile?.equippedItems?.avatar === "avatar_ninja" ? "🥷" :
                 opponentProfile?.equippedItems?.avatar === "avatar_wizard" ? "🧙‍♂️" :
                 opponentProfile?.equippedItems?.avatar === "avatar_cat" ? "🐱" : "👤"}
              </Text>
            </View>
            <View style={styles.opponentNameBox}>
              <Text style={styles.opponentName}>
                {opponentProfile?.displayName || "მოწინააღმდეგე"}
              </Text>
              {opponentProfile?.equippedItems?.nameTag && (
                <View style={[styles.opponentTag, { borderColor: colors.accent }]}>
                  <Text style={[styles.opponentTagText, { color: colors.accent }]}>
                    {opponentProfile.equippedItems.nameTag === "tag_pro" ? "🏆 პრო" : "⭐ მოთამაშე"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.miniGrid}>
            {Array.from({ length: 6 }).map((_, rIdx) => {
              const rowResult = opponentProgress[rIdx];
              return (
                <View key={`opp-row-${rIdx}`} style={styles.miniRow}>
                  {Array.from({ length: 5 }).map((_, cIdx) => (
                    <View
                      key={`opp-cell-${rIdx}-${cIdx}`}
                      style={[
                        styles.miniCell,
                        rowResult && { backgroundColor: rowResult[cIdx] === "correct" ? colors.correct : rowResult[cIdx] === "present" ? colors.present : colors.absent }
                      ]}
                    />
                  ))}
                </View>
              );
            })}
          </View>
          {activeEmote && (
            <Animated.Text
              style={[
                styles.floatingEmote,
                {
                  opacity: emoteAnimOpacity,
                  transform: [{ translateY: emoteAnimY }]
                }
              ]}
            >
              {activeEmote}
            </Animated.Text>
          )}
        </View>

        {/* My Grid */}
        <View style={styles.myGrid}>
          {Array.from({ length: 6 }).map((_, rIdx) => {
            const isCurrentRow = rIdx === guesses.length;
            const guess = isCurrentRow ? currentGuess : guesses[rIdx] || "";
            const result = guessResults[rIdx];

            return (
              <View key={`my-row-${rIdx}`} style={styles.gridRow}>
                {Array.from({ length: 5 }).map((_, cIdx) => {
                  const letter = guess[cIdx] || "";
                  let bgColor = colors.card;
                  let borderColor = colors.border;
                  
                  if (result) {
                    const status = result[cIdx];
                    bgColor = status === "correct" ? colors.correct : status === "present" ? colors.present : colors.absent;
                    borderColor = bgColor;
                  } else if (letter) {
                    borderColor = colors.secondaryText;
                  }

                  return (
                    <View key={`my-cell-${rIdx}-${cIdx}`} style={[styles.gridCell, { backgroundColor: bgColor, borderColor }]}>
                      <Text style={[styles.cellText, result && { color: "#fff" }]}>{letter}</Text>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>

        {/* Keyboard */}
        <View style={styles.keyboard}>
          {kbRows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.kbRow}>
              {row.map(key => (
                <Pressable
                  key={key}
                  style={({ pressed }) => [styles.kbKey, key === "ENTER" && styles.kbKeyLarge, pressed && styles.pressed]}
                  onPress={() => handleKeyPress(key)}
                >
                  <Text style={styles.kbKeyText}>{key}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>

        {/* Emotes Row */}
        {!gameOver && (
          <View style={styles.emotesRow}>
            {["🤬", "🧠", "🎯", "🔥", "😂"].map(emote => (
              <Pressable
                key={emote}
                style={({ pressed }) => [styles.emoteBtn, pressed && styles.pressed]}
                onPress={() => sendEmote(emote)}
              >
                <Text style={styles.emoteBtnText}>{emote}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Game Over Overlay */}
      {gameOver && results && (
        <View style={styles.overlay}>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>
              {results.winner === socket?.id ? "🏆 მოიგე!" : results.winner === "draw" ? "ფრე!" : "წააგე 😢"}
            </Text>
            {gameType === "wordle" && results.answer && (
              <Text style={styles.resultAnswer}>სიტყვა იყო: {results.answer}</Text>
            )}
            <View style={styles.resultActions}>
              <Pressable style={styles.primaryBtn} onPress={playAgain}>
                <Text style={styles.primaryBtnText}>თავიდან</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => router.replace("/lobby")}>
                <Text style={styles.secondaryBtnText}>ლობი</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background , paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) : 0 },
    header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", padding: 12 },
    backBtn: { alignItems: "center", height: 44, justifyContent: "center", width: 44 },
    title: { color: colors.primaryText, fontSize: 18, fontWeight: "900" },
    pressed: { opacity: 0.7 },
    content: { alignItems: "center", paddingVertical: 20 },
    
    opponentBox: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 32,
      padding: 12
    },
    opponentLabel: {
      color: colors.secondaryText,
      fontSize: 12,
      fontWeight: "800",
      marginBottom: 8,
      textTransform: "uppercase"
    },
    miniGrid: { gap: 2 },
    miniRow: { flexDirection: "row", gap: 2 },
    miniCell: {
      backgroundColor: colors.button,
      borderRadius: 2,
      height: 12,
      width: 12
    },
    floatingEmote: {
      position: "absolute",
      fontSize: 48,
      zIndex: 10,
      elevation: 10
    },

    myGrid: { gap: 6, marginBottom: 40 },
    gridRow: { flexDirection: "row", gap: 6 },
    gridCell: {
      alignItems: "center",
      borderWidth: 2,
      borderRadius: 6,
      height: 56,
      justifyContent: "center",
      width: 56
    },
    cellText: { color: colors.primaryText, fontSize: 28, fontWeight: "900" },

    keyboard: { gap: 6, paddingHorizontal: 4, width: "100%", maxWidth: 500, alignSelf: "center" },
    kbRow: { flexDirection: "row", justifyContent: "center", gap: 4 },
    kbKey: {
      alignItems: "center",
      backgroundColor: colors.key,
      borderRadius: 6,
      flex: 1,
      height: 54,
      justifyContent: "center",
      minWidth: 0,
      maxWidth: 40
    },
    kbKeyLarge: { flex: 1.5, maxWidth: 60 },
    kbKeyText: { color: colors.primaryText, fontSize: 16, fontWeight: "800" },

    emotesRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 12,
      marginTop: 20,
    },
    emoteBtn: {
      backgroundColor: colors.button,
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    emoteBtnText: {
      fontSize: 22,
    },
    opponentBannerStrip: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 36,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      overflow: "hidden",
    },
    opponentBannerFill: { flex: 1 },
    opponentProfileHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 16,
      marginTop: 4,
      zIndex: 2,
    },
    opponentAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.card,
    },
    opponentAvatarText: { fontSize: 22 },
    opponentNameBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
    opponentName: { color: colors.primaryText, fontSize: 16, fontWeight: "900" },
    opponentTag: {
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    opponentTagText: { fontSize: 10, fontWeight: "800" },

    overlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.overlay,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      zIndex: 100
    },
    resultCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 32,
      alignItems: "center",
      width: "100%",
      maxWidth: 340,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8
    },
    resultTitle: { color: colors.primaryText, fontSize: 32, fontWeight: "900", marginBottom: 16 },
    resultAnswer: { color: colors.secondaryText, fontSize: 18, fontWeight: "700", marginBottom: 24 },
    resultActions: { gap: 12, width: "100%" },
    primaryBtn: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center"
    },
    primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "900" },
    secondaryBtn: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center"
    },
    secondaryBtnText: { color: colors.primaryText, fontSize: 16, fontWeight: "800" }
  });
}

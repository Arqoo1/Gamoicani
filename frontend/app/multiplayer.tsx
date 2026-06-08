import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSocket } from "../src/socket";
import { AppColors, useAppTheme } from "../src/theme";

export default function MultiplayerScreen() {
  const router = useRouter();
  const { roomId, gameType, puzzle: puzzleStr } = useLocalSearchParams<{ roomId: string, gameType: string, puzzle: string }>();
  const puzzle = useMemo(() => puzzleStr ? JSON.parse(puzzleStr) : null, [puzzleStr]);
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { socket } = useSocket();

  // Local state for Wordle
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [guessResults, setGuessResults] = useState<any[]>([]); // Results back from server
  const [opponentProgress, setOpponentProgress] = useState<any[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [results, setResults] = useState<any>(null);

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

    socket.on("guess-result", onGuessResult);
    socket.on("opponent-guess", onOpponentGuess);
    socket.on("game-over", onGameOver);

    return () => {
      socket.off("guess-result", onGuessResult);
      socket.off("opponent-guess", onOpponentGuess);
      socket.off("game-over", onGameOver);
    };
  }, [socket]);

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

  // Keyboard layout
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
          <Text style={styles.opponentLabel}>მოწინააღმდეგე</Text>
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
    safe: { flex: 1, backgroundColor: colors.background },
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

    overlay: {
      ...StyleSheet.absoluteFillObject,
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

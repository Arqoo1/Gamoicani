import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, StatusBar, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/application/providers/theme";
import { useWordleScreenModel } from "@/features/wordle/hooks/useWordleScreenModel";
import { createStyles } from "@/features/wordle/screens/WordleScreen.styles";
import { WordleBoardSection } from "@/features/wordle/ui/WordleBoardSection";
import { WordleFooter } from "@/features/wordle/ui/WordleFooter";
import { WordleResultModal } from "@/features/wordle/ui/WordleResultModal";
import { WordleTopBar } from "@/features/wordle/ui/WordleTopBar";

export default function WordleScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const [gameMode, setGameMode] = useState<"daily" | "practice" | "tutorial" | null>(null);

  const model = useWordleScreenModel(gameMode, width, height);
  const styles = createStyles(colors);

  if (!model) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "right", "left"]} style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.card} />

      <WordleTopBar
        styles={styles}
        onBack={() => router.back()}
        onRefresh={model.startRandomPuzzle}
        onStats={() => router.push("/stats")}
        showStats={gameMode !== "practice" && gameMode !== "tutorial"}
      />

      <WordleBoardSection
        styles={styles}
        answer={model.answer}
        currentLetters={model.currentLetters}
        guesses={model.guesses}
        isOffline={model.isOffline}
        message={model.message}
        puzzleNumber={model.puzzleNumber}
        shakeTranslateX={model.shakeTranslateX}
        tileFontSize={model.tileFontSize}
        tileGap={model.tileGap}
        tileSize={model.tileSize}
        boardWidth={model.boardWidth}
      />

      <WordleFooter
        styles={styles}
        disabled={model.gameStatus !== "playing"}
        isShifted={model.isShifted}
        letterScores={model.letterScores}
        onKeyPress={model.handleKeyPress}
      />

      <WordleResultModal
        answer={model.answer}
        gameStatus={model.gameStatus}
        guesses={model.guesses}
        isVisible={model.isResultModalVisible}
        onClose={() => model.setIsResultModalVisible(false)}
        onNextPuzzle={() => {
          model.setIsResultModalVisible(false);
          model.startRandomPuzzle();
        }}
        puzzleNumber={model.puzzleNumber}
        styles={styles}
      />
    </SafeAreaView>
  );
}

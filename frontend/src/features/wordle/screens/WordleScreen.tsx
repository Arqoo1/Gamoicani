import { useRouter } from "expo-router";
import { useState } from "react";
import { StatusBar, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/application/providers/theme";
import { createStyles } from "@/features/wordle/screens/WordleScreen.styles";
import { useWordleScreenModel } from "@/features/wordle/hooks/useWordleScreenModel";
import { WordleTopBar } from "@/features/wordle/ui/WordleTopBar";
import { WordleModeSheet } from "@/features/wordle/ui/WordleModeSheet";
import { WordleBoardSection } from "@/features/wordle/ui/WordleBoardSection";
import { WordleFooter } from "@/features/wordle/ui/WordleFooter";

export default function WordleScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors);
  const [gameMode, setGameMode] = useState<"daily" | "practice" | "tutorial" | null>(null);

  const model = useWordleScreenModel(gameMode, width, height);

  return (
    <SafeAreaView edges={["top", "right", "left"]} style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.card} />

      <WordleModeSheet
        visible={gameMode === null}
        isDailyDone={model.isDailyDone}
        puzzleNumber={model.puzzleNumber}
        onClose={() => router.back()}
        onSelectDaily={() => setGameMode("daily")}
        onSelectPractice={() => {
          model.startRandomPuzzle();
          setGameMode("practice");
        }}
        onSelectTutorial={() => {
          model.resetBoard(0);
          setGameMode("tutorial");
          model.setMessage("აკრიფეთ 'ხეობა'");
        }}
        styles={styles}
      />

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

      <WordleBoardSection.ResultModalWrapper
        styles={styles}
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
      />
    </SafeAreaView>
  );
}

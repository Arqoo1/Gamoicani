import { Text, View } from "react-native";
import { Animated } from "react-native";
import { WordleGrid } from "@/features/wordle/ui/WordleGrid";
import { WordleResultModal } from "@/features/wordle/ui/WordleResultModal";
import { ContentLoadStateBanner } from "@/shared/ui/ContentLoadStateBanner";
import { GameStatus } from "@/features/wordle/model/wordle";
import { createStyles } from "@/features/wordle/screens/WordleScreen.styles";

type WordleStyles = ReturnType<typeof createStyles>;

export function WordleBoardSection({
  styles,
  answer,
  currentLetters,
  guesses,
  isOffline,
  message,
  puzzleNumber,
  shakeTranslateX,
  tileFontSize,
  tileGap,
  tileSize,
  boardWidth,
}: {
  styles: WordleStyles;
  answer: string;
  currentLetters: string[];
  guesses: string[];
  isOffline: boolean;
  message: string;
  puzzleNumber: number;
  shakeTranslateX: Animated.Value | Animated.AnimatedInterpolation<string | number>;
  tileFontSize: number;
  tileGap: number;
  tileSize: number;
  boardWidth: number;
}) {
  return (
    <View style={styles.boardArea}>
      <ContentLoadStateBanner isOffline={isOffline} />
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{`#${puzzleNumber}`}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      <WordleGrid
        answer={answer}
        currentLetters={currentLetters}
        guesses={guesses}
        maxGuesses={6}
        shakeAnim={shakeTranslateX}
        styles={styles}
        tileFontSize={tileFontSize}
        tileSize={tileSize}
        wordLength={5}
        tileGap={tileGap}
        boardWidth={boardWidth}
      />
    </View>
  );
}

WordleBoardSection.ResultModalWrapper = function ResultModalWrapper({
  answer,
  gameStatus,
  guesses,
  isVisible,
  onClose,
  onNextPuzzle,
  puzzleNumber,
  styles,
}: {
  answer: string;
  gameStatus: GameStatus;
  guesses: string[];
  isVisible: boolean;
  onClose: () => void;
  onNextPuzzle: () => void;
  puzzleNumber: number;
  styles: WordleStyles;
}) {
  return (
    <WordleResultModal
      answer={answer}
      gameStatus={gameStatus}
      guesses={guesses}
      isVisible={isVisible}
      onClose={onClose}
      onNextPuzzle={onNextPuzzle}
      puzzleNumber={puzzleNumber}
      styles={styles}
    />
  );
};

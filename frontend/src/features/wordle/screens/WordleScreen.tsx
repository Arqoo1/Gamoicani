import { useRouter } from "expo-router";
import { triggerSelectionHaptic } from "@/shared/services/haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import words from "@data/words.json";
import { fetchGameContent } from "@/features/games/api/gamesApi";
import { useAuth } from "@/application/providers/auth";
import { useAppTheme } from "@/application/providers/theme";
import {
  getDailyPuzzleNumber,
  LetterScore,
  mergeLetterScores,
  scoreGuess,
  splitWord,
  WORDLE_EPOCH
} from "@/features/wordle/model/wordle";
import { cacheGameContent, getCachedGameContent } from "@/shared/storage/contentCache";
import { StatsIcon } from "@/features/wordle/ui/WordleBoardPieces";
import { GeorgianKeyboard } from "@/shared/ui/GeorgianKeyboard";
import { WordleGrid } from "@/features/wordle/ui/WordleGrid";
import { WordleResultModal } from "@/features/wordle/ui/WordleResultModal";
import { useWordleGame } from "@/features/wordle/hooks/useWordleGame";
import { createStyles } from "@/features/wordle/screens/WordleScreen.styles";

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
const USE_NATIVE_ANIMATION_DRIVER = Platform.OS !== "web";

type WordsJson = {
  answers: string[];
  meta?: {
    language: string;
    source?: {
      license: string;
      name: string;
      url: string;
    };
    wordLength: number;
  };
  validWords: string[];
};

const fallbackWordData = words as WordsJson;

export default function WordleScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { updateUser, user } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [gameMode, setGameMode] = useState<"daily" | "practice" | "tutorial" | null>(null);
  const [wordData, setWordData] = useState<WordsJson>(fallbackWordData);
  const dailyPuzzleNumber = getDailyPuzzleNumber(WORDLE_EPOCH);

  const isDailyDone = useMemo(() => {
    const stat = (user?.gameStats as any)?.["wordle"];
    if (!stat?.lastCompletedKey) return false;
    return stat.lastCompletedKey === String(dailyPuzzleNumber);
  }, [user?.gameStats, dailyPuzzleNumber]);

  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef<ConfettiCannon>(null);

  const shakeCurrentRow = useCallback(() => {
    shake.stopAnimation();
    shake.setValue(0);
    Animated.sequence(
      [1, 2, 3, 4, 5, 6].map((toValue) =>
        Animated.timing(shake, { duration: 38, toValue, useNativeDriver: USE_NATIVE_ANIMATION_DRIVER })
      )
    ).start();
  }, [shake]);

  const {
    answer,
    currentLetters,
    gameStatus,
    guesses,
    isShifted,
    message,
    puzzleNumber,
    toast,
    handleKeyPress,
    resetBoard,
    setMessage,
    startRandomPuzzle
  } = useWordleGame(
    gameMode,
    wordData,
    user,
    updateUser,
    () => setIsResultModalVisible(true),
    shakeCurrentRow,
    () => confettiRef.current?.start()
  );

  useEffect(() => {
    let active = true;

    fetchGameContent<WordsJson>("wordle")
      .then((nextWordData) => {
        if (active && nextWordData.answers?.length && nextWordData.validWords?.length) {
          setWordData(nextWordData);
          cacheGameContent("wordle", nextWordData).catch(() => {});
        }
      })
      .catch(async () => {
        if (!active) return;
        const cached = await getCachedGameContent<WordsJson>("wordle").catch(() => null);
        if (active && cached?.answers?.length && cached.validWords?.length) {
          setWordData(cached);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const safeHeight = Math.max(0, height - insets.top - insets.bottom);
  const tileGap = width < 380 ? 4 : 6;
  const boardWidthPercent = width >= 768 ? 0.72 : 0.92;
  const boardMaxWidth = width >= 1024 ? 680 : width >= 768 ? 600 : 390;
  const availableBoardWidth = Math.min(width * boardWidthPercent, boardMaxWidth);
  const maxTileFromWidth = (availableBoardWidth - tileGap * (WORD_LENGTH - 1)) / WORD_LENGTH;
  const maxTileFromHeight = ((safeHeight * (width >= 768 ? 0.58 : 0.42)) - tileGap * (MAX_GUESSES - 1)) / MAX_GUESSES;
  const tileSize = Math.max(34, Math.min(maxTileFromWidth, maxTileFromHeight, width >= 1024 ? 104 : width >= 768 ? 92 : 60));
  const tileFontSize = Math.max(20, Math.min(width >= 768 ? 42 : 30, tileSize * 0.5));
  const boardWidth = WORD_LENGTH * tileSize + (WORD_LENGTH - 1) * tileGap;

  const shakeTranslateX = shake.interpolate({
    inputRange: [0, 1, 2, 3, 4, 5, 6],
    outputRange: [0, -10, 10, -8, 8, -4, 0]
  });

  const letterScores = useMemo(() => {
    return guesses.reduce<Record<string, LetterScore>>((scores, guess) => {
      const guessScores = scoreGuess(guess, answer);

      splitWord(guess).forEach((letter, index) => {
        scores[letter] = mergeLetterScores(scores[letter], guessScores[index]);
      });

      return scores;
    }, {});
  }, [answer, guesses]);

  return (
    <SafeAreaView edges={["top", "right", "left"]} style={styles.safe}>
      <ConfettiCannon
        ref={confettiRef}
        count={180}
        origin={{ x: width / 2, y: -10 }}
        autoStart={false}
        fadeOut
      />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.card} />

      <Modal animationType="fade" transparent visible={gameMode === null} onRequestClose={() => router.back()}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modePickerModal}>
            <Text style={styles.modePickerKicker}>სიტყვობანა</Text>
            <Text style={styles.modePickerTitle}>აირჩიე რეჟიმი</Text>

            <Pressable
              disabled={isDailyDone}
              style={({ pressed }) => [
                styles.modePickerOption,
                isDailyDone && styles.modePickerOptionDisabled,
                !isDailyDone && pressed && styles.pressed
              ]}
              onPress={() => setGameMode("daily")}
            >
              <View style={styles.modePickerIconWrap}>
                <Text style={styles.modePickerIcon}>📅</Text>
              </View>
              <View style={styles.modePickerText}>
                <Text style={[styles.modePickerOptionTitle, isDailyDone && styles.modePickerDisabledText]}>
                  დღის სიტყვა
                </Text>
                <Text style={[styles.modePickerOptionSub, isDailyDone && styles.modePickerDisabledText]}>
                  {isDailyDone ? "✓ დღეს უკვე ითამაშე" : `#${puzzleNumber} · ქულები ითვლება`}
                </Text>
              </View>
              {isDailyDone ? <Text style={styles.modePickerDoneCheck}>✓</Text> : <Text style={styles.modePickerArrow}>›</Text>}
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.modePickerOption, styles.modePickerOptionSecondary, pressed && styles.pressed]}
              onPress={() => {
                startRandomPuzzle();
                setGameMode("practice");
              }}
            >
              <View style={styles.modePickerIconWrap}>
                <Text style={styles.modePickerIcon}>🔁</Text>
              </View>
              <View style={styles.modePickerText}>
                <Text style={[styles.modePickerOptionTitle, styles.modePickerOptionTitleSecondary]}>ვარჯიში</Text>
                <Text style={[styles.modePickerOptionSub, styles.modePickerOptionSubSecondary]}>
                  შემთხვევითი სიტყვა · ქულების გარეშე
                </Text>
              </View>
              <Text style={[styles.modePickerArrow, styles.modePickerArrowSecondary]}>›</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.modePickerOption, styles.modePickerOptionSecondary, pressed && styles.pressed]}
              onPress={() => {
                resetBoard(0);
                setGameMode("tutorial");
                setMessage("აკრიფეთ 'ხეობა'");
              }}
            >
              <View style={styles.modePickerIconWrap}>
                <Text style={styles.modePickerIcon}>🎓</Text>
              </View>
              <View style={styles.modePickerText}>
                <Text style={[styles.modePickerOptionTitle, styles.modePickerOptionTitleSecondary]}>სწავლება</Text>
                <Text style={[styles.modePickerOptionSub, styles.modePickerOptionSubSecondary]}>
                  გაკვეთილი დამწყებთათვის
                </Text>
              </View>
              <Text style={[styles.modePickerArrow, styles.modePickerArrowSecondary]}>›</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.modePickerBack, pressed && styles.pressed]}
              onPress={() => router.back()}
            >
              <Text style={styles.modePickerBackText}>← უკან</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Pressable style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]} onPress={() => router.back()}>
          <Text style={styles.headerIcon}>‹</Text>
        </Pressable>
        <View pointerEvents="none" style={styles.logoWrap}>
          <Text style={styles.logo}>სიტყვობანა</Text>
        </View>
        <View style={styles.headerActions}>
          {gameMode !== "practice" && gameMode !== "tutorial" && (
            <Pressable
              accessibilityLabel="სტატისტიკა"
              style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
              onPress={() => router.push("/stats")}
            >
              <StatsIcon styles={styles} />
            </Pressable>
          )}
          <Pressable
            accessibilityLabel="ახალი სიტყვა"
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
            onPress={startRandomPuzzle}
          >
            <Text style={styles.headerIcon}>↻</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.boardArea}>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {gameMode === "practice" ? "🔁" : gameMode === "tutorial" ? "🎓" : `#${puzzleNumber}`}
          </Text>
          <Text style={styles.message}>{message}</Text>
        </View>

        <WordleGrid
          answer={answer}
          currentLetters={currentLetters}
          guesses={guesses}
          maxGuesses={MAX_GUESSES}
          shakeAnim={shakeTranslateX}
          styles={styles}
          tileFontSize={tileFontSize}
          tileSize={tileSize}
          wordLength={WORD_LENGTH}
          tileGap={tileGap}
          boardWidth={boardWidth}
        />

        {toast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(10, insets.bottom) }]}>
        <GeorgianKeyboard
          disabled={gameStatus !== "playing"}
          isShifted={isShifted}
          letterScores={letterScores}
          onKeyPress={handleKeyPress}
        />
      </View>

      <WordleResultModal
        answer={answer}
        gameStatus={gameStatus}
        guesses={guesses}
        isVisible={isResultModalVisible}
        onClose={() => setIsResultModalVisible(false)}
        onNextPuzzle={() => {
          setIsResultModalVisible(false);
          startRandomPuzzle();
        }}
        puzzleNumber={puzzleNumber}
        styles={styles}
      />
    </SafeAreaView>
  );
}

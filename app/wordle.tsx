import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import words from "../data/words.json";
import {
  GameStatus,
  getDailyPuzzleNumber,
  isFilledWord,
  LetterScore,
  mergeLetterScores,
  scoreGuess,
  splitWord
} from "../src/wordle";
import {
  getProgressKey,
  loadWordleProgress,
  recordWordleCompletion,
  saveWordleProgress
} from "../src/storage";

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
const WORDLE_EPOCH = new Date(Date.UTC(2026, 0, 1));
const DEFAULT_MESSAGE = "დღის სიტყვა";
const USE_NATIVE_ANIMATION_DRIVER = Platform.OS !== "web";
const KEYBOARD_ROWS = [
  ["ქ", "წ", "ე", "რ", "ტ", "ყ", "უ", "ი", "ო", "პ"],
  ["ა", "ს", "დ", "ფ", "გ", "ჰ", "ჯ", "კ", "ლ"],
  ["ზ", "ხ", "ც", "ვ", "ბ", "ნ", "მ"],
  ["Enter", "ჭ", "ღ", "თ", "შ", "ჟ", "ძ", "ჩ", "Backspace"]
];

const QWERTY_TO_GEORGIAN: Record<string, string> = {
  a: "ა",
  b: "ბ",
  c: "ც",
  d: "დ",
  e: "ე",
  f: "ფ",
  g: "გ",
  h: "ჰ",
  i: "ი",
  j: "ჯ",
  k: "კ",
  l: "ლ",
  m: "მ",
  n: "ნ",
  o: "ო",
  p: "პ",
  q: "ქ",
  r: "რ",
  s: "ს",
  t: "ტ",
  u: "უ",
  v: "ვ",
  w: "წ",
  x: "ხ",
  y: "ყ",
  z: "ზ"
};

const SHIFTED_QWERTY_TO_GEORGIAN: Record<string, string> = {
  C: "ჩ",
  J: "ჟ",
  R: "ღ",
  S: "შ",
  T: "თ",
  W: "ჭ",
  Z: "ძ"
};

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

type WordleTileProps = {
  delayIndex: number;
  fontSize: number;
  letter: string;
  score?: LetterScore;
  size: number;
};

const wordData = words as WordsJson;
const answers = wordData.answers.filter((word) => splitWord(word).length === WORD_LENGTH);
const validWords = new Set(
  [...wordData.answers, ...wordData.validWords]
    .map((word) => word.trim())
    .filter((word) => splitWord(word).length === WORD_LENGTH)
);
const georgianLetters = new Set(KEYBOARD_ROWS.flat().filter((key) => key.length === 1));

function getStatusMessage(status: GameStatus, answer: string, guessesCount: number) {
  if (status === "won") {
    return `მოიგე ${guessesCount}/6`;
  }

  if (status === "lost") {
    return `სიტყვა იყო ${answer}`;
  }

  return DEFAULT_MESSAGE;
}

function scoreToEmoji(score: LetterScore) {
  if (score === "correct") {
    return "🟩";
  }

  if (score === "present") {
    return "🟨";
  }

  return "⬛";
}

function StatsIcon() {
  return (
    <View style={styles.statsIcon}>
      <View style={[styles.statsBar, { height: 9 }]} />
      <View style={[styles.statsBar, { height: 16 }]} />
      <View style={[styles.statsBar, { height: 12 }]} />
    </View>
  );
}

function WordleTile({ delayIndex, fontSize, letter, score, size }: WordleTileProps) {
  const flip = useRef(new Animated.Value(1)).current;
  const [visibleScore, setVisibleScore] = useState<LetterScore | undefined>(score);

  useEffect(() => {
    if (!score) {
      flip.stopAnimation();
      flip.setValue(1);
      setVisibleScore(undefined);
      return;
    }

    flip.setValue(1);
    setVisibleScore(undefined);

    Animated.sequence([
      Animated.delay(delayIndex * 110),
      Animated.timing(flip, {
        duration: 120,
        easing: Easing.in(Easing.cubic),
        toValue: 0,
        useNativeDriver: USE_NATIVE_ANIMATION_DRIVER
      })
    ]).start(() => {
      setVisibleScore(score);
      Animated.timing(flip, {
        duration: 120,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: USE_NATIVE_ANIMATION_DRIVER
      }).start();
    });
  }, [delayIndex, flip, score]);

  return (
    <Animated.View
      style={[
        styles.tile,
        { height: size, transform: [{ scaleY: flip }], width: size },
        letter && !visibleScore && styles.tileFilled,
        visibleScore && tileScoreStyles[visibleScore]
      ]}
    >
      <Text
        style={[
          styles.tileText,
          { fontSize, lineHeight: fontSize + 7 },
          visibleScore && styles.tileTextScored
        ]}
      >
        {letter}
      </Text>
    </Animated.View>
  );
}

export default function WordleScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dailyPuzzleNumber = getDailyPuzzleNumber(WORDLE_EPOCH);
  const dailyAnswerIndex = answers.length > 0 ? (dailyPuzzleNumber - 1) % answers.length : 0;
  const [answerOffset, setAnswerOffset] = useState(0);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentLetters, setCurrentLetters] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [toast, setToast] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [recordedCompletionKey, setRecordedCompletionKey] = useState<string | null>(null);
  const shake = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const answer = answers[(dailyAnswerIndex + answerOffset) % answers.length] ?? "სახლი";
  const puzzleNumber = dailyPuzzleNumber + answerOffset;
  const progressKey = getProgressKey(puzzleNumber, answer);
  const safeHeight = Math.max(0, height - insets.top - insets.bottom);
  const keyboardGap = width < 380 ? 3 : 4;
  const keyboardRowGap = keyboardGap + 2;
  const keyHeight = safeHeight < 700 ? 42 : 48;
  const keyMaxWidth = Math.max(25, Math.min(38, (width - 14 - keyboardGap * 9) / 10));
  const actionKeyMaxWidth = Math.min(68, keyMaxWidth * 1.65);
  const tileGap = safeHeight < 700 ? 5 : 6;
  const keyboardHeight =
    KEYBOARD_ROWS.length * keyHeight + (KEYBOARD_ROWS.length - 1) * keyboardRowGap;
  const gameOverControlsHeight = gameStatus === "playing" ? 0 : 56;
  const availableBoardHeight =
    safeHeight - 56 - 42 - 6 - keyboardHeight - gameOverControlsHeight - 40;
  const maxTileFromWidth = (Math.min(width - 32, 360) - tileGap * (WORD_LENGTH - 1)) / WORD_LENGTH;
  const maxTileFromHeight =
    (availableBoardHeight - tileGap * (MAX_GUESSES - 1)) / MAX_GUESSES;
  const tileSize = Math.max(34, Math.min(maxTileFromWidth, maxTileFromHeight));
  const tileFontSize = Math.max(20, Math.min(27, tileSize * 0.48));
  const boardWidth = tileSize * WORD_LENGTH + tileGap * (WORD_LENGTH - 1);
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

  const showToast = useCallback((nextToast: string) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }

    setToast(nextToast);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }, []);

  const shakeCurrentRow = useCallback(() => {
    shake.stopAnimation();
    shake.setValue(0);

    Animated.sequence(
      [1, 2, 3, 4, 5, 6].map((toValue) =>
        Animated.timing(shake, {
          duration: 38,
          toValue,
          useNativeDriver: USE_NATIVE_ANIMATION_DRIVER
        })
      )
    ).start();
  }, [shake]);

  const showInvalidGuess = useCallback(
    (nextMessage: string) => {
      setMessage(nextMessage);
      showToast(nextMessage);
      shakeCurrentRow();
    },
    [shakeCurrentRow, showToast]
  );

  const resetBoard = useCallback((nextOffset?: number) => {
    if (typeof nextOffset === "number") {
      setAnswerOffset(nextOffset);
    }

    setGuesses([]);
    setCurrentLetters([]);
    setGameStatus("playing");
    setMessage(DEFAULT_MESSAGE);
    setRecordedCompletionKey(null);
  }, []);

  useEffect(() => {
    let active = true;

    setIsHydrated(false);
    setRecordedCompletionKey(null);

    loadWordleProgress(progressKey)
      .then((progress) => {
        if (!active) {
          return;
        }

        if (progress?.answer === answer) {
          setGuesses(progress.guesses);
          setCurrentLetters(progress.currentLetters);
          setGameStatus(progress.gameStatus);
          setMessage(
            getStatusMessage(progress.gameStatus, answer, progress.guesses.length)
          );
        } else {
          setGuesses([]);
          setCurrentLetters([]);
          setGameStatus("playing");
          setMessage(DEFAULT_MESSAGE);
        }

        setIsHydrated(true);
      })
      .catch(() => {
        if (active) {
          setIsHydrated(true);
        }
      });

    return () => {
      active = false;
    };
  }, [answer, progressKey]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    saveWordleProgress(progressKey, {
      answer,
      currentLetters,
      gameStatus,
      guesses,
      puzzleNumber,
      savedAt: new Date().toISOString()
    }).catch(() => {});
  }, [answer, currentLetters, gameStatus, guesses, isHydrated, progressKey, puzzleNumber]);

  useEffect(() => {
    if (!isHydrated || gameStatus === "playing") {
      return;
    }

    const completionKey = `${puzzleNumber}:${answer}:${gameStatus}:${guesses.length}`;
    if (recordedCompletionKey === completionKey) {
      return;
    }

    setRecordedCompletionKey(completionKey);
    recordWordleCompletion(puzzleNumber, gameStatus === "won", guesses.length).catch(() => {
      setRecordedCompletionKey(null);
    });
  }, [answer, gameStatus, guesses.length, isHydrated, puzzleNumber, recordedCompletionKey]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const submitGuess = useCallback(() => {
    if (gameStatus !== "playing") {
      return;
    }

    const guess = currentLetters.join("");

    if (!isFilledWord(guess, WORD_LENGTH)) {
      showInvalidGuess("სიტყვა მოკლეა");
      return;
    }

    if (!validWords.has(guess)) {
      showInvalidGuess("სიტყვა სიაში არ არის");
      return;
    }

    const nextGuesses = [...guesses, guess];
    setGuesses(nextGuesses);
    setCurrentLetters([]);

    if (guess === answer) {
      const wonMessage = `მოიგე ${nextGuesses.length}/6`;
      setGameStatus("won");
      setMessage(wonMessage);
      showToast(wonMessage);
      return;
    }

    if (nextGuesses.length === MAX_GUESSES) {
      const lostMessage = `სიტყვა იყო ${answer}`;
      setGameStatus("lost");
      setMessage(lostMessage);
      showToast(lostMessage);
      return;
    }

    setMessage(DEFAULT_MESSAGE);
  }, [answer, currentLetters, gameStatus, guesses, showInvalidGuess, showToast]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === "Enter") {
        submitGuess();
        return;
      }

      if (gameStatus !== "playing") {
        return;
      }

      if (key === "Backspace") {
        setCurrentLetters((letters) => letters.slice(0, -1));
        return;
      }

      if (!georgianLetters.has(key)) {
        return;
      }

      setCurrentLetters((letters) => {
        if (letters.length >= WORD_LENGTH) {
          return letters;
        }

        return [...letters, key];
      });
    },
    [gameStatus, submitGuess]
  );

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleKeyPress("Enter");
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        handleKeyPress("Backspace");
        return;
      }

      const typedLetter = Array.from(event.key)[0];
      const qwertyLetter =
        event.key.length === 1
          ? (event.shiftKey ? SHIFTED_QWERTY_TO_GEORGIAN[event.key.toUpperCase()] : undefined) ??
            QWERTY_TO_GEORGIAN[event.key.toLowerCase()]
          : undefined;
      const letter = qwertyLetter ?? typedLetter;

      if (letter && georgianLetters.has(letter)) {
        event.preventDefault();
        handleKeyPress(letter);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleKeyPress]);

  const shareResult = useCallback(async () => {
    const result = gameStatus === "won" ? `${guesses.length}/6` : "X/6";
    const emojiRows = guesses.map((guess) =>
      scoreGuess(guess, answer).map(scoreToEmoji).join("")
    );

    await Share.share({
      message: [`ქართული WORDLE #${puzzleNumber} ${result}`, ...emojiRows].join("\n")
    });
  }, [answer, gameStatus, guesses, puzzleNumber]);

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          onPress={() => router.push("/")}
        >
          <Text style={styles.headerIcon}>‹</Text>
        </Pressable>
        <Text style={styles.logo}>WORDLE</Text>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel="Stats"
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
            onPress={() => router.push("/stats")}
          >
            <StatsIcon />
          </Pressable>
          <Pressable
            accessibilityLabel="New Wordle"
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
            onPress={() => resetBoard(answerOffset + 1)}
          >
            <Text style={styles.headerIcon}>↻</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>#{puzzleNumber}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>

      <View style={[styles.board, { gap: tileGap, width: boardWidth }]}>
        {Array.from({ length: MAX_GUESSES }).map((_, rowIndex) => {
          const submittedGuess = guesses[rowIndex];
          const rowLetters = submittedGuess
            ? splitWord(submittedGuess)
            : rowIndex === guesses.length
              ? currentLetters
              : [];
          const rowScores = submittedGuess ? scoreGuess(submittedGuess, answer) : undefined;
          const isActiveRow = rowIndex === guesses.length && gameStatus === "playing";

          return (
            <Animated.View
              key={rowIndex}
              style={[
                styles.boardRow,
                { gap: tileGap },
                isActiveRow && { transform: [{ translateX: shakeTranslateX }] }
              ]}
            >
              {Array.from({ length: WORD_LENGTH }).map((__, tileIndex) => (
                <WordleTile
                  key={`${rowIndex}-${tileIndex}`}
                  delayIndex={tileIndex}
                  fontSize={tileFontSize}
                  letter={rowLetters[tileIndex] ?? ""}
                  score={rowScores?.[tileIndex]}
                  size={tileSize}
                />
              ))}
            </Animated.View>
          );
        })}
      </View>

      {toast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      <View style={styles.footer}>
        {gameStatus !== "playing" && (
          <Pressable
            style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
            onPress={shareResult}
          >
            <Text style={styles.shareText}>გაზიარება</Text>
          </Pressable>
        )}

        <View style={[styles.keyboard, { gap: keyboardRowGap }]}>
          {KEYBOARD_ROWS.map((row) => (
            <View key={row.join("")} style={[styles.keyboardRow, { gap: keyboardGap }]}>
              {row.map((key) => {
                const score = letterScores[key];
                const isAction = key === "Enter" || key === "Backspace";

                return (
                  <Pressable
                    key={key}
                    style={({ pressed }) => [
                      styles.key,
                      {
                        height: keyHeight,
                        maxWidth: isAction ? actionKeyMaxWidth : keyMaxWidth
                      },
                      isAction && styles.actionKey,
                      score && keyScoreStyles[score],
                      pressed && styles.keyPressed
                    ]}
                    onPress={() => handleKeyPress(key)}
                  >
                    <Text
                      style={[
                        styles.keyText,
                        score && styles.keyTextScored,
                        isAction && styles.actionKeyText
                      ]}
                    >
                      {key === "Backspace" ? "⌫" : key === "Enter" ? "ENTER" : key}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const tileScoreStyles = StyleSheet.create({
  correct: {
    backgroundColor: "#2f9e5d",
    borderColor: "#2f9e5d"
  },
  present: {
    backgroundColor: "#d6a12a",
    borderColor: "#d6a12a"
  },
  absent: {
    backgroundColor: "#66727f",
    borderColor: "#66727f"
  }
});

const keyScoreStyles = StyleSheet.create({
  correct: {
    backgroundColor: "#2f9e5d"
  },
  present: {
    backgroundColor: "#d6a12a"
  },
  absent: {
    backgroundColor: "#66727f"
  }
});

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
  headerActions: {
    alignItems: "center",
    flexDirection: "row"
  },
  headerButton: {
    alignItems: "center",
    backgroundColor: "#eef4f2",
    borderRadius: 8,
    height: 42,
    justifyContent: "center",
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
    fontSize: 29,
    fontWeight: "900",
    letterSpacing: 0,
    marginLeft: 42
  },
  statsIcon: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 3,
    height: 20,
    justifyContent: "center",
    width: 22
  },
  statsBar: {
    backgroundColor: "#17352d",
    borderRadius: 2,
    width: 4
  },
  metaRow: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderColor: "#dce3e8",
    borderRadius: 8,
    borderWidth: 1,
    elevation: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 42,
    paddingHorizontal: 14,
    shadowColor: "#17352d",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 5
  },
  metaText: {
    color: "#66727f",
    fontSize: 13,
    fontWeight: "800"
  },
  message: {
    color: "#17352d",
    fontSize: 14,
    fontWeight: "800"
  },
  board: {
    alignSelf: "center",
    marginTop: 10
  },
  boardRow: {
    flexDirection: "row"
  },
  tile: {
    alignItems: "center",
    backgroundColor: "#fbfcfd",
    borderColor: "#cad5dc",
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: "center"
  },
  tileFilled: {
    backgroundColor: "#ffffff",
    borderColor: "#17352d"
  },
  tileText: {
    color: "#17352d",
    fontSize: 27,
    fontWeight: "900",
    lineHeight: 34,
    textTransform: "uppercase"
  },
  tileTextScored: {
    color: "#ffffff"
  },
  toast: {
    alignSelf: "center",
    backgroundColor: "#17352d",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    position: "absolute",
    top: 108,
    zIndex: 10
  },
  toastText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800"
  },
  footer: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 10,
    paddingHorizontal: 7
  },
  shareButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#2f9e5d",
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 22,
    paddingVertical: 11
  },
  shareText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900"
  },
  keyboard: {
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderColor: "#dce3e8",
    borderRadius: 8,
    borderWidth: 1,
    elevation: 2,
    maxWidth: 460,
    paddingHorizontal: 4,
    paddingVertical: 8,
    shadowColor: "#17352d",
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    width: "100%"
  },
  keyboardRow: {
    flexDirection: "row",
    justifyContent: "center"
  },
  key: {
    alignItems: "center",
    backgroundColor: "#e3e9ed",
    borderRadius: 8,
    elevation: 1,
    flex: 1,
    justifyContent: "center",
    minWidth: 23,
    shadowColor: "#17352d",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 2
  },
  actionKey: {
    flex: 1.55
  },
  keyText: {
    color: "#17352d",
    fontSize: 17,
    fontWeight: "900"
  },
  keyTextScored: {
    color: "#ffffff"
  },
  actionKeyText: {
    fontSize: 11
  },
  pressed: {
    opacity: 0.64
  },
  keyPressed: {
    opacity: 0.72
  }
});

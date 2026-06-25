import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import ViewShot, { captureRef } from "react-native-view-shot";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import words from "../data/words.json";
import { fetchGameContent } from "../src/api";
import { AppColors, useAppTheme } from "../src/theme";
import {
  GameStatus,
  getDailyPuzzleNumber,
  isFilledWord,
  LetterScore,
  mergeLetterScores,
  scoreGuess,
  splitWord,
  WORDLE_EPOCH
} from "../src/wordle";
import {
  getProgressKey,
  loadWordleProgress,
  recordWordleCompletion,
  saveWordleProgress,
  cacheGameContent,
  getCachedGameContent,
} from "../src/storage";
import { playPop, playBuzz, playWin, playLoss, playReveal } from "../src/sound";

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
const DEFAULT_MESSAGE = "დღის სიტყვა";
const USE_NATIVE_ANIMATION_DRIVER = Platform.OS !== "web";
const BASE_KEYBOARD_ROWS = [
  ["ქ", "წ", "ე", "რ", "ტ", "ყ", "უ", "ი", "ო", "პ"],
  ["ა", "ს", "დ", "ფ", "გ", "ჰ", "ჯ", "კ", "ლ"],
  ["ზ", "ხ", "ც", "ვ", "ბ", "ნ", "მ", "Backspace"]
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

const SHIFTED_GEORGIAN_KEYS: Record<string, string> = {
  ც: "ჩ",
  ჯ: "ჟ",
  რ: "ღ",
  ს: "შ",
  ტ: "თ",
  წ: "ჭ",
  ზ: "ძ"
};

const SHIFT_KEY = "Shift";
const ENTER_KEY = "Enter";
const BACKSPACE_KEY = "Backspace";

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
  styles: WordleStyles;
};

type WordleStyles = ReturnType<typeof createStyles>;

const fallbackWordData = words as WordsJson;
const georgianLetters = new Set([
  ...BASE_KEYBOARD_ROWS.flat().filter((key) => key.length === 1),
  ...Object.values(SHIFTED_GEORGIAN_KEYS)
]);

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

function triggerSelectionHaptic() {
  playPop();
  if (Platform.OS === "web") {
    return;
  }

  Haptics.selectionAsync().catch(() => {});
}

function triggerInvalidHaptic() {
  playBuzz();
  if (Platform.OS === "web") {
    return;
  }

  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}

function triggerCompletionHaptic(won: boolean) {
  if (won) playWin(); else playLoss();
  if (Platform.OS === "web") {
    return;
  }

  Haptics.notificationAsync(
    won ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
  ).catch(() => {});
}

function StatsIcon({ styles }: { styles: WordleStyles }) {
  return (
    <View style={styles.statsIcon}>
      <View style={[styles.statsBar, { height: 9 }]} />
      <View style={[styles.statsBar, { height: 16 }]} />
      <View style={[styles.statsBar, { height: 12 }]} />
    </View>
  );
}

function WordleTile({ delayIndex, fontSize, letter, score, size, styles }: WordleTileProps) {
  const rotation = useRef(new Animated.Value(0)).current;
  const [visibleScore, setVisibleScore] = useState<LetterScore | undefined>(score);
  const animIdRef = useRef(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!score) {
      rotation.stopAnimation();
      rotation.setValue(0);
      setVisibleScore(undefined);
      return;
    }

    const myId = ++animIdRef.current;
    rotation.stopAnimation();
    rotation.setValue(0);
    setVisibleScore(undefined);

    Animated.sequence([
      Animated.delay(delayIndex * 110),
      Animated.timing(rotation, {
        duration: 130,
        easing: Easing.in(Easing.quad),
        toValue: 90,
        useNativeDriver: USE_NATIVE_ANIMATION_DRIVER
      })
    ]).start(({ finished }) => {
      if (!finished || !isMounted.current || animIdRef.current !== myId) return;
      setVisibleScore(score);
      playReveal();
      Animated.timing(rotation, {
        duration: 130,
        easing: Easing.out(Easing.quad),
        toValue: 0,
        useNativeDriver: USE_NATIVE_ANIMATION_DRIVER
      }).start();
    });
  }, [delayIndex, rotation, score]);

  const rotateX = rotation.interpolate({
    inputRange: [0, 90],
    outputRange: ["0deg", "90deg"]
  });

  return (
    <Animated.View
      style={[
        styles.tile,
        { height: size, transform: [{ perspective: 800 }, { rotateX }], width: size },
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
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isOffline, setIsOffline] = useState(false);
  const [gameMode, setGameMode] = useState<"daily" | "practice" | "tutorial" | null>(null);
  const [wordData, setWordData] = useState<WordsJson>(fallbackWordData);
  const dailyPuzzleNumber = getDailyPuzzleNumber(WORDLE_EPOCH);
  const answers = useMemo(
    () => wordData.answers.filter((word) => splitWord(word).length === WORD_LENGTH),
    [wordData.answers]
  );
  const validWords = useMemo(
    () =>
      new Set(
        [...wordData.answers, ...wordData.validWords]
          .map((word) => word.trim())
          .filter((word) => splitWord(word).length === WORD_LENGTH)
      ),
    [wordData.answers, wordData.validWords]
  );
  const dailyAnswerIndex = answers.length > 0 ? (dailyPuzzleNumber - 1) % answers.length : 0;
  const [answerOffset, setAnswerOffset] = useState(0);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentLetters, setCurrentLetters] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [toast, setToast] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isShifted, setIsShifted] = useState(false);
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const [recordedCompletionKey, setRecordedCompletionKey] = useState<string | null>(null);
  const shake = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confettiRef = useRef<ConfettiCannon>(null);
  const viewShotRef = useRef<any>(null);

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

  useEffect(() => {
  }, []);

  const answer = gameMode === "tutorial" ? "სახლი" : (answers[(dailyAnswerIndex + answerOffset) % answers.length] ?? "სახლი");
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
    BASE_KEYBOARD_ROWS.length * keyHeight + (BASE_KEYBOARD_ROWS.length - 1) * keyboardRowGap;
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

  const keyboardRows = useMemo(
    () =>
      BASE_KEYBOARD_ROWS.map((row) =>
        row.map((key) => (isShifted ? SHIFTED_GEORGIAN_KEYS[key] ?? key : key))
      ),
    [isShifted]
  );
  const sharePreview = useMemo(() => {
    const result = gameStatus === "won" ? `${guesses.length}/6` : "X/6";
    const emojiRows = guesses.map((guess) =>
      scoreGuess(guess, answer).map(scoreToEmoji).join("")
    );

    return [`ქართული სიტყვობანა #${puzzleNumber} ${result}`, ...emojiRows].join("\n");
  }, [answer, gameStatus, guesses, puzzleNumber]);

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
      triggerInvalidHaptic();
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
    setIsResultModalVisible(false);
    setIsShifted(false);
    setRecordedCompletionKey(null);
  }, []);

  const startRandomPuzzle = useCallback(() => {
    if (answers.length <= 1) {
      resetBoard(0);
      return;
    }

    const currentAnswerIndex = (dailyAnswerIndex + answerOffset) % answers.length;
    let randomAnswerIndex = Math.floor(Math.random() * answers.length);

    if (randomAnswerIndex === currentAnswerIndex) {
      randomAnswerIndex = (randomAnswerIndex + 1) % answers.length;
    }

    resetBoard(randomAnswerIndex - dailyAnswerIndex);
  }, [answerOffset, answers, answers.length, dailyAnswerIndex, resetBoard]);

  useEffect(() => {
    let active = true;

    setIsHydrated(false);
    setRecordedCompletionKey(null);

    loadWordleProgress(progressKey)
      .then((progress) => {
        if (!active) {
          return;
        }

        if (progress?.answer === answer && progress.gameStatus === "playing") {
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
          if (gameMode === "tutorial") {
            setMessage("აკრიფეთ 'ხეობა'");
          } else {
            setMessage(DEFAULT_MESSAGE);
          }
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
    if (!isHydrated || gameMode === "practice" || gameMode === "tutorial") {
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
  }, [answer, currentLetters, gameMode, gameStatus, guesses, isHydrated, progressKey, puzzleNumber]);

  useEffect(() => {
    if (!isHydrated || gameStatus === "playing" || gameMode === "practice" || gameMode === "tutorial") {
      return;
    }

    const completionKey = `${puzzleNumber}:${answer}:${gameStatus}:${guesses.length}`;
    if (recordedCompletionKey === completionKey) {
      return;
    }

    setRecordedCompletionKey(completionKey);
    recordWordleCompletion(puzzleNumber, gameStatus === "won", guesses.length, guesses).catch(() => {
      setRecordedCompletionKey(null);
    });
  }, [answer, gameMode, gameStatus, guesses, guesses.length, isHydrated, puzzleNumber, recordedCompletionKey]);

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

    if (gameMode === "tutorial") {
      if (guesses.length === 0 && guess !== "ხეობა") {
        showInvalidGuess("გთხოვთ აკრიფოთ 'ხეობა'");
        return;
      }
      if (guesses.length === 1 && guess !== "ხალხი") {
        showInvalidGuess("გთხოვთ აკრიფოთ 'ხალხი'");
        return;
      }
      if (guesses.length === 2 && guess !== "სახლი") {
        showInvalidGuess("გთხოვთ აკრიფოთ 'სახლი'");
        return;
      }
    } else {
      if (!validWords.has(guess)) {
        showInvalidGuess("სიტყვა სიაში არ არის");
        return;
      }
    }

    const nextGuesses = [...guesses, guess];
    setGuesses(nextGuesses);
    setCurrentLetters([]);

    if (guess === answer) {
      const wonMessage = `მოიგე ${nextGuesses.length}/6`;
      setGameStatus("won");
      setMessage(wonMessage);
      showToast(wonMessage);
      triggerCompletionHaptic(true);
      confettiRef.current?.start();
      setIsResultModalVisible(true);
      return;
    }

    if (nextGuesses.length === MAX_GUESSES) {
      const lostMessage = `სიტყვა იყო ${answer}`;
      setGameStatus("lost");
      setMessage(lostMessage);
      showToast(lostMessage);
      triggerCompletionHaptic(false);
      setIsResultModalVisible(true);
      return;
    }

    if (gameMode === "tutorial") {
      if (nextGuesses.length === 1) {
        setMessage("მწვანე 'ხ' სწორია! ახლა სცადეთ 'ხალხი'");
      } else if (nextGuesses.length === 2) {
        setMessage("ყვითელი 'ლ' სხვაგანაა. სცადეთ 'სახლი'");
      }
    } else {
      setMessage(DEFAULT_MESSAGE);
    }
  }, [answer, currentLetters, gameStatus, guesses, showInvalidGuess, showToast, validWords, gameMode]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === ENTER_KEY) {
        triggerSelectionHaptic();
        submitGuess();
        return;
      }

      if (key === SHIFT_KEY) {
        triggerSelectionHaptic();
        setIsShifted((shifted) => !shifted);
        return;
      }

      if (gameStatus !== "playing") {
        return;
      }

      if (key === BACKSPACE_KEY) {
        triggerSelectionHaptic();
        setCurrentLetters((letters) => letters.slice(0, -1));
        return;
      }

      if (!georgianLetters.has(key)) {
        return;
      }

      triggerSelectionHaptic();
      setCurrentLetters((letters) => {
        if (letters.length >= WORD_LENGTH) {
          return letters;
        }

        return [...letters, key];
      });

      setIsShifted(false);
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
        handleKeyPress(ENTER_KEY);
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        handleKeyPress(BACKSPACE_KEY);
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
    if (Platform.OS === "web") {
      await Share.share({ message: sharePreview });
      return;
    }
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (uri) {
        await Share.share({ url: uri, message: sharePreview });
      } else {
        await Share.share({ message: sharePreview });
      }
    } catch {
      await Share.share({ message: sharePreview });
    }
  }, [sharePreview]);

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <ConfettiCannon
        ref={confettiRef}
        count={180}
        origin={{ x: width / 2, y: -10 }}
        autoStart={false}
        fadeOut
      />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.card} />

      {/* ── Mode-picker modal (shown before game starts) ─────── */}
      <Modal
        animationType="fade"
        transparent
        visible={gameMode === null}
        onRequestClose={() => router.push("/")}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modePickerModal}>
            <Text style={styles.modePickerKicker}>სიტყვობანა</Text>
            <Text style={styles.modePickerTitle}>აირჩიე რეჟიმი</Text>

            {/* Daily */}
            <Pressable
              style={({ pressed }) => [styles.modePickerOption, pressed && styles.pressed]}
              onPress={() => setGameMode("daily")}
            >
              <View style={styles.modePickerIconWrap}>
                <Text style={styles.modePickerIcon}>📅</Text>
              </View>
              <View style={styles.modePickerText}>
                <Text style={styles.modePickerOptionTitle}>დღის სიტყვა</Text>
                <Text style={styles.modePickerOptionSub}>#{puzzleNumber} · ქულები ითვლება</Text>
              </View>
              <Text style={styles.modePickerArrow}>›</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.modePickerOption, styles.modePickerOptionSecondary, pressed && styles.pressed]}
              onPress={() => { startRandomPuzzle(); setGameMode("practice"); }}
            >
              <View style={styles.modePickerIconWrap}>
                <Text style={styles.modePickerIcon}>🔁</Text>
              </View>
              <View style={styles.modePickerText}>
                <Text style={styles.modePickerOptionTitle}>ვარჯიში</Text>
                <Text style={styles.modePickerOptionSub}>შემთხვევითი სიტყვა · ქულების გარეშე</Text>
              </View>
              <Text style={styles.modePickerArrow}>›</Text>
            </Pressable>

            {/* Tutorial */}
            <Pressable
              style={({ pressed }) => [styles.modePickerOption, styles.modePickerOptionSecondary, pressed && styles.pressed]}
              onPress={() => { resetBoard(0); setGameMode("tutorial"); setMessage("აკრიფეთ 'ხეობა'"); }}
            >
              <View style={styles.modePickerIconWrap}>
                <Text style={styles.modePickerIcon}>🎓</Text>
              </View>
              <View style={styles.modePickerText}>
                <Text style={styles.modePickerOptionTitle}>როგორ ვითამაშოთ</Text>
                <Text style={styles.modePickerOptionSub}>ინტერაქტიული გაკვეთილი დამწყებთათვის</Text>
              </View>
              <Text style={styles.modePickerArrow}>›</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.modePickerBack, pressed && styles.pressed]}
              onPress={() => router.push("/")}
            >
              <Text style={styles.modePickerBackText}>← უკან</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          onPress={() => router.push("/")}
        >
          <Text style={styles.headerIcon}>‹</Text>
        </Pressable>
        <Text style={styles.logo}>სიტყვობანა</Text>
        <View style={styles.headerActions}>
          {gameMode === "practice" || gameMode === "tutorial" ? (
            <View style={styles.practiceBadge}>
              <Text style={styles.practiceBadgeText}>{gameMode === "practice" ? "ვარჯიში" : "გაკვეთილი"}</Text>
            </View>
          ) : (
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
                  styles={styles}
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
      </View>

      <View style={styles.footer}>
        {gameStatus !== "playing" && (
          <Pressable
            style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
            onPress={() => setIsResultModalVisible(true)}
          >
            <Text style={styles.shareText}>შედეგი</Text>
          </Pressable>
        )}

        <View style={[styles.keyboard, { gap: keyboardRowGap }]}>
          <View style={[styles.keyboardRow, { gap: keyboardGap }]}>
            {keyboardRows[0].map((key) => {
              const score = letterScores[key];

              return (
                <Pressable
                  key={key}
                  style={({ pressed }) => [
                    styles.key,
                    { height: keyHeight, maxWidth: keyMaxWidth },
                    score && keyScoreStyles[score],
                    pressed && styles.keyPressed
                  ]}
                  onPress={() => handleKeyPress(key)}
                >
                  <Text style={[styles.keyText, score && styles.keyTextScored]}>{key}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.keyboardRow, { gap: keyboardGap }]}>
            <Pressable
              style={({ pressed }) => [
                styles.key,
                styles.actionKey,
                styles.shiftKey,
                { height: keyHeight, maxWidth: actionKeyMaxWidth },
                isShifted && styles.shiftKeyActive,
                pressed && styles.keyPressed
              ]}
              onPress={() => handleKeyPress(SHIFT_KEY)}
            >
              <Text style={[styles.shiftKeyText, isShifted && styles.keyTextScored]}>⇧</Text>
            </Pressable>

            {keyboardRows[1].map((key) => {
              const score = letterScores[key];

              return (
                <Pressable
                  key={key}
                  style={({ pressed }) => [
                    styles.key,
                    { height: keyHeight, maxWidth: keyMaxWidth },
                    score && keyScoreStyles[score],
                    pressed && styles.keyPressed
                  ]}
                  onPress={() => handleKeyPress(key)}
                >
                  <Text style={[styles.keyText, score && styles.keyTextScored]}>{key}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.keyboardRow, { gap: keyboardGap }]}>
            <Pressable
              style={({ pressed }) => [
                styles.key,
                styles.actionKey,
                { height: keyHeight, maxWidth: actionKeyMaxWidth },
                pressed && styles.keyPressed
              ]}
              onPress={() => handleKeyPress(ENTER_KEY)}
            >
              <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={[styles.keyText, styles.actionKeyText]}
              >
                შეყვანა
              </Text>
            </Pressable>

            {keyboardRows[2].map((key) => {
              const isBackspace = key === BACKSPACE_KEY;
              const score = letterScores[key];

              return (
                <Pressable
                  key={key}
                  style={({ pressed }) => [
                    styles.key,
                    {
                      height: keyHeight,
                      maxWidth: isBackspace ? actionKeyMaxWidth : keyMaxWidth
                    },
                    isBackspace && styles.actionKey,
                    score && keyScoreStyles[score],
                    pressed && styles.keyPressed
                  ]}
                  onPress={() => handleKeyPress(key)}
                >
                  <Text
                    style={[
                      styles.keyText,
                      score && styles.keyTextScored,
                      isBackspace && styles.backspaceKeyText
                    ]}
                  >
                    {isBackspace ? "⌫" : key}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={gameStatus !== "playing" && isResultModalVisible}
        onRequestClose={() => setIsResultModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.resultModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.resultKicker}>
                  {gameMode === "practice" ? "ვარჯიში" : `#${puzzleNumber}`}
                </Text>
                <Text style={styles.resultTitle}>
                  {gameStatus === "won" ? "მოიგე" : "სცადე კიდევ"}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="შედეგის დახურვა"
                style={({ pressed }) => [styles.modalCloseButton, pressed && styles.pressed]}
                onPress={() => setIsResultModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </Pressable>
            </View>

            <Text style={styles.resultSubtitle}>
              {gameStatus === "won"
                ? `${guesses.length} ცდაში გამოიცანი`
                : `სიტყვა იყო ${answer}`}
            </Text>

            {/* Only show share preview in daily mode */}
            {gameMode === "daily" && (
              <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }}>
                <View style={styles.previewBox}>
                  {sharePreview.split("\n").map((line, index) => (
                    <Text key={`${line}-${index}`} style={styles.previewText}>
                      {line}
                    </Text>
                  ))}
                </View>
              </ViewShot>
            )}

            <View style={styles.resultActions}>
              {gameMode === "daily" && (
                <Pressable
                  style={({ pressed }) => [styles.resultButton, pressed && styles.pressed]}
                  onPress={shareResult}
                >
                  <Text style={styles.resultButtonText}>გაზიარება</Text>
                </Pressable>
              )}
              <Pressable
                style={({ pressed }) => [
                  styles.resultButton,
                  gameMode === "daily" && styles.secondaryResultButton,
                  pressed && styles.pressed
                ]}
                onPress={startRandomPuzzle}
              >
                <Text style={[styles.resultButtonText, gameMode === "daily" && styles.secondaryResultButtonText]}>
                  ახალი სიტყვა
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.card
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    elevation: 2,
    flexDirection: "row",
    height: 56,
    justifyContent: "space-between",
    paddingHorizontal: 10,
    shadowColor: colors.shadow,
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
    backgroundColor: colors.button,
    borderRadius: 8,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  headerIcon: {
    color: colors.primaryText,
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 36
  },
  logo: {
    color: colors.primaryText,
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
    backgroundColor: colors.primaryText,
    borderRadius: 2,
    width: 4
  },
  metaRow: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 42,
    paddingHorizontal: 14,
    shadowColor: colors.shadow,
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 5
  },
  metaText: {
    color: colors.secondaryText,
    fontSize: 13,
    fontWeight: "800"
  },
  message: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: "800"
  },
  boardArea: {
    flex: 1,
    backgroundColor: colors.background
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
    backgroundColor: colors.tile,
    borderColor: colors.tileBorder,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: "center"
  },
  tileFilled: {
    backgroundColor: colors.tileFilled,
    borderColor: colors.primaryText
  },
  tileText: {
    color: colors.primaryText,
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
    backgroundColor: colors.buttonStrong,
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
    backgroundColor: colors.accent,
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
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 2,
    maxWidth: 460,
    paddingHorizontal: 4,
    paddingVertical: 8,
    shadowColor: colors.shadow,
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
    backgroundColor: colors.key,
    borderRadius: 8,
    elevation: 1,
    flex: 1,
    justifyContent: "center",
    minWidth: 23,
    shadowColor: colors.shadow,
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 2
  },
  actionKey: {
    flex: 1.55
  },
  shiftKey: {
    backgroundColor: colors.button
  },
  shiftKeyActive: {
    backgroundColor: colors.keyActive
  },
  keyText: {
    color: colors.primaryText,
    fontSize: 17,
    fontWeight: "900"
  },
  keyTextScored: {
    color: "#ffffff"
  },
  actionKeyText: {
    fontSize: 11,
    paddingHorizontal: 2
  },
  shiftKeyText: {
    color: colors.primaryText,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 26
  },
  backspaceKeyText: {
    fontSize: 15
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: "center",
    padding: 18
  },
  resultModal: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 420,
    padding: 18,
    width: "100%"
  },
  modePickerModal: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 420,
    padding: 24,
    width: "100%"
  },
  modePickerKicker: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 4,
    textAlign: "center",
    textTransform: "uppercase"
  },
  modePickerTitle: {
    color: colors.primaryText,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 24,
    textAlign: "center"
  },
  modePickerOption: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  modePickerOptionSecondary: {
    backgroundColor: colors.button,
    borderColor: colors.border,
    borderWidth: 1
  },
  modePickerIconWrap: {
    marginRight: 14
  },
  modePickerIcon: {
    fontSize: 28
  },
  modePickerText: {
    flex: 1
  },
  modePickerOptionTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900"
  },
  modePickerOptionSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2
  },
  modePickerArrow: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 24,
    fontWeight: "700"
  },
  modePickerBack: {
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 10
  },
  modePickerBackText: {
    color: colors.secondaryText,
    fontSize: 14,
    fontWeight: "700"
  },
  practiceBadge: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  practiceBadgeText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "900"
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  resultKicker: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "900"
  },
  resultTitle: {
    color: colors.primaryText,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0
  },
  modalCloseButton: {
    alignItems: "center",
    backgroundColor: colors.button,
    borderRadius: 8,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  modalCloseText: {
    color: colors.primaryText,
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 29
  },
  resultSubtitle: {
    color: colors.secondaryText,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 14
  },
  previewBox: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    marginBottom: 16,
    padding: 14
  },
  previewText: {
    color: colors.primaryText,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 24,
    textAlign: "center"
  },
  resultActions: {
    flexDirection: "row",
    gap: 10
  },
  resultButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 12
  },
  resultButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900"
  },
  secondaryResultButton: {
    backgroundColor: colors.button
  },
  secondaryResultButtonText: {
    color: colors.primaryText
  },
  pressed: {
    opacity: 0.64
  },
  keyPressed: {
    opacity: 0.72
  }
  });
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Share,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import proverbs from "../data/content/ანდაზები.json";
import { AppColors, useAppTheme } from "../src/theme";

type Level = "easy" | "medium" | "hard";

type ProverbItem = {
  answer: string;
  fullText: string;
  hint: string;
  hints?: string[];
  id: string;
  level: Level;
  missingWords: string[];
  prompt: string;
};

type ProverbsJson = {
  gameId: string;
  items: ProverbItem[];
  title: string;
  version: number;
};

type ResultState = "idle" | "wrong" | "correct";
type GameMode = "daily" | "practice";
type CompletionMethod = "solved" | "revealed" | "skipped";
type WordStatus = "correct" | "wrong";
type CompletedItem = {
  attempts: number;
  id: string;
  level: Level;
  method: CompletionMethod;
};
type DailyProgress = {
  completedItems?: CompletedItem[];
  completedIds: string[];
  currentIndex: number;
  dateKey: string;
  finishedAt?: string;
};
type AndazebiStats = {
  completedDates: string[];
  currentStreak: number;
  lastCompletedDate: string | null;
  maxStreak: number;
};
type AndazebiStyles = ReturnType<typeof createStyles>;

const proverbData = proverbs as ProverbsJson;
const items = proverbData.items;
const DAILY_LIMIT = 5;
const DEFAULT_FEEDBACK = "შეავსე გამოტოვებული სიტყვები";
const PROGRESS_STORAGE_KEY = "andazebi:daily-progress:v3";
const STATS_STORAGE_KEY = "andazebi:stats:v2";
const USE_NATIVE_ANIMATION_DRIVER = Platform.OS !== "web";
const HARD_RED = "#d94841";
const SKIPPED_GRAY = "#7b8794";
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
const georgianLetters = new Set([
  ...BASE_KEYBOARD_ROWS.flat().filter((key) => key.length === 1),
  ...Object.values(SHIFTED_GEORGIAN_KEYS)
]);

const levelCopy: Record<Level, { label: string; words: string }> = {
  easy: {
    label: "მარტივი",
    words: "1 სიტყვა"
  },
  medium: {
    label: "საშუალო",
    words: "2 სიტყვა"
  },
  hard: {
    label: "რთული",
    words: "3 სიტყვა"
  }
};

const levelEmoji: Record<Level, string> = {
  easy: "🟩",
  medium: "🟨",
  hard: "🟥"
};

function createEmptyStats(): AndazebiStats {
  return {
    completedDates: [],
    currentStreak: 0,
    lastCompletedDate: null,
    maxStreak: 0
  };
}

function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ka-GE");
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPreviousDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);

  return getLocalDateKey(date);
}

function getDailyNumber(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const epoch = new Date(2026, 0, 1);
  const date = new Date(year, month - 1, day);
  const epochDay = new Date(epoch.getFullYear(), epoch.getMonth(), epoch.getDate()).getTime();
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  return Math.max(1, Math.floor((dateDay - epochDay) / (24 * 60 * 60 * 1000)) + 1);
}

function getSeed(value: string) {
  return Array.from(value).reduce((seed, letter) => {
    return (seed * 31 + letter.charCodeAt(0)) >>> 0;
  }, 2166136261);
}

function createSeededRandom(seed: number) {
  let state = seed || 1;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function getDailyItems(dateKey: string) {
  const random = createSeededRandom(getSeed(dateKey));
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const item = shuffledItems[index];
    shuffledItems[index] = shuffledItems[swapIndex];
    shuffledItems[swapIndex] = item;
  }

  return shuffledItems.slice(0, Math.min(DAILY_LIMIT, shuffledItems.length));
}

function getRandomPracticeItem(excludeId?: string) {
  if (items.length <= 1) {
    return items[0] ?? null;
  }

  let nextItem = items[Math.floor(Math.random() * items.length)] ?? items[0];

  if (nextItem?.id === excludeId) {
    nextItem = items[(items.findIndex((item) => item.id === excludeId) + 1) % items.length];
  }

  return nextItem ?? null;
}

function getHintText(item: ProverbItem, hintLevel: number) {
  if (hintLevel <= 0) {
    return "";
  }

  const hints = item.hints?.length ? item.hints : [item.hint];

  if (hintLevel === 1) {
    return hints[0] ?? item.hint;
  }

  return `სიტყვები იწყება: ${item.missingWords
    .map((word) => Array.from(word)[0])
    .join(", ")}`;
}

function getHintButtonText(hintLevel: number) {
  if (hintLevel === 0) {
    return "მინიშნება";
  }

  if (hintLevel === 1) {
    return "მეტი მინიშნება";
  }

  return "მინიშნების დამალვა";
}

function triggerSelectionHaptic() {
  if (Platform.OS === "web") {
    return;
  }

  Haptics.selectionAsync().catch(() => {});
}

function triggerInvalidHaptic() {
  if (Platform.OS === "web") {
    return;
  }

  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}

function triggerSuccessHaptic() {
  if (Platform.OS === "web") {
    return;
  }

  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

function BackIcon({ styles }: { styles: AndazebiStyles }) {
  return <Text style={styles.headerIcon}>‹</Text>;
}

export default function AndazebiScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const shake = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(1)).current;
  const dateKey = useMemo(() => getLocalDateKey(), []);
  const dailyItems = useMemo(() => getDailyItems(dateKey), [dateKey]);
  const [gameMode, setGameMode] = useState<GameMode>("daily");
  const [itemIndex, setItemIndex] = useState(0);
  const [practiceItem, setPracticeItem] = useState<ProverbItem | null>(() =>
    getRandomPracticeItem()
  );
  const currentItem = gameMode === "daily" ? dailyItems[itemIndex] ?? null : practiceItem;
  const [answers, setAnswers] = useState<string[]>(() =>
    Array.from({ length: currentItem?.missingWords.length ?? 0 }, () => "")
  );
  const [completedItems, setCompletedItems] = useState<CompletedItem[]>([]);
  const [stats, setStats] = useState<AndazebiStats>(() => createEmptyStats());
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeInputIndex, setActiveInputIndex] = useState(0);
  const [result, setResult] = useState<ResultState>("idle");
  const [feedback, setFeedback] = useState(DEFAULT_FEEDBACK);
  const [hintLevel, setHintLevel] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [wordStatuses, setWordStatuses] = useState<Array<WordStatus | undefined>>([]);
  const [isShifted, setIsShifted] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([
      AsyncStorage.getItem(PROGRESS_STORAGE_KEY),
      AsyncStorage.getItem(STATS_STORAGE_KEY)
    ])
      .then(([progressValue, statsValue]) => {
        if (!active) {
          return;
        }

        if (statsValue) {
          try {
            setStats({ ...createEmptyStats(), ...(JSON.parse(statsValue) as AndazebiStats) });
          } catch {}
        }

        if (progressValue) {
          try {
            const progress = JSON.parse(progressValue) as DailyProgress;

            if (progress.dateKey === dateKey) {
              const dailyItemIds = new Set(dailyItems.map((item) => item.id));
              const legacyCompletedItems = progress.completedIds
                .filter((id) => dailyItemIds.has(id))
                .map((id) => {
                  const item = dailyItems.find((dailyItem) => dailyItem.id === id);

                  return item
                    ? {
                        attempts: 1,
                        id,
                        level: item.level,
                        method: "solved" as CompletionMethod
                      }
                    : null;
                })
                .filter((item): item is CompletedItem => Boolean(item));
              const nextCompletedItems = (progress.completedItems ?? legacyCompletedItems).filter(
                (item) => dailyItemIds.has(item.id)
              );
              const nextIndex = Math.min(
                Math.max(progress.currentIndex, nextCompletedItems.length),
                dailyItems.length
              );

              setCompletedItems(nextCompletedItems);
              setItemIndex(nextIndex);
            }
          } catch {}
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
  }, [dailyItems, dateKey]);

  const saveDailyProgress = useCallback(
    (nextIndex: number, nextCompletedItems: CompletedItem[]) => {
      if (!isHydrated) {
        return;
      }

      const progress: DailyProgress = {
        completedIds: nextCompletedItems.map((item) => item.id),
        completedItems: nextCompletedItems,
        currentIndex: nextIndex,
        dateKey,
        finishedAt: nextIndex >= dailyItems.length ? new Date().toISOString() : undefined
      };

      AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress)).catch(() => {});
    },
    [dailyItems.length, dateKey, isHydrated]
  );

  const recordDailyCompletion = useCallback(() => {
    if (!isHydrated) {
      return;
    }

    setStats((currentStats) => {
      if (currentStats.completedDates.includes(dateKey)) {
        return currentStats;
      }

      const continuesStreak = currentStats.lastCompletedDate === getPreviousDateKey(dateKey);
      const currentStreak = continuesStreak ? currentStats.currentStreak + 1 : 1;
      const nextStats: AndazebiStats = {
        completedDates: [...currentStats.completedDates, dateKey],
        currentStreak,
        lastCompletedDate: dateKey,
        maxStreak: Math.max(currentStats.maxStreak, currentStreak)
      };

      AsyncStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(nextStats)).catch(() => {});

      return nextStats;
    });
  }, [dateKey, isHydrated]);

  useEffect(() => {
    if (!currentItem) {
      return;
    }

    setAnswers(Array.from({ length: currentItem.missingWords.length }, () => ""));
    setActiveInputIndex(0);
    setResult("idle");
    setFeedback(DEFAULT_FEEDBACK);
    setHintLevel(0);
    setWrongAttempts(0);
    setWordStatuses(Array.from({ length: currentItem.missingWords.length }, () => undefined));
    setIsShifted(false);
    shake.setValue(0);
    successScale.setValue(1);
  }, [currentItem?.id, currentItem?.missingWords.length, shake, successScale]);

  const isPracticeMode = gameMode === "practice";
  const isDailyComplete = gameMode === "daily" && (itemIndex >= dailyItems.length || !currentItem);
  const currentLevel = currentItem ? levelCopy[currentItem.level] : levelCopy.easy;
  const progressText = isPracticeMode
    ? "ვარჯიში"
    : isDailyComplete
      ? `${dailyItems.length}/${dailyItems.length}`
      : `${itemIndex + 1}/${dailyItems.length}`;
  const canGoNext = result === "correct";
  const allFieldsFilled = answers.every((answer) => normalizeAnswer(answer).length > 0);
  const keyboardGap = width < 380 ? 3 : 4;
  const keyboardRowGap = keyboardGap + 2;
  const keyHeight = width < 380 ? 40 : 46;
  const keyMaxWidth = Math.max(25, Math.min(38, (width - 14 - keyboardGap * 9) / 10));
  const actionKeyMaxWidth = Math.min(68, keyMaxWidth * 1.65);
  const shakeTranslateX = shake.interpolate({
    inputRange: [0, 1, 2, 3, 4, 5, 6],
    outputRange: [0, -10, 10, -8, 8, -4, 0]
  });
  const keyboardRows = useMemo(
    () =>
      BASE_KEYBOARD_ROWS.map((row) =>
        row.map((key) => (isShifted ? SHIFTED_GEORGIAN_KEYS[key] ?? key : key))
      ),
    [isShifted]
  );
  const dailyNumber = useMemo(() => getDailyNumber(dateKey), [dateKey]);
  const levelSummary = useMemo(() => {
    return dailyItems.reduce<Record<Level, number>>(
      (summary, item) => {
        summary[item.level] += 1;
        return summary;
      },
      { easy: 0, medium: 0, hard: 0 }
    );
  }, [dailyItems]);
  const completedMethods = useMemo(() => {
    return completedItems.reduce<Record<CompletionMethod, number>>(
      (summary, item) => {
        summary[item.method] += 1;
        return summary;
      },
      { solved: 0, revealed: 0, skipped: 0 }
    );
  }, [completedItems]);
  const sharePreview = useMemo(() => {
    const emojiRow = dailyItems.map((item) => levelEmoji[item.level]).join(" ");

    return [
      `ანდაზები #${dailyNumber} ${Math.min(completedItems.length, dailyItems.length)}/${dailyItems.length}`,
      emojiRow,
      `სერია: ${stats.currentStreak}`
    ].join("\n");
  }, [completedItems.length, dailyItems, dailyNumber, stats.currentStreak]);
  const currentHintText = currentItem ? getHintText(currentItem, hintLevel) : "";
  const canUseHelp = wrongAttempts >= 3 && result !== "correct";

  const shakeWrongAnswer = useCallback(() => {
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

  const pulseCorrectAnswer = useCallback(() => {
    successScale.stopAnimation();
    successScale.setValue(0.98);

    Animated.sequence([
      Animated.timing(successScale, {
        duration: 120,
        easing: Easing.out(Easing.cubic),
        toValue: 1.03,
        useNativeDriver: USE_NATIVE_ANIMATION_DRIVER
      }),
      Animated.timing(successScale, {
        duration: 140,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: USE_NATIVE_ANIMATION_DRIVER
      })
    ]).start();
  }, [successScale]);

  const showWrongAnswer = useCallback(
    (nextFeedback: string) => {
      setWrongAttempts((attempts) => attempts + 1);
      setResult("wrong");
      setFeedback(nextFeedback);
      shakeWrongAnswer();
      triggerInvalidHaptic();
    },
    [shakeWrongAnswer]
  );

  const completeCurrentItem = useCallback(
    (method: CompletionMethod) => {
      if (!currentItem) {
        return;
      }

      if (isPracticeMode) {
        return;
      }

      setCompletedItems((currentCompletedItems) => {
        const existingItem = currentCompletedItems.find((item) => item.id === currentItem.id);
        const nextCompletedItems = existingItem
          ? currentCompletedItems.map((item) =>
              item.id === currentItem.id
                ? { ...item, attempts: Math.max(item.attempts, wrongAttempts), method }
                : item
            )
          : [
              ...currentCompletedItems,
              {
                attempts: wrongAttempts,
                id: currentItem.id,
                level: currentItem.level,
                method
              }
            ];

        saveDailyProgress(itemIndex, nextCompletedItems);

        return nextCompletedItems;
      });
    },
    [currentItem, isPracticeMode, itemIndex, saveDailyProgress, wrongAttempts]
  );

  const submitAnswer = useCallback(() => {
    if (!currentItem || isDailyComplete) {
      return;
    }

    triggerSelectionHaptic();

    if (result === "correct") {
      return;
    }

    if (!allFieldsFilled) {
      setWordStatuses(
        answers.map((answer, index) =>
          normalizeAnswer(answer).length === 0
            ? undefined
            : normalizeAnswer(answer) === normalizeAnswer(currentItem.missingWords[index])
              ? "correct"
              : "wrong"
        )
      );
      showWrongAnswer("შეავსე ყველა გამოტოვებული სიტყვა");
      return;
    }

    const nextWordStatuses = currentItem.missingWords.map((word, index) =>
      normalizeAnswer(answers[index]) === normalizeAnswer(word) ? "correct" : "wrong"
    );
    const isCorrect = currentItem.missingWords.every(
      (word, index) => normalizeAnswer(answers[index]) === normalizeAnswer(word)
    );

    if (!isCorrect) {
      setWordStatuses(nextWordStatuses);
      showWrongAnswer("ჯერ არა, კიდევ სცადე");
      return;
    }

    setWordStatuses(nextWordStatuses);
    setResult("correct");
    setFeedback("სწორია, გადადი შემდეგზე");
    completeCurrentItem("solved");
    pulseCorrectAnswer();
    triggerSuccessHaptic();
  }, [
    allFieldsFilled,
    answers,
    currentItem,
    completeCurrentItem,
    isDailyComplete,
    isPracticeMode,
    pulseCorrectAnswer,
    result,
    showWrongAnswer
  ]);

  const revealAnswer = useCallback(() => {
    if (!currentItem || result === "correct") {
      return;
    }

    triggerSelectionHaptic();
    setAnswers(currentItem.missingWords);
    setWordStatuses(Array.from({ length: currentItem.missingWords.length }, () => "correct"));
    setResult("correct");
    setFeedback("პასუხი ნაჩვენებია");
    setHintLevel(2);
    completeCurrentItem("revealed");
    pulseCorrectAnswer();
  }, [completeCurrentItem, currentItem, pulseCorrectAnswer, result]);

  const goNext = useCallback(() => {
    if (!currentItem) {
      return;
    }

    triggerSelectionHaptic();

    if (isPracticeMode) {
      setPracticeItem(getRandomPracticeItem(currentItem.id));
      return;
    }

    setItemIndex((currentIndex) => {
      const nextIndex = Math.min(currentIndex + 1, dailyItems.length);

      setCompletedItems((currentCompletedItems) => {
        const nextCompletedItems = currentCompletedItems.some((item) => item.id === currentItem.id)
          ? currentCompletedItems
          : [
              ...currentCompletedItems,
              {
                attempts: wrongAttempts,
                id: currentItem.id,
                level: currentItem.level,
                method: "solved" as CompletionMethod
              }
            ];

        saveDailyProgress(nextIndex, nextCompletedItems);

        if (nextIndex >= dailyItems.length) {
          recordDailyCompletion();
        }

        return nextCompletedItems;
      });

      return nextIndex;
    });
  }, [
    currentItem,
    dailyItems.length,
    isPracticeMode,
    recordDailyCompletion,
    saveDailyProgress,
    wrongAttempts
  ]);

  const skipCurrent = useCallback(() => {
    if (!currentItem || result === "correct") {
      return;
    }

    triggerSelectionHaptic();

    if (isPracticeMode) {
      setPracticeItem(getRandomPracticeItem(currentItem.id));
      return;
    }

    setCompletedItems((currentCompletedItems) => {
      const nextCompletedItems = currentCompletedItems.some((item) => item.id === currentItem.id)
        ? currentCompletedItems
        : [
            ...currentCompletedItems,
            {
              attempts: wrongAttempts,
              id: currentItem.id,
              level: currentItem.level,
              method: "skipped" as CompletionMethod
            }
          ];
      const nextIndex = Math.min(itemIndex + 1, dailyItems.length);

      saveDailyProgress(nextIndex, nextCompletedItems);

      if (nextIndex >= dailyItems.length) {
        recordDailyCompletion();
      }

      setItemIndex(nextIndex);

      return nextCompletedItems;
    });
  }, [
    currentItem,
    dailyItems.length,
    isPracticeMode,
    itemIndex,
    recordDailyCompletion,
    result,
    saveDailyProgress,
    wrongAttempts
  ]);

  const resetCurrent = useCallback(() => {
    if (!currentItem || isDailyComplete || result === "correct") {
      return;
    }

    triggerSelectionHaptic();
    setAnswers(Array.from({ length: currentItem.missingWords.length }, () => ""));
    setActiveInputIndex(0);
    setResult("idle");
    setFeedback(DEFAULT_FEEDBACK);
    setHintLevel(0);
    setWordStatuses(Array.from({ length: currentItem.missingWords.length }, () => undefined));
  }, [currentItem, isDailyComplete, result]);

  const shareResult = useCallback(async () => {
    await Share.share({
      message: sharePreview
    });
  }, [sharePreview]);

  const setHintToNextLevel = useCallback(() => {
    triggerSelectionHaptic();
    setHintLevel((currentHintLevel) => (currentHintLevel >= 2 ? 0 : currentHintLevel + 1));
  }, []);

  const switchGameMode = useCallback(
    (nextMode: GameMode) => {
      if (nextMode === gameMode) {
        return;
      }

      triggerSelectionHaptic();
      setGameMode(nextMode);

      if (nextMode === "practice") {
        setPracticeItem(getRandomPracticeItem(currentItem?.id));
      } else {
        setItemIndex((currentIndex) =>
          Math.min(Math.max(currentIndex, completedItems.length), dailyItems.length)
        );
      }
    },
    [completedItems.length, currentItem?.id, dailyItems.length, gameMode]
  );

  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === ENTER_KEY) {
        triggerSelectionHaptic();
        submitAnswer();
        return;
      }

      if (key === SHIFT_KEY) {
        triggerSelectionHaptic();
        setIsShifted((shifted) => !shifted);
        return;
      }

      if (result === "correct" || isDailyComplete) {
        return;
      }

      if (key === BACKSPACE_KEY) {
        triggerSelectionHaptic();
        const targetIndex =
          (answers[activeInputIndex] ?? "").length === 0 && activeInputIndex > 0
            ? activeInputIndex - 1
            : activeInputIndex;

        if ((answers[activeInputIndex] ?? "").length === 0 && activeInputIndex > 0) {
          setActiveInputIndex(activeInputIndex - 1);
        }

        setAnswers((currentAnswers) => {
          const nextAnswers = [...currentAnswers];
          const letters = Array.from(nextAnswers[targetIndex] ?? "");
          nextAnswers[targetIndex] = letters.slice(0, -1).join("");
          return nextAnswers;
        });
        setWordStatuses((currentStatuses) => {
          const nextStatuses = [...currentStatuses];
          nextStatuses[targetIndex] = undefined;
          return nextStatuses;
        });

        setResult("idle");
        setFeedback(DEFAULT_FEEDBACK);
        return;
      }

      if (!georgianLetters.has(key)) {
        return;
      }

      triggerSelectionHaptic();
      setAnswers((currentAnswers) => {
        const nextAnswers = [...currentAnswers];
        nextAnswers[activeInputIndex] = `${nextAnswers[activeInputIndex] ?? ""}${key}`;
        return nextAnswers;
      });
      setWordStatuses((currentStatuses) => {
        const nextStatuses = [...currentStatuses];
        nextStatuses[activeInputIndex] = undefined;
        return nextStatuses;
      });
      setResult("idle");
      setFeedback(DEFAULT_FEEDBACK);
      setIsShifted(false);
    },
    [activeInputIndex, answers, isDailyComplete, result, submitAnswer]
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

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.card} />
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="უკან დაბრუნება"
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          onPress={() => router.push("/")}
        >
          <BackIcon styles={styles} />
        </Pressable>
        <Text style={styles.logo}>ანდაზები</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardArea}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.modeRow}>
            <Pressable
              style={({ pressed }) => [
                styles.modeButton,
                gameMode === "daily" && styles.modeButtonActive,
                pressed && styles.pressed
              ]}
              onPress={() => switchGameMode("daily")}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  gameMode === "daily" && styles.modeButtonTextActive
                ]}
              >
                დღიური
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.modeButton,
                gameMode === "practice" && styles.modeButtonActive,
                pressed && styles.pressed
              ]}
              onPress={() => switchGameMode("practice")}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  gameMode === "practice" && styles.modeButtonTextActive
                ]}
              >
                ვარჯიში
              </Text>
            </Pressable>
          </View>

          {isDailyComplete ? (
            <View style={styles.doneCard}>
              <Text style={styles.doneTitle}>დღეს დასრულებულია</Text>
              <Text style={styles.doneCount}>{progressText}</Text>
              <Text style={styles.doneText}>
                ხვალ დაბრუნდი ახალი შემთხვევითი ხუთეულისთვის.
              </Text>
              <View style={styles.resultStats}>
                <View style={styles.resultStatBox}>
                  <Text style={styles.resultStatNumber}>{stats.currentStreak}</Text>
                  <Text style={styles.resultStatLabel}>დღის სერია</Text>
                </View>
                <View style={styles.resultStatBox}>
                  <Text style={styles.resultStatNumber}>{stats.maxStreak}</Text>
                  <Text style={styles.resultStatLabel}>რეკორდი</Text>
                </View>
              </View>
              <View style={styles.levelSummary}>
                {(["easy", "medium", "hard"] as Level[]).map((level) => (
                  <View key={level} style={[styles.summaryPill, styles[`${level}Level`]]}>
                    <Text style={styles.summaryPillText}>
                      {levelCopy[level].label}: {levelSummary[level]}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={styles.doneText}>
                სწორი: {completedMethods.solved} · ნაჩვენები: {completedMethods.revealed} · გამოტოვებული: {completedMethods.skipped}
              </Text>
              <View style={styles.resultActions}>
                <Pressable
                  style={({ pressed }) => [styles.resultButton, pressed && styles.pressed]}
                  onPress={shareResult}
                >
                  <Text style={styles.resultButtonText}>გაზიარება</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.resultButton,
                    styles.secondaryResultButton,
                    pressed && styles.pressed
                  ]}
                  onPress={() => switchGameMode("practice")}
                >
                  <Text style={[styles.resultButtonText, styles.secondaryResultButtonText]}>
                    ვარჯიში
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : currentItem ? (
            <>
              <View style={styles.metaRow}>
                <Text style={styles.progressText}>{progressText}</Text>
                <View style={[styles.levelPill, styles[`${currentItem.level}Level`]]}>
                  <Text style={styles.levelText}>{currentLevel.label}</Text>
                </View>
                <Text style={styles.wordsText}>{currentLevel.words}</Text>
              </View>

              <Animated.View
                style={[
                  styles.gameCard,
                  { transform: [{ translateX: shakeTranslateX }, { scale: successScale }] }
                ]}
              >
                <Text style={styles.prompt}>{currentItem.prompt}</Text>
                <Text
                  style={[
                    styles.feedback,
                    result === "wrong" && styles.feedbackWrong,
                    result === "correct" && styles.feedbackCorrect
                  ]}
                >
                  {feedback}
                </Text>

                <View style={styles.inputs}>
                  {currentItem.missingWords.map((_, index) => (
                    <Pressable
                      accessibilityLabel={`სიტყვა ${index + 1}`}
                      accessibilityRole="button"
                      key={`${currentItem.id}-${index}`}
                      disabled={result === "correct"}
                      onPress={() => setActiveInputIndex(index)}
                      style={[
                        styles.input,
                        index === activeInputIndex && result !== "correct" && styles.inputActive,
                        wordStatuses[index] === "wrong" && styles.inputWrong,
                        wordStatuses[index] === "correct" && styles.inputCorrect,
                        result === "correct" && styles.inputCorrect,
                        result !== "correct" && index === activeInputIndex && styles.inputPressed
                      ]}
                    >
                      <Text
                        style={[
                          styles.inputText,
                          !answers[index] && styles.inputPlaceholder,
                          wordStatuses[index] === "wrong" && styles.inputTextWrong,
                          wordStatuses[index] === "correct" && styles.inputTextCorrect,
                          result === "correct" && styles.inputTextCorrect
                        ]}
                      >
                        {answers[index] || `სიტყვა ${index + 1}`}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.actions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      result === "correct" && styles.primaryButtonComplete,
                      pressed && styles.pressed
                    ]}
                    onPress={submitAnswer}
                  >
                    <Text style={styles.primaryButtonText}>
                      {result === "correct" ? "სწორია" : "შემოწმება"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                    onPress={resetCurrent}
                  >
                    <Text style={styles.secondaryButtonText}>გასუფთავება</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.hintButton, pressed && styles.pressed]}
                  onPress={setHintToNextLevel}
                >
                  <Text style={styles.hintButtonText}>
                    {getHintButtonText(hintLevel)}
                  </Text>
                </Pressable>

                {hintLevel > 0 && <Text style={styles.hintText}>{currentHintText}</Text>}

                {canUseHelp && (
                  <View style={styles.helpActions}>
                    <Pressable
                      style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}
                      onPress={() => setHintLevel((currentLevelValue) => Math.min(2, currentLevelValue + 1))}
                    >
                      <Text style={styles.helpButtonText}>მინიშნება</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}
                      onPress={revealAnswer}
                    >
                      <Text style={styles.helpButtonText}>პასუხის ნახვა</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.helpButton,
                        styles.skipButton,
                        pressed && styles.pressed
                      ]}
                      onPress={skipCurrent}
                    >
                      <Text style={[styles.helpButtonText, styles.skipButtonText]}>გამოტოვება</Text>
                    </Pressable>
                  </View>
                )}

                {result === "correct" && (
                  <View style={styles.completeBox}>
                    <Text style={styles.fullText}>{currentItem.fullText}</Text>
                    <Pressable
                      disabled={!canGoNext}
                      style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}
                      onPress={goNext}
                    >
                      <Text style={styles.nextButtonText}>
                        {isPracticeMode
                          ? "შემდეგი"
                          : itemIndex + 1 >= dailyItems.length
                            ? "დასრულება"
                            : "შემდეგი"}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </Animated.View>
            </>
          ) : null}
        </ScrollView>

        {!isDailyComplete && currentItem && (
          <View style={styles.footer}>
            <View style={[styles.keyboard, { gap: keyboardRowGap }]}>
              <View style={[styles.keyboardRow, { gap: keyboardGap }]}>
                {keyboardRows[0].map((key) => (
                  <Pressable
                    key={key}
                    style={({ pressed }) => [
                      styles.key,
                      { height: keyHeight, maxWidth: keyMaxWidth },
                      pressed && styles.keyPressed
                    ]}
                    onPress={() => handleKeyPress(key)}
                  >
                    <Text style={styles.keyText}>{key}</Text>
                  </Pressable>
                ))}
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
                  <Text style={[styles.shiftKeyText, isShifted && styles.keyTextActive]}>⇧</Text>
                </Pressable>

                {keyboardRows[1].map((key) => (
                  <Pressable
                    key={key}
                    style={({ pressed }) => [
                      styles.key,
                      { height: keyHeight, maxWidth: keyMaxWidth },
                      pressed && styles.keyPressed
                    ]}
                    onPress={() => handleKeyPress(key)}
                  >
                    <Text style={styles.keyText}>{key}</Text>
                  </Pressable>
                ))}
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
                  <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.keyText, styles.actionKeyText]}>
                    შეყვანა
                  </Text>
                </Pressable>

                {keyboardRows[2].map((key) => {
                  const isBackspace = key === BACKSPACE_KEY;

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
                        pressed && styles.keyPressed
                      ]}
                      onPress={() => handleKeyPress(key)}
                    >
                      <Text style={[styles.keyText, isBackspace && styles.backspaceKeyText]}>
                        {isBackspace ? "⌫" : key}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.card
    },
    keyboardArea: {
      flex: 1,
      backgroundColor: colors.background
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
    headerButton: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderRadius: 8,
      height: 42,
      justifyContent: "center",
      width: 42
    },
    headerSpacer: {
      height: 42,
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
      fontSize: 24,
      fontWeight: "900",
      letterSpacing: 0
    },
    content: {
      flexGrow: 1,
      justifyContent: "center",
      paddingBottom: 16,
      paddingHorizontal: 20,
      paddingTop: 24
    },
    modeRow: {
      alignSelf: "center",
      backgroundColor: colors.button,
      borderRadius: 8,
      flexDirection: "row",
      gap: 4,
      marginBottom: 14,
      maxWidth: 360,
      padding: 4,
      width: "100%"
    },
    modeButton: {
      alignItems: "center",
      borderRadius: 7,
      flex: 1,
      justifyContent: "center",
      minHeight: 38
    },
    modeButtonActive: {
      backgroundColor: colors.card
    },
    modeButtonText: {
      color: colors.secondaryText,
      fontSize: 14,
      fontWeight: "900"
    },
    modeButtonTextActive: {
      color: colors.primaryText
    },
    metaRow: {
      alignItems: "center",
      alignSelf: "center",
      flexDirection: "row",
      gap: 8,
      marginBottom: 14
    },
    progressText: {
      color: colors.secondaryText,
      fontSize: 13,
      fontWeight: "900"
    },
    levelPill: {
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 7
    },
    easyLevel: {
      backgroundColor: colors.correct
    },
    mediumLevel: {
      backgroundColor: colors.present
    },
    hardLevel: {
      backgroundColor: HARD_RED
    },
    levelText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "900"
    },
    wordsText: {
      color: colors.primaryText,
      fontSize: 13,
      fontWeight: "900"
    },
    gameCard: {
      alignSelf: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      elevation: 2,
      maxWidth: 560,
      padding: 18,
      shadowColor: colors.shadow,
      shadowOffset: { height: 3, width: 0 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      width: "100%"
    },
    doneCard: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      elevation: 2,
      maxWidth: 520,
      padding: 22,
      shadowColor: colors.shadow,
      shadowOffset: { height: 3, width: 0 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      width: "100%"
    },
    doneTitle: {
      color: colors.primaryText,
      fontSize: 24,
      fontWeight: "900",
      letterSpacing: 0,
      marginBottom: 10,
      textAlign: "center"
    },
    doneText: {
      color: colors.secondaryText,
      fontSize: 15,
      fontWeight: "800",
      lineHeight: 22,
      textAlign: "center"
    },
    doneCount: {
      color: colors.accent,
      fontSize: 34,
      fontWeight: "900",
      marginTop: 16
    },
    resultStats: {
      flexDirection: "row",
      gap: 24,
      justifyContent: "center",
      marginTop: 18,
      width: "100%"
    },
    resultStatBox: {
      alignItems: "center",
      minWidth: 92
    },
    resultStatNumber: {
      color: colors.primaryText,
      fontSize: 30,
      fontWeight: "900"
    },
    resultStatLabel: {
      color: colors.secondaryText,
      fontSize: 12,
      fontWeight: "800",
      marginTop: 3,
      textAlign: "center"
    },
    levelSummary: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "center",
      marginBottom: 12,
      marginTop: 18
    },
    summaryPill: {
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 7
    },
    summaryPillText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "900"
    },
    resultActions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 16,
      width: "100%"
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
    prompt: {
      color: colors.primaryText,
      fontSize: 25,
      fontWeight: "900",
      letterSpacing: 0,
      lineHeight: 36,
      marginBottom: 12,
      textAlign: "center"
    },
    feedback: {
      color: colors.secondaryText,
      fontSize: 14,
      fontWeight: "800",
      marginBottom: 16,
      textAlign: "center"
    },
    feedbackWrong: {
      color: HARD_RED
    },
    feedbackCorrect: {
      color: colors.correct
    },
    inputs: {
      gap: 10,
      marginBottom: 16
    },
    input: {
      backgroundColor: colors.tile,
      borderColor: colors.tileBorder,
      borderRadius: 8,
      borderWidth: 2,
      justifyContent: "center",
      minHeight: 52,
      paddingHorizontal: 14,
      transform: [{ scale: 1 }]
    },
    inputActive: {
      borderColor: colors.accent
    },
    inputPressed: {
      backgroundColor: colors.tileFilled
    },
    inputWrong: {
      borderColor: HARD_RED
    },
    inputCorrect: {
      borderColor: colors.correct
    },
    inputText: {
      color: colors.primaryText,
      fontSize: 20,
      fontWeight: "900",
      textAlign: "center"
    },
    inputPlaceholder: {
      color: colors.secondaryText
    },
    inputTextCorrect: {
      color: colors.primaryText
    },
    inputTextWrong: {
      color: HARD_RED
    },
    actions: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 10
    },
    primaryButton: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 8,
      flex: 1,
      justifyContent: "center",
      minHeight: 48,
      paddingHorizontal: 12
    },
    primaryButtonComplete: {
      backgroundColor: colors.correct
    },
    primaryButtonText: {
      color: "#ffffff",
      fontSize: 15,
      fontWeight: "900"
    },
    secondaryButton: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderRadius: 8,
      flex: 1,
      justifyContent: "center",
      minHeight: 48,
      paddingHorizontal: 12
    },
    secondaryButtonText: {
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: "900"
    },
    hintButton: {
      alignItems: "center",
      alignSelf: "center",
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      marginTop: 2,
      minHeight: 42,
      paddingHorizontal: 16
    },
    hintButtonText: {
      color: colors.primaryText,
      fontSize: 14,
      fontWeight: "900",
      lineHeight: 40
    },
    hintText: {
      color: colors.secondaryText,
      fontSize: 14,
      fontWeight: "800",
      lineHeight: 20,
      marginTop: 12,
      textAlign: "center"
    },
    helpActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "center",
      marginTop: 12
    },
    helpButton: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderRadius: 8,
      justifyContent: "center",
      minHeight: 40,
      paddingHorizontal: 12
    },
    helpButtonText: {
      color: colors.primaryText,
      fontSize: 13,
      fontWeight: "900"
    },
    skipButton: {
      backgroundColor: SKIPPED_GRAY
    },
    skipButtonText: {
      color: "#ffffff"
    },
    completeBox: {
      borderTopColor: colors.border,
      borderTopWidth: 1,
      marginTop: 16,
      paddingTop: 16
    },
    fullText: {
      color: colors.primaryText,
      fontSize: 17,
      fontWeight: "900",
      lineHeight: 24,
      marginBottom: 14,
      textAlign: "center"
    },
    nextButton: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: colors.buttonStrong,
      borderRadius: 8,
      justifyContent: "center",
      minHeight: 46,
      minWidth: 150,
      paddingHorizontal: 18
    },
    nextButtonText: {
      color: colors.card,
      fontSize: 15,
      fontWeight: "900"
    },
    footer: {
      backgroundColor: colors.background,
      paddingBottom: 10,
      paddingHorizontal: 7,
      paddingTop: 4
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
    keyTextActive: {
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
    pressed: {
      opacity: 0.64
    },
    keyPressed: {
      opacity: 0.72
    }
  });
}

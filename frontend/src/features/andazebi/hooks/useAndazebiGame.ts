import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { Animated, Easing, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  triggerSelectionHaptic,
  triggerInvalidHaptic,
  triggerSuccessHaptic,
} from "@/shared/services/haptics";
import { playBuzz, playChime, playLoss, playPop, playReveal } from "@/shared/services/sound";
import { fetchGameContent } from "@/features/games/api/gamesApi";
import { cacheGameContent, getCachedGameContent } from "@/shared/storage/contentCache";
import {
  BACKSPACE_KEY,
  ENTER_KEY,
  GEORGIAN_LETTERS,
  QWERTY_TO_GEORGIAN,
  SHIFT_KEY,
  SHIFTED_GEORGIAN_KEYS,
  SHIFTED_QWERTY_TO_GEORGIAN,
} from "@/shared/constants/georgianKeyboard";
import {
  AndazebiStats,
  CompletedItem,
  CompletionMethod,
  DailyProgress,
  DEFAULT_FEEDBACK,
  fallbackProverbData,
  GameMode,
  getDailyItems,
  getDailyNumber,
  getHintText,
  getLocalDateKey,
  getPreviousDateKey,
  getRandomPracticeItem,
  Level,
  levelCopy,
  levelEmoji,
  normalizeAnswer,
  PROGRESS_STORAGE_KEY,
  ProverbItem,
  ProverbsJson,
  reportProverbCompletion,
  ResultState,
  STATS_STORAGE_KEY,
  USE_NATIVE_ANIMATION_DRIVER,
  WordStatus,
  createEmptyStats,
} from "@/features/andazebi/model/screenModel";
import { AuthUser } from "@/entities/user/types";


type GameState = {
  activeInputIndex: number;
  answers: string[];
  completedItems: CompletedItem[];
  feedback: string;
  gameMode: GameMode;
  hintLevel: number;
  isHydrated: boolean;
  isOffline: boolean;
  isShifted: boolean;
  itemIndex: number;
  practiceItem: ProverbItem | null;
  proverbData: ProverbsJson;
  result: ResultState;
  stats: AndazebiStats;
  wordStatuses: Array<WordStatus | undefined>;
  wrongAttempts: number;
};


type GameAction =
  | { type: "SET_PROVERB_DATA"; payload: ProverbsJson }
  | { type: "SET_PRACTICE_ITEM"; payload: ProverbItem | null }
  | { type: "SET_GAME_MODE"; payload: GameMode }
  | { type: "SET_OFFLINE"; payload: boolean }
  | { type: "HYDRATE"; payload: { completedItems: CompletedItem[]; itemIndex: number; stats: AndazebiStats } }
  | { type: "RESET_ITEM"; payload: { numWords: number } }
  | { type: "TYPE_LETTER"; payload: { key: string; activeInputIndex: number } }
  | { type: "BACKSPACE"; payload: { activeInputIndex: number } }
  | { type: "MOVE_INPUT"; payload: number }
  | { type: "SET_HINT_LEVEL"; payload: number }
  | { type: "TOGGLE_SHIFT" }
  | { type: "WRONG_ANSWER"; payload: { feedback: string; wordStatuses: Array<WordStatus | undefined> } }
  | { type: "CORRECT_ANSWER"; payload: { wordStatuses: Array<WordStatus | undefined>; answers: string[] } }
  | { type: "REVEAL_ANSWER"; payload: { answers: string[] } }
  | { type: "COMPLETE_ITEM"; payload: CompletedItem }
  | { type: "UPDATE_ITEM_INDEX"; payload: number }
  | { type: "RECORD_COMPLETION"; payload: string }
  | { type: "RESET_RESULT" };


function buildEmptyItemState(numWords: number) {
  return {
    activeInputIndex: 0,
    answers: Array.from({ length: numWords }, () => ""),
    feedback: DEFAULT_FEEDBACK,
    hintLevel: 0,
    isShifted: false,
    result: "idle" as ResultState,
    wordStatuses: Array.from({ length: numWords }, () => undefined as WordStatus | undefined),
    wrongAttempts: 0,
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_PROVERB_DATA":
      return { ...state, proverbData: action.payload };

    case "SET_PRACTICE_ITEM":
      return { ...state, practiceItem: action.payload };

    case "SET_GAME_MODE":
      return { ...state, gameMode: action.payload };

    case "SET_OFFLINE":
      return { ...state, isOffline: action.payload };

    case "HYDRATE":
      return {
        ...state,
        completedItems: action.payload.completedItems,
        isHydrated: true,
        itemIndex: action.payload.itemIndex,
        stats: action.payload.stats,
      };

    case "RESET_ITEM":
      return { ...state, ...buildEmptyItemState(action.payload.numWords) };

    case "TYPE_LETTER": {
      const nextAnswers = [...state.answers];
      nextAnswers[action.payload.activeInputIndex] =
        `${nextAnswers[action.payload.activeInputIndex] ?? ""}${action.payload.key}`;
      const nextStatuses = [...state.wordStatuses];
      nextStatuses[action.payload.activeInputIndex] = undefined;
      return {
        ...state,
        answers: nextAnswers,
        feedback: DEFAULT_FEEDBACK,
        isShifted: false,
        result: "idle",
        wordStatuses: nextStatuses,
      };
    }

    case "BACKSPACE": {
      const { activeInputIndex } = action.payload;
      const isEmpty = (state.answers[activeInputIndex] ?? "").length === 0;
      const targetIndex = isEmpty && activeInputIndex > 0 ? activeInputIndex - 1 : activeInputIndex;
      const nextAnswers = [...state.answers];
      nextAnswers[targetIndex] = Array.from(nextAnswers[targetIndex] ?? "").slice(0, -1).join("");
      const nextStatuses = [...state.wordStatuses];
      nextStatuses[targetIndex] = undefined;
      return {
        ...state,
        activeInputIndex: isEmpty && activeInputIndex > 0 ? activeInputIndex - 1 : activeInputIndex,
        answers: nextAnswers,
        feedback: DEFAULT_FEEDBACK,
        result: "idle",
        wordStatuses: nextStatuses,
      };
    }

    case "MOVE_INPUT":
      return { ...state, activeInputIndex: action.payload };

    case "SET_HINT_LEVEL":
      return { ...state, hintLevel: action.payload };

    case "TOGGLE_SHIFT":
      return { ...state, isShifted: !state.isShifted };

    case "WRONG_ANSWER":
      return {
        ...state,
        feedback: action.payload.feedback,
        result: "wrong",
        wordStatuses: action.payload.wordStatuses,
        wrongAttempts: state.wrongAttempts + 1,
      };

    case "CORRECT_ANSWER":
      return {
        ...state,
        answers: action.payload.answers,
        feedback: "სწორია, გადადი შემდეგზე",
        result: "correct",
        wordStatuses: action.payload.wordStatuses,
      };

    case "REVEAL_ANSWER":
      return {
        ...state,
        answers: action.payload.answers,
        feedback: "პასუხი ნაჩვენებია",
        hintLevel: 2,
        result: "correct",
        wordStatuses: Array.from({ length: action.payload.answers.length }, () => "correct" as WordStatus),
      };

    case "COMPLETE_ITEM": {
      const existing = state.completedItems.some((i) => i.id === action.payload.id);
      if (existing) return state;
      return { ...state, completedItems: [...state.completedItems, action.payload] };
    }

    case "UPDATE_ITEM_INDEX":
      return { ...state, itemIndex: action.payload };

    case "RECORD_COMPLETION": {
      const dateKey = action.payload;
      if (state.stats.completedDates.includes(dateKey)) return state;
      const continuesStreak = state.stats.lastCompletedDate === getPreviousDateKey(dateKey);
      const currentStreak = continuesStreak ? state.stats.currentStreak + 1 : 1;
      const nextStats: AndazebiStats = {
        completedDates: [...state.stats.completedDates, dateKey],
        currentStreak,
        lastCompletedDate: dateKey,
        maxStreak: Math.max(state.stats.maxStreak, currentStreak),
      };
      AsyncStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(nextStats)).catch(() => {});
      return { ...state, stats: nextStats };
    }

    case "RESET_RESULT":
      return { ...state, result: "idle", feedback: DEFAULT_FEEDBACK };

    default:
      return state;
  }
}


const initialState: GameState = {
  activeInputIndex: 0,
  answers: [],
  completedItems: [],
  feedback: DEFAULT_FEEDBACK,
  gameMode: null,
  hintLevel: 0,
  isHydrated: false,
  isOffline: false,
  isShifted: false,
  itemIndex: 0,
  practiceItem: getRandomPracticeItem(fallbackProverbData.items),
  proverbData: fallbackProverbData,
  result: "idle",
  stats: createEmptyStats(),
  wordStatuses: [],
  wrongAttempts: 0,
};


const TUTORIAL_ITEM: ProverbItem = {
  id: "tutorial",
  level: "easy",
  fullText: "რაც მოგივა დავითაო, ყველა შენი თავითაო",
  prompt: "რაც მოგივა დავითაო, ყველა შენი _ _ _ _ _ _ _",
  answer: "თავითაო",
  missingWords: ["თავითაო"],
  hint: "შენი საკუთარი...",
};


export function useAndazebiGame(
  user: AuthUser | null,
  updateUser: (u: AuthUser) => void,
  confettiStart: () => void,
  width: number,
) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const shake = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(1)).current;
  const dateKey = useMemo(() => getLocalDateKey(), []);


  const items = state.proverbData.items;
  const dailyItems = useMemo(() => getDailyItems(items, dateKey), [dateKey, items]);

  const currentItem: ProverbItem | null =
    state.gameMode === "daily"
      ? (dailyItems[state.itemIndex] ?? null)
      : state.gameMode === "tutorial"
        ? TUTORIAL_ITEM
        : state.practiceItem;

  const isDailyDone = useMemo(() => {
    const stat = (user?.gameStats as any)?.["andazebi"];
    return state.stats.completedDates.includes(dateKey) || stat?.lastCompletedKey === dateKey || stat?.lastCompletedDate === dateKey;
  }, [state.stats.completedDates, user?.gameStats, dateKey]);

  const isPracticeMode = state.gameMode === "practice";
  const isDailyComplete =
    state.gameMode === "daily" && (state.itemIndex >= dailyItems.length || !currentItem);
  const currentLevel = currentItem ? levelCopy[currentItem.level] : levelCopy.easy;
  const progressText = isPracticeMode
    ? "ვარჯიში"
    : isDailyComplete
      ? `${dailyItems.length}/${dailyItems.length}`
      : `${state.itemIndex + 1}/${dailyItems.length}`;
  const canGoNext = state.result === "correct";
  const allFieldsFilled = state.answers.every((a) => normalizeAnswer(a).length > 0);

  const keyboardGap = width < 380 ? 3 : 4;
  const keyboardRowGap = keyboardGap + 2;
  const keyHeight = width < 380 ? 40 : 46;
  const keyMaxWidth = Math.max(25, Math.min(38, (width - 14 - keyboardGap * 9) / 10));
  const actionKeyMaxWidth = Math.min(68, keyMaxWidth * 1.65);

  const shakeTranslateX = shake.interpolate({
    inputRange: [0, 1, 2, 3, 4, 5, 6],
    outputRange: [0, -10, 10, -8, 8, -4, 0],
  });

  const BASE_KEYBOARD_ROWS = [
    ["ქ", "წ", "ე", "რ", "ტ", "ყ", "უ", "ი", "ო", "პ"],
    ["ა", "ს", "დ", "ფ", "გ", "ჰ", "ჯ", "კ", "ლ"],
    ["ზ", "ხ", "ც", "ვ", "ბ", "ნ", "მ"],
  ];

  const keyboardRows = useMemo(
    () =>
      BASE_KEYBOARD_ROWS.map((row) =>
        row.map((key) => (state.isShifted ? SHIFTED_GEORGIAN_KEYS[key] ?? key : key))
      ),
    [state.isShifted]
  );

  const dailyNumber = useMemo(() => getDailyNumber(dateKey), [dateKey]);

  const levelSummary = useMemo(
    () =>
      dailyItems.reduce<Record<Level, number>>(
        (acc, item) => { acc[item.level] += 1; return acc; },
        { easy: 0, medium: 0, hard: 0 }
      ),
    [dailyItems]
  );

  const completedMethods = useMemo(
    () =>
      state.completedItems.reduce<Record<CompletionMethod, number>>(
        (acc, item) => { acc[item.method] += 1; return acc; },
        { solved: 0, revealed: 0, skipped: 0 }
      ),
    [state.completedItems]
  );

  const sharePreview = useMemo(() => {
    const emojiRow = dailyItems.map((item) => levelEmoji[item.level]).join(" ");
    return [
      `ანდაზები #${dailyNumber} ${Math.min(state.completedItems.length, dailyItems.length)}/${dailyItems.length}`,
      emojiRow,
      `სერია: ${state.stats.currentStreak}`,
    ].join("\n");
  }, [state.completedItems.length, dailyItems, dailyNumber, state.stats.currentStreak]);

  const currentHintText = currentItem ? getHintText(currentItem, state.hintLevel) : "";
  const canUseHelp = state.wrongAttempts >= 3 && state.result !== "correct";


  useEffect(() => {
    let active = true;
    fetchGameContent<ProverbsJson>("andazebi")
      .then((data) => {
        if (active && data.items?.length) {
          dispatch({ type: "SET_PROVERB_DATA", payload: data });
          cacheGameContent("andazebi", data).catch(() => {});
        }
      })
      .catch(async () => {
        if (!active) return;
        const cached = await getCachedGameContent<ProverbsJson>("andazebi").catch(() => null);
        if (active && cached?.items?.length) {
          dispatch({ type: "SET_PROVERB_DATA", payload: cached });
        }
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      AsyncStorage.getItem(PROGRESS_STORAGE_KEY),
      AsyncStorage.getItem(STATS_STORAGE_KEY),
    ])
      .then(([progressValue, statsValue]) => {
        if (!active) return;
        let hydratedStats = createEmptyStats();
        if (statsValue) {
          try { hydratedStats = { ...hydratedStats, ...(JSON.parse(statsValue) as AndazebiStats) }; } catch {}
        }
        let completedItems: CompletedItem[] = [];
        let itemIndex = 0;
        if (progressValue) {
          try {
            const progress = JSON.parse(progressValue) as DailyProgress;
            if (progress.dateKey === dateKey) {
              const dailyItemIds = new Set(dailyItems.map((i) => i.id));
              const legacy = (progress.completedIds ?? [])
                .filter((id) => dailyItemIds.has(id))
                .map((id) => {
                  const item = dailyItems.find((d) => d.id === id);
                  return item
                    ? { attempts: 1, id, level: item.level, method: "solved" as CompletionMethod }
                    : null;
                })
                .filter((x): x is CompletedItem => Boolean(x));
              completedItems = (progress.completedItems ?? legacy).filter((i) =>
                dailyItemIds.has(i.id)
              );
              itemIndex = Math.min(
                Math.max(progress.currentIndex, completedItems.length),
                dailyItems.length
              );
            }
          } catch {}
        }
        dispatch({ type: "HYDRATE", payload: { completedItems, itemIndex, stats: hydratedStats } });
      })
      .catch(() => {
        if (active)
          dispatch({ type: "HYDRATE", payload: { completedItems: [], itemIndex: 0, stats: createEmptyStats() } });
      });
    return () => { active = false; };
  }, [dailyItems, dateKey]);

  useEffect(() => {
    if (state.isOffline) dispatch({ type: "SET_GAME_MODE", payload: "practice" });
  }, [state.isOffline]);

  useEffect(() => {
    if (!currentItem) return;
    dispatch({ type: "RESET_ITEM", payload: { numWords: currentItem.missingWords.length } });
    shake.setValue(0);
    successScale.setValue(1);
  }, [currentItem?.id]);


  const shakeWrongAnswer = useCallback(() => {
    shake.stopAnimation();
    shake.setValue(0);
    Animated.sequence(
      [1, 2, 3, 4, 5, 6].map((toValue) =>
        Animated.timing(shake, {
          duration: 38,
          toValue,
          useNativeDriver: USE_NATIVE_ANIMATION_DRIVER,
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
        useNativeDriver: USE_NATIVE_ANIMATION_DRIVER,
      }),
      Animated.timing(successScale, {
        duration: 140,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: USE_NATIVE_ANIMATION_DRIVER,
      }),
    ]).start();
  }, [successScale]);


  const saveDailyProgress = useCallback(
    (nextIndex: number, nextCompletedItems: CompletedItem[]) => {
      if (!state.isHydrated) return;
      AsyncStorage.setItem(
        PROGRESS_STORAGE_KEY,
        JSON.stringify({
          completedIds: nextCompletedItems.map((i) => i.id),
          completedItems: nextCompletedItems,
          currentIndex: nextIndex,
          dateKey,
          finishedAt:
            nextIndex >= dailyItems.length ? new Date().toISOString() : undefined,
        })
      ).catch(() => {});
    },
    [dailyItems.length, dateKey, state.isHydrated]
  );


  const submitAnswer = useCallback(() => {
    if (!currentItem || isDailyComplete || state.result === "correct") return;
    triggerSelectionHaptic();

    if (!allFieldsFilled) {
      const partial = state.answers.map((a, i) =>
        normalizeAnswer(a).length === 0
          ? undefined
          : normalizeAnswer(a) === normalizeAnswer(currentItem.missingWords[i])
            ? "correct"
            : "wrong"
      ) as Array<WordStatus | undefined>;
      playBuzz();
      dispatch({
        type: "WRONG_ANSWER",
        payload: { feedback: "შეავსე ყველა გამოტოვებული სიტყვა", wordStatuses: partial },
      });
      shakeWrongAnswer();
      triggerInvalidHaptic();
      return;
    }

    const nextWordStatuses = currentItem.missingWords.map((word, i) =>
      normalizeAnswer(state.answers[i]) === normalizeAnswer(word) ? "correct" : "wrong"
    ) as Array<WordStatus | undefined>;

    const isCorrect = currentItem.missingWords.every(
      (word, i) => normalizeAnswer(state.answers[i]) === normalizeAnswer(word)
    );

    if (!isCorrect) {
      playBuzz();
      dispatch({
        type: "WRONG_ANSWER",
        payload: { feedback: "ჯერ არა, კიდევ სცადე", wordStatuses: nextWordStatuses },
      });
      shakeWrongAnswer();
      triggerInvalidHaptic();
      return;
    }

    dispatch({ type: "CORRECT_ANSWER", payload: { wordStatuses: nextWordStatuses, answers: state.answers } });
    confettiStart();
    pulseCorrectAnswer();
    triggerSuccessHaptic();
    playChime();

    if (!isPracticeMode) {
      const newItem: CompletedItem = {
        attempts: state.wrongAttempts + 1,
        id: currentItem.id,
        level: currentItem.level,
        method: "solved",
      };
      const updatedCompleted = state.completedItems.some((i) => i.id === currentItem.id)
        ? state.completedItems
        : [...state.completedItems, newItem];
      dispatch({ type: "COMPLETE_ITEM", payload: newItem });
      reportProverbCompletion(currentItem, dateKey, state.wrongAttempts + 1, "solved", updateUser);
      saveDailyProgress(state.itemIndex, updatedCompleted);
    }
  }, [
    allFieldsFilled,
    confettiStart,
    currentItem,
    dateKey,
    isDailyComplete,
    isPracticeMode,
    pulseCorrectAnswer,
    saveDailyProgress,
    shakeWrongAnswer,
    state.answers,
    state.completedItems,
    state.itemIndex,
    state.result,
    state.wrongAttempts,
    updateUser,
  ]);

  const revealAnswer = useCallback(() => {
    if (!currentItem || state.result === "correct") return;
    triggerSelectionHaptic();
    dispatch({ type: "REVEAL_ANSWER", payload: { answers: currentItem.missingWords } });
    playReveal();

    if (!isPracticeMode) {
      const newItem: CompletedItem = {
        attempts: state.wrongAttempts,
        id: currentItem.id,
        level: currentItem.level,
        method: "revealed",
      };
      const updatedCompleted = state.completedItems.some((i) => i.id === currentItem.id)
        ? state.completedItems
        : [...state.completedItems, newItem];
      dispatch({ type: "COMPLETE_ITEM", payload: newItem });
      reportProverbCompletion(currentItem, dateKey, state.wrongAttempts, "revealed", updateUser);
      saveDailyProgress(state.itemIndex, updatedCompleted);
    }
    pulseCorrectAnswer();
  }, [
    currentItem,
    dateKey,
    isPracticeMode,
    pulseCorrectAnswer,
    saveDailyProgress,
    state.completedItems,
    state.itemIndex,
    state.result,
    state.wrongAttempts,
    updateUser,
  ]);

  const goNext = useCallback(() => {
    if (!currentItem) return;
    triggerSelectionHaptic();

    if (state.gameMode === "practice") {
      dispatch({ type: "SET_PRACTICE_ITEM", payload: getRandomPracticeItem(items, currentItem.id) });
      return;
    }

    if (state.gameMode === "tutorial") {
      dispatch({ type: "SET_GAME_MODE", payload: null });
      return;
    }

    const nextIndex = Math.min(state.itemIndex + 1, dailyItems.length);
    const alreadyCompleted = state.completedItems.some((i) => i.id === currentItem.id);
    const newItem: CompletedItem = {
      attempts: state.wrongAttempts,
      id: currentItem.id,
      level: currentItem.level,
      method: "solved",
    };
    const updatedCompleted = alreadyCompleted
      ? state.completedItems
      : [...state.completedItems, newItem];

    if (!alreadyCompleted) {
      dispatch({ type: "COMPLETE_ITEM", payload: newItem });
      reportProverbCompletion(currentItem, dateKey, state.wrongAttempts + 1, "solved", updateUser);
    }

    dispatch({ type: "UPDATE_ITEM_INDEX", payload: nextIndex });
    saveDailyProgress(nextIndex, updatedCompleted);

    if (nextIndex >= dailyItems.length) {
      dispatch({ type: "RECORD_COMPLETION", payload: dateKey });
    }
  }, [
    currentItem,
    dailyItems.length,
    dateKey,
    items,
    saveDailyProgress,
    state.completedItems,
    state.gameMode,
    state.itemIndex,
    state.wrongAttempts,
    updateUser,
  ]);

  const skipCurrent = useCallback(() => {
    if (!currentItem || state.result === "correct") return;
    triggerSelectionHaptic();

    if (state.gameMode === "practice") {
      dispatch({ type: "SET_PRACTICE_ITEM", payload: getRandomPracticeItem(items, currentItem.id) });
      return;
    }

    if (state.gameMode === "tutorial") {
      dispatch({ type: "SET_GAME_MODE", payload: null });
      return;
    }

    const alreadyCompleted = state.completedItems.some((i) => i.id === currentItem.id);
    const newItem: CompletedItem = {
      attempts: state.wrongAttempts,
      id: currentItem.id,
      level: currentItem.level,
      method: "skipped",
    };
    const updatedCompleted = alreadyCompleted ? state.completedItems : [...state.completedItems, newItem];
    const nextIndex = Math.min(state.itemIndex + 1, dailyItems.length);

    if (!alreadyCompleted) {
      dispatch({ type: "COMPLETE_ITEM", payload: newItem });
      reportProverbCompletion(currentItem, dateKey, state.wrongAttempts, "skipped", updateUser);
    }

    dispatch({ type: "UPDATE_ITEM_INDEX", payload: nextIndex });
    saveDailyProgress(nextIndex, updatedCompleted);
    playLoss();

    if (nextIndex >= dailyItems.length) {
      dispatch({ type: "RECORD_COMPLETION", payload: dateKey });
    }
  }, [
    currentItem,
    dailyItems.length,
    dateKey,
    items,
    saveDailyProgress,
    state.completedItems,
    state.gameMode,
    state.itemIndex,
    state.result,
    state.wrongAttempts,
    updateUser,
  ]);

  const resetCurrent = useCallback(() => {
    if (!currentItem || isDailyComplete || state.result === "correct") return;
    triggerSelectionHaptic();
    dispatch({ type: "RESET_ITEM", payload: { numWords: currentItem.missingWords.length } });
  }, [currentItem, isDailyComplete, state.result]);

  const setHintToNextLevel = useCallback(() => {
    triggerSelectionHaptic();
    dispatch({ type: "SET_HINT_LEVEL", payload: state.hintLevel >= 2 ? 0 : state.hintLevel + 1 });
  }, [state.hintLevel]);

  const switchGameMode = useCallback(
    (nextMode: GameMode) => {
      if (nextMode === state.gameMode) return;
      triggerSelectionHaptic();
      dispatch({ type: "SET_GAME_MODE", payload: nextMode });
      if (nextMode === "practice") {
        dispatch({
          type: "SET_PRACTICE_ITEM",
          payload: getRandomPracticeItem(items, currentItem?.id),
        });
      } else {
        const correctedIndex = Math.min(
          Math.max(state.itemIndex, state.completedItems.length),
          dailyItems.length
        );
        dispatch({ type: "UPDATE_ITEM_INDEX", payload: correctedIndex });
      }
    },
    [
      currentItem?.id,
      dailyItems.length,
      items,
      state.completedItems.length,
      state.gameMode,
      state.itemIndex,
    ]
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
        dispatch({ type: "TOGGLE_SHIFT" });
        return;
      }
      if (state.result === "correct" || isDailyComplete) return;
      if (key === BACKSPACE_KEY) {
        triggerSelectionHaptic();
        dispatch({ type: "BACKSPACE", payload: { activeInputIndex: state.activeInputIndex } });
        return;
      }
      if (!GEORGIAN_LETTERS.has(key)) return;
      triggerSelectionHaptic();
      playPop();
      dispatch({ type: "TYPE_LETTER", payload: { key, activeInputIndex: state.activeInputIndex } });
    },
    [isDailyComplete, state.activeInputIndex, state.result, submitAnswer]
  );

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") { event.preventDefault(); handleKeyPress(ENTER_KEY); return; }
      if (event.key === "Backspace") { event.preventDefault(); handleKeyPress(BACKSPACE_KEY); return; }
      const typedLetter = Array.from(event.key)[0];
      const qwertyLetter =
        event.key.length === 1
          ? (event.shiftKey ? SHIFTED_QWERTY_TO_GEORGIAN[event.key.toUpperCase()] : undefined) ??
            QWERTY_TO_GEORGIAN[event.key.toLowerCase()]
          : undefined;
      const letter = qwertyLetter ?? typedLetter;
      if (letter && GEORGIAN_LETTERS.has(letter)) {
        event.preventDefault();
        handleKeyPress(letter);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleKeyPress]);


  return {
    activeInputIndex: state.activeInputIndex,
    answers: state.answers,
    completedItems: state.completedItems,
    dateKey,
    feedback: state.feedback,
    gameMode: state.gameMode,
    hintLevel: state.hintLevel,
    isHydrated: state.isHydrated,
    isOffline: state.isOffline,
    isShifted: state.isShifted,
    itemIndex: state.itemIndex,
    result: state.result,
    stats: state.stats,
    wordStatuses: state.wordStatuses,
    wrongAttempts: state.wrongAttempts,
    actionKeyMaxWidth,
    allFieldsFilled,
    canGoNext,
    canUseHelp,
    completedMethods,
    currentHintText,
    currentItem,
    currentLevel,
    dailyItems,
    dailyNumber,
    isDailyComplete,
    isDailyDone,
    isPracticeMode,
    items,
    keyboardGap,
    keyboardRowGap,
    keyboardRows,
    keyHeight,
    keyMaxWidth,
    levelSummary,
    progressText,
    shakeTranslateX,
    sharePreview,
    successScale,
    setActiveInputIndex: (i: number) => dispatch({ type: "MOVE_INPUT", payload: i }),
    setGameMode: (m: GameMode) => dispatch({ type: "SET_GAME_MODE", payload: m }),
    setHintLevel: (l: number) => dispatch({ type: "SET_HINT_LEVEL", payload: l }),
    goNext,
    handleKeyPress,
    resetCurrent,
    revealAnswer,
    setHintToNextLevel,
    skipCurrent,
    submitAnswer,
    switchGameMode,
  };
}

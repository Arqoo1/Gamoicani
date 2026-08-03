import {
  AndazebiStats,
  CompletedItem,
  DEFAULT_FEEDBACK,
  GameMode,
  getRandomPracticeItem,
  getPreviousDateKey,
  ProverbItem,
  ProverbsJson,
  ResultState,
  STATS_STORAGE_KEY,
  WordStatus,
  createEmptyStats,
} from "@/features/andazebi/model/screenModel";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type GameState = {
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

export type GameAction =
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

export function buildEmptyItemState(numWords: number) {
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

export function gameReducer(state: GameState, action: GameAction): GameState {
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
      nextAnswers[targetIndex] = Array.from(nextAnswers[targetIndex] ?? "")
        .slice(0, -1)
        .join("");
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
      const continuesStreak = state.stats.lastCompletedKey === getPreviousDateKey(dateKey);
      const currentStreak = continuesStreak ? state.stats.currentStreak + 1 : 1;
      const nextStats: AndazebiStats = {
        completedDates: [...state.stats.completedDates, dateKey],
        currentStreak,
        lastCompletedKey: dateKey,
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

export const initialState: GameState = {
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
  practiceItem: null,
  proverbData: { gameId: "andazebi", items: [], title: "ანდაზები", version: 1 },
  result: "idle",
  stats: createEmptyStats(),
  wordStatuses: [],
  wrongAttempts: 0,
};

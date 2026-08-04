import { ShopData } from "@/entities/shop/types";

export type ChatMessage = {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  text: string;
  timestamp: number;
  equippedItems?: ShopData["equippedItems"] | null;
};

export type SocketPlayer = {
  displayName?: string;
  equippedItems?: ShopData["equippedItems"] | null;
  id?: string;
  userId?: string;
  username?: string;
};

export type WordlePuzzle = {
  answer?: string;
  validWords?: string[];
  wordLength: number;
};

export type AndazebiPuzzle = {
  acceptedAnswers?: string[];
  answers?: string[];
  hint?: string | null;
  missingWordsCount: number;
  prompt: string;
};

export type MultiplayerPuzzle = WordlePuzzle | AndazebiPuzzle;
export type TileScore = "correct" | "present" | "absent";

export type GuessResultPayload = {
  correct?: boolean;
  guess?: string;
  isCorrect?: boolean;
  playerId: string;
  result?: {
    attempts?: number;
    answer?: string;
    winnerId?: string;
    [key: string]: string | number | boolean | null | undefined | GuessResultPayload["result"] | TileScore[];
  };
  tiles?: TileScore[];
};

export type OpponentGuessPayload = {
  attempt?: number;
  guess?: string;
  isCorrect?: boolean;
  tiles?: TileScore[];
};

export type GameOverPayload = {
  answer?: string;
  attempts?: number;
  isDraw?: boolean;
  result?: "won" | "lost" | "draw";
  roundIndex?: number;
  winnerId?: string;
};

export interface SocketReservedEvents {
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
}

export interface ServerToClientEvents {
  "queue-joined": () => void;
  "room-created": (data: { roomId: string; passcode: string }) => void;
  "room-joined": (data: { roomId: string; players: SocketPlayer[] }) => void;
  "game-start": (data: {
    gameType: string;
    puzzle: MultiplayerPuzzle;
    roomId: string;
    activePlayerId?: string;
  }) => void;
  "error-message": (error: { message: string }) => void;
  "chat-history": (data: { messages: ChatMessage[] }) => void;
  "chat-message": (message: ChatMessage) => void;
  "profile-updated": (data: { playerId: string; equippedItems: ShopData["equippedItems"] | null }) => void;
  "turn-changed": (data: { activePlayerId: string }) => void;
  "guess-result": (data: GuessResultPayload) => void;
  "turn-timeout": () => void;
  "opponent-guess": (data: OpponentGuessPayload) => void;
  "game-over": (data: GameOverPayload) => void;
  "receive-emote": (data: { playerId: string; emote: string }) => void;
  "opponent-profile": (profile: {
    equippedItems: ShopData["equippedItems"] | null;
    displayName?: string;
    username?: string;
  }) => void;
}

export interface ClientToServerEvents {
  "join-public-queue": (data: { gameType: string }) => void;
  "create-private-room": (data: { gameType: string }) => void;
  "join-private-room": (data: { passcode: string }) => void;
  "leave-queue": () => void;
  "request-chat-history": () => void;
  "update-profile": (data: { equippedItems: ShopData["equippedItems"] | null }) => void;
  "profile-update": (data: { equippedItems: ShopData["equippedItems"] | null }) => void;
  forfeit: () => void;
  "send-emote": (data: { emote: string; roomId?: string }) => void;
  "submit-guess": (data: { guess: string; roomId?: string }) => void;
  "chat-send": (data: { text: string }) => void;
}

export type ChatMessage = {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  text: string;
  timestamp: number;
};

export type LobbyTab = "match" | "chat";

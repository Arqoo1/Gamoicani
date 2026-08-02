import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSocket } from "@/application/providers/socket";
import { ChatMessage, LobbyTab } from "@/features/lobby/model/types";

export type { ChatMessage, LobbyTab };

export function useLobbySocket(activeTab: LobbyTab) {
  const router = useRouter();
  const { socket, isConnected } = useSocket();

  const [status, setStatus] = useState<"idle" | "public-queue" | "private-hosting" | "private-joining">("idle");
  const [passcode, setPasscode] = useState("");
  const [inputPasscode, setInputPasscode] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [unread, setUnread] = useState(0);

  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
    if (activeTab === "chat") {
      setUnread(0);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!socket) return;

    function onQueueJoined() {
      setStatus("public-queue");
    }

    function onRoomCreated({ passcode: roomPass }: { roomId: string; passcode: string }) {
      setPasscode(roomPass);
      setStatus("private-hosting");
    }

    function onGameStart({ gameType, puzzle, roomId, activePlayerId }: any) {
      router.push({
        pathname: "/multiplayer",
        params: { roomId, gameType, puzzle: JSON.stringify(puzzle), activePlayerId: activePlayerId ?? "" },
      });
    }

    function onErrorMessage({ message }: { message: string }) {
      Alert.alert("შეცდომა", message);
      setStatus("idle");
    }

    function onChatHistory({ messages: history }: { messages: ChatMessage[] }) {
      if (!history || history.length === 0) return;
      setMessages(history);
    }

    function onChatMessage(msg: ChatMessage) {
      setMessages((prev) => [...prev.slice(-99), msg]);
      if (activeTabRef.current !== "chat") {
        setUnread((n) => n + 1);
      }
    }

    socket.on("queue-joined", onQueueJoined);
    socket.on("room-created", onRoomCreated);
    socket.on("game-start", onGameStart);
    socket.on("error-message", onErrorMessage);
    socket.on("chat-history", onChatHistory);
    socket.on("chat-message", onChatMessage);

    socket.emit("request-chat-history");

    return () => {
      socket.off("queue-joined", onQueueJoined);
      socket.off("room-created", onRoomCreated);
      socket.off("game-start", onGameStart);
      socket.off("error-message", onErrorMessage);
      socket.off("chat-history", onChatHistory);
      socket.off("chat-message", onChatMessage);
    };
  }, [socket, router]);

  const joinPublic = useCallback(
    (gameType: "wordle" | "andazebi" | "mix") => {
      if (!socket || !isConnected) return Alert.alert("შეცდომა", "სერვერთან კავშირი ვერ მოხერხდა");
      socket.emit("join-public-queue", { gameType });
      setStatus("public-queue");
    },
    [socket, isConnected]
  );

  const createPrivate = useCallback(
    (gameType: "wordle" | "andazebi" | "mix") => {
      if (!socket || !isConnected) return Alert.alert("შეცდომა", "სერვერთან კავშირი ვერ მოხერხდა");
      socket.emit("create-private-room", { gameType });
    },
    [socket, isConnected]
  );

  const joinPrivate = useCallback(() => {
    if (!socket || !isConnected) return Alert.alert("შეცდომა", "სერვერთან კავშირი ვერ მოხერხდა");
    if (!inputPasscode || inputPasscode.length !== 4) return Alert.alert("შეცდომა", "შეიყვანეთ 4 ნიშნა კოდი");
    socket.emit("join-private-room", { passcode: inputPasscode });
    setStatus("private-joining");
  }, [socket, isConnected, inputPasscode]);

  const cancelQueue = useCallback(() => {
    if (socket) socket.emit("leave-queue");
    setStatus("idle");
  }, [socket]);

  const sendChatMessage = useCallback(() => {
    if (!chatInput.trim() || !socket) return;
    socket.emit("chat-send", { text: chatInput.trim() });
    setChatInput("");
  }, [chatInput, socket]);

  return {
    cancelQueue,
    chatInput,
    createPrivate,
    inputPasscode,
    isConnected,
    joinPrivate,
    joinPublic,
    messages,
    passcode,
    sendChatMessage,
    setChatInput,
    setInputPasscode,
    status,
    unread,
  };
}

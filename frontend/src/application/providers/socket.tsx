import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";

import { useAuth } from "@/application/providers/auth";
import { ShopData } from "@/entities/shop/types";
import { getApiOrigin, getAuthToken } from "@/shared/api/client";
import { ClientToServerEvents, ServerToClientEvents } from "@/shared/api/socket.types";

export type OpponentProfile = {
  displayName?: string;
  equippedItems: ShopData["equippedItems"] | null;
  username?: string;
};

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type SocketContextType = {
  connect: () => Promise<void>;
  disconnect: () => void;
  emitProfileUpdate: (equippedItems: ShopData["equippedItems"]) => void;
  isConnected: boolean;
  opponentProfile: OpponentProfile | null;
  socket: AppSocket | null;
};

const SocketContext = createContext<SocketContextType>({
  connect: async () => {},
  disconnect: () => {},
  emitProfileUpdate: () => {},
  isConnected: false,
  opponentProfile: null,
  socket: null,
});

function createAppSocket(token: string): AppSocket {
  return io(getApiOrigin(), {
    auth: { token },
    transports: ["websocket"],
  }) as AppSocket;
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [opponentProfile, setOpponentProfile] = useState<OpponentProfile | null>(null);
  const socketRef = useRef<AppSocket | null>(null);
  const connectingRef = useRef(false);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    connectingRef.current = false;
    setSocket(null);
    setIsConnected(false);
  }, []);

  const connect = useCallback(async () => {
    if (status !== "authenticated") return;
    if (socketRef.current?.connected || connectingRef.current) return;

    connectingRef.current = true;
    try {
      const token = await getAuthToken();
      if (!token) return;

      const nextSocket = createAppSocket(token);
      socketRef.current = nextSocket;

      nextSocket.on("connect", () => setIsConnected(true));
      nextSocket.on("disconnect", () => setIsConnected(false));
      nextSocket.on("error-message", (err) => console.error("[Socket Error]", err.message));
      nextSocket.on("opponent-profile", (profile) => setOpponentProfile(profile));

      setSocket(nextSocket);
    } finally {
      connectingRef.current = false;
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") {
      disconnect();
    }
  }, [disconnect, status]);

  useEffect(() => () => disconnect(), [disconnect]);

  const emitProfileUpdate = useCallback((equippedItems: ShopData["equippedItems"]) => {
    socketRef.current?.emit("profile-update", { equippedItems });
  }, []);

  const value = useMemo(
    () => ({ connect, disconnect, emitProfileUpdate, isConnected, opponentProfile, socket }),
    [connect, disconnect, emitProfileUpdate, isConnected, opponentProfile, socket]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}

export function useEnsureSocket() {
  const { status } = useAuth();
  const { connect: connectSocket, isConnected, socket } = useSocket();

  useEffect(() => {
    if (status === "authenticated") {
      connectSocket();
    }
  }, [connectSocket, status]);

  return { isConnected, socket };
}

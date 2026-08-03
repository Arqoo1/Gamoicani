import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [opponentProfile, setOpponentProfile] = useState<OpponentProfile | null>(null);
  const socketRef = useRef<AppSocket | null>(null);
  const connectingRef = useRef(false);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSocket(null);
    setIsConnected(false);
    setOpponentProfile(null);
  }, []);

  const connect = useCallback(async () => {
    if (status !== "authenticated") return;
    if (socketRef.current?.connected || connectingRef.current) return;

    connectingRef.current = true;

    try {
      const token = await getAuthToken();
      if (!token) return;

      const newSocket = io(getApiOrigin(), {
        auth: { token },
        transports: ["websocket"],
      }) as AppSocket;

      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);
      const handleErrorMessage = (err: { message: string }) => {
        console.error("[Socket Error]", err.message);
      };
      const handleOpponentProfile = (profile: OpponentProfile) => {
        setOpponentProfile(profile);
      };

      newSocket.on("connect", handleConnect);
      newSocket.on("disconnect", handleDisconnect);
      newSocket.on("error-message", handleErrorMessage);
      newSocket.on("opponent-profile", handleOpponentProfile);

      socketRef.current = newSocket;
      setSocket(newSocket);

      newSocket.once("disconnect", () => {
        newSocket.off("connect", handleConnect);
        newSocket.off("disconnect", handleDisconnect);
        newSocket.off("error-message", handleErrorMessage);
        newSocket.off("opponent-profile", handleOpponentProfile);
      });
    } finally {
      connectingRef.current = false;
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") {
      disconnect();
    }
  }, [disconnect, status]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const emitProfileUpdate = useCallback(
    (equippedItems: ShopData["equippedItems"]) => {
      socketRef.current?.emit("profile-update", { equippedItems });
    },
    []
  );

  const value = useMemo(
    () => ({
      connect,
      disconnect,
      emitProfileUpdate,
      isConnected,
      opponentProfile,
      socket,
    }),
    [connect, disconnect, emitProfileUpdate, isConnected, opponentProfile, socket]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}

/** Connect socket lazily when entering lobby, shop, or multiplayer screens. */
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

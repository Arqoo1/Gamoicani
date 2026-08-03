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

function createAppSocket(token: string): AppSocket {
  return io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
  }) as AppSocket;
}

function bindSocketEvents(
  socket: AppSocket,
  handlers: {
    onConnected: () => void;
    onDisconnected: () => void;
    onErrorMessage: (err: { message: string }) => void;
    onOpponentProfile: (profile: OpponentProfile) => void;
  }
) {
  const { onConnected, onDisconnected, onErrorMessage, onOpponentProfile } = handlers;

  socket.on("connect", onConnected);
  socket.on("disconnect", onDisconnected);
  socket.on("error-message", onErrorMessage);
  socket.on("opponent-profile", onOpponentProfile);

  return () => {
    socket.off("connect", onConnected);
    socket.off("disconnect", onDisconnected);
    socket.off("error-message", onErrorMessage);
    socket.off("opponent-profile", onOpponentProfile);
  };
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [opponentProfile, setOpponentProfile] = useState<OpponentProfile | null>(null);
  const socketRef = useRef<AppSocket | null>(null);
  const connectingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let activeSocket: AppSocket | null = null;

  const connect = useCallback(async () => {
    if (status !== "authenticated") return;
    if (socketRef.current?.connected || connectingRef.current) return;

    connectingRef.current = true;

    try {
      const token = await getAuthToken();
      if (cancelled || !token) return;

      const nextSocket = createAppSocket(token);
      activeSocket = nextSocket;

      const unbind = bindSocketEvents(nextSocket, {
        onConnected: () => {
          setIsConnected(true);
        },
        onDisconnected: () => {
          setIsConnected(false);
        },
        onErrorMessage: (err) => {
          console.error("[Socket Error]", err.message);
        },
        onOpponentProfile: (profile) => {
          setOpponentProfile(profile);
        },
      });

      if (cancelled) {
        unbind();
        nextSocket.disconnect();
        return;
      }

      setSocket(nextSocket);
    }

    initSocket();

    return () => {
      cancelled = true;
      if (activeSocket) {
        activeSocket.disconnect();
      }
      setIsConnected(false);
      setSocket(null);
    };
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

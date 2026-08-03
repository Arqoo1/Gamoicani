import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ShopData } from "@/entities/shop/types";
import { useAuth } from "@/application/providers/auth";
import { getApiOrigin, getAuthToken } from "@/shared/api/client";
import { ClientToServerEvents, ServerToClientEvents } from "@/shared/api/socket.types";

const SOCKET_URL = getApiOrigin();

export type OpponentProfile = {
  equippedItems: ShopData["equippedItems"] | null;
  displayName?: string;
  username?: string;
};

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type SocketContextType = {
  socket: AppSocket | null;
  isConnected: boolean;
  opponentProfile: OpponentProfile | null;
  emitProfileUpdate: (equippedItems: ShopData["equippedItems"]) => void;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  opponentProfile: null,
  emitProfileUpdate: () => {},
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

  useEffect(() => {
    let cancelled = false;
    let activeSocket: AppSocket | null = null;

    async function initSocket() {
      if (status !== "authenticated") return;

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

  function emitProfileUpdate(equippedItems: ShopData["equippedItems"]) {
    socket?.emit("profile-update", { equippedItems });
  }

  return (
    <SocketContext.Provider value={{ socket, isConnected, opponentProfile, emitProfileUpdate }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

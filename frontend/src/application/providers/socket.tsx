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

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [opponentProfile, setOpponentProfile] = useState<OpponentProfile | null>(null);

  useEffect(() => {
    let newSocket: AppSocket;

    async function initSocket() {
      if (status !== "authenticated") return;

      const token = await getAuthToken();
      if (!token) return;

      newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
      }) as AppSocket;

      newSocket.on("connect", () => {
        setIsConnected(true);
        console.log("[Socket] Connected:", newSocket.id);
      });

      newSocket.on("disconnect", () => {
        setIsConnected(false);
        console.log("[Socket] Disconnected");
      });

      newSocket.on("error-message", (err: { message: string }) => {
        console.error("[Socket Error]", err.message);
      });

      newSocket.on("opponent-profile", (profile: OpponentProfile) => {
        setOpponentProfile(profile);
      });

      setSocket(newSocket);
    }

    initSocket();

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
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

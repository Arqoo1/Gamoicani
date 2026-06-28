import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ShopData } from "@/entities/shop/types";
import { useAuth } from "@/application/providers/auth";
import { API_BASE_URL, getAuthToken } from "@/shared/api/client";

const SOCKET_URL = API_BASE_URL.replace("/api", "");

export type OpponentProfile = {
  equippedItems: ShopData["equippedItems"] | null;
  displayName?: string;
  username?: string;
};

type SocketContextType = {
  socket: Socket | null;
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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [opponentProfile, setOpponentProfile] = useState<OpponentProfile | null>(null);

  useEffect(() => {
    let newSocket: Socket;

    async function initSocket() {
      if (status !== "authenticated") return;

      const token = await getAuthToken();
      if (!token) return;

      newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
      });

      newSocket.on("connect", () => {
        setIsConnected(true);
        console.log("[Socket] Connected:", newSocket.id);
      });

      newSocket.on("disconnect", () => {
        setIsConnected(false);
        console.log("[Socket] Disconnected");
      });

      newSocket.on("error-message", (err) => {
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

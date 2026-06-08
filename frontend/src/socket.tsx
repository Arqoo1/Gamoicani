import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL, getAuthToken } from "./api";
import { useAuth } from "./auth";

const SOCKET_URL = API_BASE_URL.replace("/api", "");

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

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

      setSocket(newSocket);
    }

    initSocket();

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [status]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

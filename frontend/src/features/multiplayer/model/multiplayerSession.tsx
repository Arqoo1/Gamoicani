import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

import { MultiplayerPuzzle } from "@/shared/api/socket.types";

export type MultiplayerSession = {
  activePlayerId: string | null;
  gameType: string;
  puzzle: MultiplayerPuzzle;
  roomId: string;
};

type MultiplayerSessionContextValue = {
  clearSession: () => void;
  session: MultiplayerSession | null;
  setSession: (session: MultiplayerSession) => void;
};

const MultiplayerSessionContext = createContext<MultiplayerSessionContextValue | null>(null);

export function MultiplayerSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<MultiplayerSession | null>(null);

  const setSession = useCallback((next: MultiplayerSession) => {
    setSessionState(next);
  }, []);

  const clearSession = useCallback(() => {
    setSessionState(null);
  }, []);

  const value = useMemo(
    () => ({ clearSession, session, setSession }),
    [clearSession, session, setSession]
  );

  return (
    <MultiplayerSessionContext.Provider value={value}>
      {children}
    </MultiplayerSessionContext.Provider>
  );
}

export function useMultiplayerSession() {
  const value = useContext(MultiplayerSessionContext);
  if (!value) {
    throw new Error("useMultiplayerSession must be used inside MultiplayerSessionProvider");
  }
  return value;
}

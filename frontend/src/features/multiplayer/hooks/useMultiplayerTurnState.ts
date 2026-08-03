import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/application/providers/auth";
import { useTurnTimer } from "@/features/multiplayer/hooks/useTurnTimer";

type Params = {
  initialActivePlayerId: string | null;
};

export function useMultiplayerTurnState({ initialActivePlayerId }: Params) {
  const { user } = useAuth();
  const { startTimer, stopTimer, timeLeft } = useTurnTimer(30);
  const [activePlayerId, setActivePlayerId] = useState<string | null>(initialActivePlayerId);
  const hasStartedTimer = useRef(false);

  useEffect(() => {
    if (user && initialActivePlayerId && initialActivePlayerId === user.id && !hasStartedTimer.current) {
      hasStartedTimer.current = true;
      startTimer();
    }
  }, [initialActivePlayerId, startTimer, user]);

  const isMyTurn = !!activePlayerId && !!user && activePlayerId === user.id;
  const waitingForOpponent = !isMyTurn;

  const syncTurn = (nextActivePlayerId: string | null) => {
    setActivePlayerId(nextActivePlayerId);
    if (user && nextActivePlayerId === user.id) startTimer();
    else stopTimer();
  };

  return {
    activePlayerId,
    isMyTurn,
    setActivePlayerId,
    syncTurn,
    timeLeft,
    waitingForOpponent,
    startTimer,
    stopTimer,
  };
}

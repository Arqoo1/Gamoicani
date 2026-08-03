import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

import { useAuth } from "@/application/providers/auth";
import { flushScoreOutbox, getPendingScoreCount } from "@/shared/storage/scoreOutbox";

export function useScoreOutboxSync() {
  const { status } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const syncingRef = useRef(false);
  const syncRunIdRef = useRef(0);

  const refreshPending = useCallback(async () => {
    const count = await getPendingScoreCount();
    setPendingCount(count);
    return count;
  }, []);

  const syncOutbox = useCallback(async () => {
    if (status !== "authenticated" || syncingRef.current) return;

    syncingRef.current = true;
    const runId = ++syncRunIdRef.current;

    try {
      const result = await flushScoreOutbox();
      if (runId !== syncRunIdRef.current) return;
      await refreshPending();
      if (runId !== syncRunIdRef.current) return;

      if (result.synced > 0) {
        const msg = `${result.synced} offline score synced successfully!`;
        setSyncMessage(msg);
      } else if (result.pending > 0) {
        setSyncMessage("Offline scores are still pending sync. We'll try again soon.");
      }
    } finally {
      if (runId === syncRunIdRef.current) {
        syncingRef.current = false;
      }
    }
  }, [refreshPending, status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    refreshPending().then((count) => {
      if (count > 0) syncOutbox();
    });
  }, [refreshPending, status, syncOutbox]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const sub = AppState.addEventListener("change", (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        syncOutbox();
      }
      appState.current = nextState;
    });

    return () => sub.remove();
  }, [status, syncOutbox]);

  const dismissSyncMessage = useCallback(() => setSyncMessage(null), []);

  return {
    dismissSyncMessage,
    pendingCount,
    syncMessage,
    syncOutbox,
  };
}

import { useMultiplayerGameLogic } from "@/features/multiplayer/hooks/useMultiplayerGameLogic";

export function useMultiplayerPresentation() {
  return useMultiplayerGameLogic();
}

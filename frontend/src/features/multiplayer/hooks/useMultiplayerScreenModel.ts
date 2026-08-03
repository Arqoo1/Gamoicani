import { useMultiplayerLayout } from "@/features/multiplayer/hooks/useMultiplayerLayout";
import { useMultiplayerPresentation } from "@/features/multiplayer/hooks/useMultiplayerPresentation";
import { createMultiplayerStyles } from "@/features/multiplayer/hooks/multiplayerStyles";

export type MultiplayerScreenStyles = import("@/features/multiplayer/hooks/multiplayerStyles").MultiplayerStyles;

export function useMultiplayerScreenModel() {
  const presentation = useMultiplayerPresentation();
  const layout = useMultiplayerLayout(presentation.wordLength);
  const styles = createMultiplayerStyles(presentation.colors, layout.cellSize);

  return {
    ...presentation,
    ...layout,
    styles,
    ANDAZEBI_ATTEMPTS: 5,
  };
}

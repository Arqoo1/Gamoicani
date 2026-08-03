import { useMultiplayerLayout } from "@/features/multiplayer/hooks/useMultiplayerLayout";
import { useMultiplayerPresentation } from "@/features/multiplayer/hooks/useMultiplayerPresentation";
import { createMultiplayerStyles } from "@/features/multiplayer/hooks/multiplayerStyles";
import { useAppTheme } from "@/application/providers/theme";

export type MultiplayerScreenStyles =
  import("@/features/multiplayer/hooks/multiplayerStyles").MultiplayerStyles;

export function useMultiplayerScreenModel() {
  const { colors } = useAppTheme();
  const presentation = useMultiplayerPresentation();
  const layout = useMultiplayerLayout(presentation.wordLength);
  const styles = createMultiplayerStyles(colors, layout.cellSize);

  return {
    ...presentation,
    colors,
    ...layout,
    styles,
    ANDAZEBI_ATTEMPTS: 5,
  };
}

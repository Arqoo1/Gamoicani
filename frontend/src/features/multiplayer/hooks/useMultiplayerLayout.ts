import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

const CELL_GAP = 5;
const KB_KEY_H = 42;
const KB_GAP = 5;
const GRID_ROWS = 6;
const HEADER_H = 48;
const OPP_H = 74;
const MARGINS = 16;
const MAX_CELL_SIZE = 54;
const MIN_CELL_SIZE = 30;

export function useMultiplayerLayout(wordLength: number) {
  const { width, height } = useWindowDimensions();

  const cellSize = useMemo(() => {
    const safeTop = 0;
    const keyboardHeight = 3 * KB_KEY_H + 2 * KB_GAP + 10;
    const availableHeight = height - safeTop - HEADER_H - OPP_H - keyboardHeight - MARGINS;
    const cellFromHeight = Math.floor((availableHeight - (GRID_ROWS - 1) * CELL_GAP) / GRID_ROWS);
    const cellFromWidth = Math.floor((width - 32 - (wordLength - 1) * CELL_GAP) / wordLength);
    return Math.min(MAX_CELL_SIZE, Math.max(MIN_CELL_SIZE, Math.min(cellFromHeight, cellFromWidth)));
  }, [height, width, wordLength]);

  return { cellSize };
}

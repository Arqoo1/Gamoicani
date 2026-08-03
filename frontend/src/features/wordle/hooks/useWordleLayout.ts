import { useMemo } from "react";

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

export function useWordleLayout(width: number, height: number) {
  return useMemo(() => {
    const safeHeight = Math.max(0, height);
    const tileGap = width < 380 ? 4 : 6;
    const boardWidthPercent = width >= 768 ? 0.72 : 0.92;
    const boardMaxWidth = width >= 1024 ? 680 : width >= 768 ? 600 : 390;
    const availableBoardWidth = Math.min(width * boardWidthPercent, boardMaxWidth);
    const maxTileFromWidth = (availableBoardWidth - tileGap * (WORD_LENGTH - 1)) / WORD_LENGTH;
    const maxTileFromHeight = ((safeHeight * (width >= 768 ? 0.58 : 0.42)) - tileGap * (MAX_GUESSES - 1)) / MAX_GUESSES;
    const tileSize = Math.max(34, Math.min(maxTileFromWidth, maxTileFromHeight, width >= 1024 ? 104 : width >= 768 ? 92 : 60));
    const tileFontSize = Math.max(20, Math.min(width >= 768 ? 42 : 30, tileSize * 0.5));
    const boardWidth = WORD_LENGTH * tileSize + (WORD_LENGTH - 1) * tileGap;

    return {
      boardWidth,
      maxGuesses: MAX_GUESSES,
      tileFontSize,
      tileGap,
      tileSize,
      wordLength: WORD_LENGTH,
    };
  }, [height, width]);
}

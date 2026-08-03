import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppColors } from "@/application/providers/theme";
import { TileScore } from "@/shared/api/socket.types";
import { createStyles } from "@/features/multiplayer/components/WordleBoard.styles";

interface WordleBoardProps {
  guesses: string[];
  currentGuess: string;
  guessResults: TileScore[][];
  wordLength: number;
  gameOver: boolean;
  cellSize: number;
  colors: AppColors;
}

const GRID_ROWS = 6;

export function WordleBoard({
  guesses,
  currentGuess,
  guessResults,
  wordLength,
  gameOver,
  cellSize,
  colors,
}: WordleBoardProps) {
  const styles = createStyles(colors, cellSize);

  return (
    <View style={styles.myGrid}>
      {Array.from({ length: GRID_ROWS }).map((_, rIdx) => {
        const isCurrent = rIdx === guesses.length && !gameOver;
        const word = isCurrent ? currentGuess : (guesses[rIdx] ?? "");
        const result = guessResults[rIdx];
        const letters = Array.from(word);

        return (
          <View key={rIdx} style={styles.gridRow}>
            {Array.from({ length: wordLength }).map((_, cIdx) => {
              const letter = letters[cIdx] ?? "";
              const status = result?.[cIdx];
              const bg =
                status === "correct"
                  ? colors.correct
                  : status === "present"
                    ? colors.present
                    : status === "absent"
                      ? colors.absent
                      : colors.card;
              const border = result ? bg : letter ? colors.secondaryText : colors.border;

              return (
                <View key={cIdx} style={[styles.gridCell, { backgroundColor: bg, borderColor: border }]}>
                  <Text style={[styles.cellLetter, !!result && styles.cellLetterWhite]}>{letter}</Text>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

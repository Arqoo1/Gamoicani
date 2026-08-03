import React, { memo } from "react";
import { Animated, View } from "react-native";
import { LetterScore, scoreGuess, splitWord } from "@/features/wordle/model/wordle";
import { WordleTile } from "@/features/wordle/ui/WordleBoardPieces";
import { createStyles } from "@/features/wordle/screens/WordleScreen.styles";

type WordleStyles = ReturnType<typeof createStyles>;

type WordleGridProps = {
  answer: string;
  currentLetters: string[];
  guesses: string[];
  maxGuesses?: number;
  wordLength?: number;
  shakeAnim: Animated.Value | Animated.AnimatedInterpolation<string | number>;
  styles: WordleStyles;
  tileSize: number;
  tileFontSize: number;
  tileGap: number;
  boardWidth: number;
};


type GridRowProps = {
  rowIndex: number;
  rowLetters: string[];
  scores: LetterScore[] | undefined;
  wordLength: number;
  styles: WordleStyles;
  tileSize: number;
  tileFontSize: number;
  tileGap: number;
};

const GridRow = memo(function GridRow({
  rowIndex,
  rowLetters,
  scores,
  wordLength,
  styles,
  tileSize,
  tileFontSize,
  tileGap,
}: GridRowProps) {
  const rowTiles = Array.from({ length: wordLength });
  return (
    <View key={rowIndex} style={[styles.boardRow, { gap: tileGap }]}>
      {rowTiles.map((_, colIndex) => (
        <WordleTile
          key={colIndex}
          delayIndex={colIndex}
          fontSize={tileFontSize}
          letter={rowLetters[colIndex] ?? ""}
          score={scores?.[colIndex]}
          size={tileSize}
          styles={styles}
        />
      ))}
    </View>
  );
});


export const WordleGrid = memo(function WordleGrid({
  answer,
  currentLetters,
  guesses,
  maxGuesses = 6,
  wordLength = 5,
  shakeAnim,
  styles,
  tileSize,
  tileFontSize,
  tileGap,
  boardWidth,
}: WordleGridProps) {
  const rows = Array.from({ length: maxGuesses });

  return (
    <View style={[styles.board, { gap: tileGap, width: boardWidth }]}>
      {rows.map((_, rowIndex) => {
        const isCurrentRow = rowIndex === guesses.length;
        const submittedGuess = guesses[rowIndex];
        const rowLetters = submittedGuess
          ? splitWord(submittedGuess)
          : isCurrentRow
          ? currentLetters
          : [];
        const scores = submittedGuess ? scoreGuess(submittedGuess, answer) : undefined;

        const rowNode = (
          <GridRow
            key={rowIndex}
            rowIndex={rowIndex}
            rowLetters={rowLetters}
            scores={scores}
            wordLength={wordLength}
            styles={styles}
            tileSize={tileSize}
            tileFontSize={tileFontSize}
            tileGap={tileGap}
          />
        );

        if (isCurrentRow) {
          return (
            <Animated.View
              key={rowIndex}
              style={{ transform: [{ translateX: shakeAnim }] }}
            >
              {rowNode}
            </Animated.View>
          );
        }

        return rowNode;
      })}
    </View>
  );
});

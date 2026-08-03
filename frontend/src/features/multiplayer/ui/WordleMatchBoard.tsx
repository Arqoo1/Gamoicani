import { Text, View } from "react-native";

import type { MultiplayerScreenStyles } from "@/features/multiplayer/hooks/useMultiplayerScreenModel";
import type { GuessResultEntry } from "@/features/multiplayer/hooks/useMultiplayerGameLogic";

type Props = {
  colors: {
    absent: string;
    card: string;
    correct: string;
    present: string;
    primaryText: string;
    secondaryText: string;
  };
  currentGuess: string;
  gameOver: boolean;
  guessResults: GuessResultEntry[];
  guesses: string[];
  styles: MultiplayerScreenStyles;
  wordLength: number;
};

export function WordleMatchBoard({ colors, currentGuess, gameOver, guessResults, guesses, styles, wordLength }: Props) {
  return (
    <View style={styles.myGrid}>
      {Array.from({ length: 6 }).map((_, rIdx) => {
        const isCurrent = rIdx === guesses.length && !gameOver;
        const word = isCurrent ? currentGuess : guesses[rIdx] ?? "";
        const result = guessResults[rIdx];
        const letters = Array.from(word);

        return (
          <View key={rIdx} style={styles.gridRow}>
            {Array.from({ length: wordLength }).map((__, cIdx) => {
              const letter = letters[cIdx] ?? "";
              const status = result?.[cIdx];
              const bg = status === "correct" ? colors.correct : status === "present" ? colors.present : status === "absent" ? colors.absent : colors.card;
              const border = result ? bg : letter ? colors.secondaryText : colors.absent;
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

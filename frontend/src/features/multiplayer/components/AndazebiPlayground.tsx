import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppColors } from "@/application/providers/theme";
import { createStyles } from "@/features/multiplayer/components/AndazebiPlayground.styles";

export type AndazebiPromptSource = {
  hint?: string | null;
  prompt?: string | null;
};

interface AndazebiPlaygroundProps {
  puzzle: AndazebiPromptSource | null;
  guesses: string[];
  guessResults: Array<"correct" | "wrong">;
  gameOver: boolean;
  andazebiAnswers: string[];
  activeInputIndex: number;
  setActiveInputIndex: (idx: number) => void;
  onSubmitGuess: () => void;
  colors: AppColors;
}

export function AndazebiPlayground({
  puzzle,
  guesses,
  guessResults,
  gameOver,
  andazebiAnswers,
  activeInputIndex,
  setActiveInputIndex,
  onSubmitGuess,
  colors,
}: AndazebiPlaygroundProps) {
  const styles = createStyles(colors);

  return (
    <View style={styles.myGrid}>
      <View style={styles.andazebiContainer}>
        <View style={styles.promptCard}>
          <Text style={styles.promptText}>{puzzle?.prompt}</Text>
          {puzzle?.hint && <Text style={styles.hintText}>მინიშნება: {puzzle.hint}</Text>}
        </View>

        <View style={styles.historyContainer}>
          {guesses.map((g, i) => (
            <View
              key={i}
              style={[
                styles.historyBadge,
                guessResults[i] === "correct" ? styles.historyCorrect : styles.historyWrong,
              ]}
            >
              <Text style={[styles.historyText, guessResults[i] === "correct" && styles.cellLetterWhite]}>
                {g} {guessResults[i] === "correct" ? "✓" : "✗"}
              </Text>
            </View>
          ))}
        </View>

        {!gameOver && (
          <>
            <View style={styles.andazebiInputContainer}>
              {andazebiAnswers.map((answer, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.andazebiInputBox,
                    activeInputIndex === index && styles.andazebiInputBoxActive,
                  ]}
                  onPress={() => setActiveInputIndex(index)}
                >
                  <Text
                    style={[
                      styles.andazebiInputBoxText,
                      activeInputIndex === index && styles.andazebiInputBoxTextActive,
                    ]}
                  >
                    {answer || "_"}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              onPress={onSubmitGuess}
            >
              <Text style={styles.primaryBtnText}>შემოწმება</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

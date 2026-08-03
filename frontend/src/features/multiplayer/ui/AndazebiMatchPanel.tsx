import { Pressable, Text, View } from "react-native";

import type { MultiplayerScreenStyles } from "@/features/multiplayer/hooks/useMultiplayerScreenModel";

type Props = {
  activeInputIndex: number;
  andazebiAnswers: string[];
  colors: {
    accent: string;
    border: string;
    background: string;
    card: string;
    primaryText: string;
    secondaryText: string;
  };
  gameOver: boolean;
  hint?: string | null;
  history: { guess: string; isCorrect: boolean }[];
  onPressInput: (index: number) => void;
  onSubmit: () => void;
  prompt?: string;
  styles: MultiplayerScreenStyles;
};

export function AndazebiMatchPanel({
  activeInputIndex,
  andazebiAnswers,
  colors,
  gameOver,
  hint,
  history,
  onPressInput,
  onSubmit,
  prompt,
  styles,
}: Props) {
  return (
    <View style={styles.andazebiContainer}>
      <View style={styles.promptCard}>
        <Text style={styles.promptText}>{prompt}</Text>
        {hint ? <Text style={styles.hintText}>მინიშნება: {hint}</Text> : null}
      </View>
      <View style={styles.historyContainer}>
        {history.map((entry, i) => (
          <View key={i} style={[styles.historyBadge, entry.isCorrect ? styles.historyCorrect : styles.historyWrong]}>
            <Text style={[styles.historyText, entry.isCorrect && styles.cellLetterWhite]}>
              {entry.guess} {entry.isCorrect ? "✓" : "✗"}
            </Text>
          </View>
        ))}
      </View>
      {!gameOver ? (
        <>
          <View style={styles.andazebiInputContainer}>
            {andazebiAnswers.map((answer, index) => (
              <Pressable
                key={index}
                onPress={() => onPressInput(index)}
                style={[styles.andazebiInputBox, activeInputIndex === index && styles.andazebiInputBoxActive, { backgroundColor: colors.background }]}
              >
                <Text style={[styles.andazebiInputBoxText, activeInputIndex === index && styles.andazebiInputBoxTextActive]}>{answer || "_"}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={onSubmit} style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
            <Text style={styles.primaryBtnText}>შეამოწმე</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

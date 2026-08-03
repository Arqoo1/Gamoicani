import { Animated, Text, View } from "react-native";

import type { MultiplayerScreenStyles } from "@/features/multiplayer/hooks/useMultiplayerScreenModel";
import type { GuessResultEntry } from "@/features/multiplayer/hooks/useMultiplayerGameLogic";

type Props = {
  avatarIcon: string;
  colors: {
    button: string;
    correct: string;
    present: string;
    absent: string;
    secondaryText: string;
  };
  gameType: "wordle" | "andazebi" | string;
  myEmote: string | null;
  myOp: Animated.Value;
  myY: Animated.Value;
  oppEmote: string | null;
  oppOp: Animated.Value;
  oppY: Animated.Value;
  opponentName: string;
  opponentProgress: GuessResultEntry[];
  styles: MultiplayerScreenStyles;
  wordLength: number;
  andazebiAttempts: number;
};

export function OpponentStrip({
  avatarIcon,
  colors,
  gameType,
  myEmote,
  myOp,
  myY,
  oppEmote,
  oppOp,
  oppY,
  opponentName,
  opponentProgress,
  styles,
  wordLength,
  andazebiAttempts,
}: Props) {
  return (
    <View style={styles.oppStrip}>
      <View style={styles.oppInfo}>
        <View style={[styles.oppAvatar, { backgroundColor: colors.button }]}>
          <Text style={styles.oppAvatarIcon}>{avatarIcon}</Text>
        </View>
        <Text numberOfLines={1} style={styles.oppName}>
          {opponentName}
        </Text>
      </View>
      <View style={styles.miniGrid}>
        {gameType === "wordle" ? (
          Array.from({ length: 6 }).map((_, rIdx) => {
            const row = opponentProgress[rIdx];
            return (
              <View key={rIdx} style={styles.miniRow}>
                {Array.from({ length: wordLength }).map((__, cIdx) => {
                  const s = row?.[cIdx];
                  const bg = s === "correct" ? colors.correct : s === "present" ? colors.present : s === "absent" ? colors.absent : colors.button;
                  return <View key={cIdx} style={[styles.miniCell, { backgroundColor: bg }]} />;
                })}
              </View>
            );
          })
        ) : (
          <View style={styles.miniRow}>
            {Array.from({ length: andazebiAttempts }).map((_, rIdx) => {
              const s = opponentProgress[rIdx];
              const bg = s === "correct" ? colors.correct : s === "wrong" ? colors.absent : colors.button;
              return <View key={rIdx} style={[styles.miniCircle, { backgroundColor: bg }]} />;
            })}
          </View>
        )}
      </View>
      <View style={styles.vsContainer}>
        <Text style={styles.vsLabel}>VS</Text>
      </View>
      {oppEmote && <Animated.Text style={[styles.floatEmote, styles.floatLeft, { opacity: oppOp, transform: [{ translateY: oppY }] }]}>{oppEmote}</Animated.Text>}
      {myEmote && <Animated.Text style={[styles.floatEmote, styles.floatRight, { opacity: myOp, transform: [{ translateY: myY }] }]}>{myEmote}</Animated.Text>}
    </View>
  );
}

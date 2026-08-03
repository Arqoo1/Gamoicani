import React from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { AppColors } from "@/application/providers/theme";
import { SocketPlayer, TileScore } from "@/shared/api/socket.types";
import { createStyles } from "@/features/multiplayer/components/OpponentProgressStrip.styles";

interface OpponentProgressStripProps {
  opponentProfile: SocketPlayer | null;
  opponentProgress: Array<TileScore[] | "correct" | "wrong">;
  gameType: string;
  wordLength: number;
  oppEmote: string | null;
  oppY: Animated.Value;
  oppOp: Animated.Value;
  myEmote: string | null;
  myY: Animated.Value;
  myOp: Animated.Value;
  colors: AppColors;
}

const GRID_ROWS = 6;
const ANDAZEBI_ATTEMPTS = 5;

export function OpponentProgressStrip({
  opponentProfile,
  opponentProgress,
  gameType,
  wordLength,
  oppEmote,
  oppY,
  oppOp,
  myEmote,
  myY,
  myOp,
  colors,
}: OpponentProgressStripProps) {
  const styles = createStyles(colors);

  const avatarIcon =
    opponentProfile?.equippedItems?.avatar === "avatar_ninja"
      ? "🥷"
      : opponentProfile?.equippedItems?.avatar === "avatar_wizard"
        ? "🧙‍♂️"
        : opponentProfile?.equippedItems?.avatar === "avatar_cat"
          ? "🐱"
          : "👤";

  return (
    <View style={styles.oppStrip}>
      <View style={styles.oppInfo}>
        <View style={[styles.oppAvatar, { backgroundColor: colors.button }]}>
          <Text style={styles.oppAvatarIcon}>{avatarIcon}</Text>
        </View>
        <Text style={styles.oppName} numberOfLines={1}>
          {opponentProfile?.displayName ?? "მოწინ."}
        </Text>
      </View>

      <View style={styles.miniGrid}>
        {gameType === "wordle" ? (
          Array.from({ length: GRID_ROWS }).map((_, rIdx) => {
            const row = opponentProgress[rIdx];
            return (
              <View key={rIdx} style={styles.miniRow}>
                {Array.from({ length: wordLength }).map((_, cIdx) => {
                  const s = Array.isArray(row) ? row[cIdx] : undefined;
                  const bg =
                    s === "correct"
                      ? colors.correct
                      : s === "present"
                        ? colors.present
                        : s === "absent"
                          ? colors.absent
                          : colors.button;
                  return <View key={cIdx} style={[styles.miniCell, { backgroundColor: bg }]} />;
                })}
              </View>
            );
          })
        ) : (
          <View style={styles.miniRow}>
            {Array.from({ length: ANDAZEBI_ATTEMPTS }).map((_, rIdx) => {
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

      {oppEmote && (
        <Animated.Text
          style={[styles.floatEmote, styles.floatLeft, { opacity: oppOp, transform: [{ translateY: oppY }] }]}
        >
          {oppEmote}
        </Animated.Text>
      )}
      {myEmote && (
        <Animated.Text
          style={[styles.floatEmote, styles.floatRight, { opacity: myOp, transform: [{ translateY: myY }] }]}
        >
          {myEmote}
        </Animated.Text>
      )}
    </View>
  );
}

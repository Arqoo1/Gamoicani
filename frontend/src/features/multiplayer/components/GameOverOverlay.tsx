import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppColors } from "@/application/providers/theme";
import { GameOverPayload } from "@/shared/api/socket.types";
import { createStyles } from "@/features/multiplayer/components/GameOverOverlay.styles";

interface GameOverOverlayProps {
  gameOver: boolean;
  results: GameOverPayload | null;
  onLobbyPress: () => void;
  onHomePress: () => void;
  colors: AppColors;
}

export function GameOverOverlay({
  gameOver,
  results,
  onLobbyPress,
  onHomePress,
  colors,
}: GameOverOverlayProps) {
  const styles = createStyles(colors);

  if (!gameOver || !results) return null;

  const didWin = results.result === "won";
  const didDraw = results.result === "draw";

  return (
    <View style={styles.overlay}>
      <View style={styles.resultCard}>
        <Text style={styles.resultEmoji}>{didWin ? "🏆" : didDraw ? "🤝" : "😢"}</Text>
        <Text style={styles.resultTitle}>{didWin ? "მოიგე!" : didDraw ? "ფრე!" : "წააგე"}</Text>
        {typeof results.answer === "string" && (
          <Text style={styles.resultAnswer}>სწორია: {results.answer}</Text>
        )}
        <View style={styles.resultActions}>
          <Pressable style={styles.primaryBtn} onPress={onLobbyPress}>
            <Text style={styles.primaryBtnText}>კვლავ თამაში</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={onHomePress}>
            <Text style={styles.secondaryBtnText}>მთავარი</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

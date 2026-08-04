import { Pressable, Text, View } from "react-native";

import type { MultiplayerScreenStyles } from "@/features/multiplayer/hooks/useMultiplayerScreenModel";

type Props = {
  answer?: string | null;
  didDraw: boolean;
  didWin: boolean;
  gameOver: boolean;
  onPrimary: () => void;
  onSecondary: () => void;
  styles: MultiplayerScreenStyles;
};

export function GameOverOverlay({ answer, didDraw, didWin, gameOver, onPrimary, onSecondary, styles }: Props) {
  if (!gameOver) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.resultCard}>
        <Text style={styles.resultEmoji}>{didWin ? "🏆" : didDraw ? "🤝" : "😢"}</Text>
        <Text style={styles.resultTitle}>{didWin ? "მოიგე!" : didDraw ? "ფრე!" : "წააგე"}</Text>
        {answer ? <Text style={styles.resultAnswer}>სწორი: {answer}</Text> : null}
        <View style={styles.resultActions}>
          <Pressable onPress={onPrimary} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>კვლავ თამაში</Text>
          </Pressable>
          <Pressable onPress={onSecondary} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>მთავარი</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
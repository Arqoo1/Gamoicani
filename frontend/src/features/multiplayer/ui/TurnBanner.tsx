import { Text, View } from "react-native";

import type { MultiplayerScreenStyles } from "@/features/multiplayer/hooks/useMultiplayerScreenModel";

type Props = {
  styles: MultiplayerScreenStyles;
  waitingForOpponent: boolean;
  timeLeft: number;
};

export function TurnBanner({ styles, waitingForOpponent, timeLeft }: Props) {
  return (
    <View style={styles.turnBanner}>
      {waitingForOpponent ? <Text style={styles.waitingText}>⏳ მოწინააღმდეგე ელოდება...</Text> : <Text style={styles.timerText}>⏱ {timeLeft} წამი</Text>}
    </View>
  );
}

import { Feather } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import type { MultiplayerScreenStyles } from "@/features/multiplayer/hooks/useMultiplayerScreenModel";

type Props = {
  colors: {
    primaryText: string;
    button: string;
  };
  gameTitle: string;
  onBackPress: () => void;
  onToggleEmotes: () => void;
  styles: MultiplayerScreenStyles;
};

export function MultiplayerHeader({ colors, gameTitle, onBackPress, onToggleEmotes, styles }: Props) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityLabel="უკან" onPress={onBackPress} style={({ pressed }) => [styles.hBtn, pressed && styles.pressed]}>
        <Feather color={colors.primaryText} name="chevron-left" size={26} />
      </Pressable>
      <Text style={styles.title}>{gameTitle}</Text>
      <Pressable accessibilityLabel="ემოჯი" onPress={onToggleEmotes} style={({ pressed }) => [styles.hBtn, styles.emoteToggle, pressed && styles.pressed]}>
        <Text style={styles.emoteToggleIcon}>😊</Text>
      </Pressable>
    </View>
  );
}

import { Pressable, Text, View } from "react-native";

import type { MultiplayerScreenStyles } from "@/features/multiplayer/hooks/useMultiplayerScreenModel";

const EMOTES = ["😀", "😂", "😮", "😢", "😡", "👍", "👎", "🔥"];

type Props = {
  onSelect: (emote: string) => void;
  styles: MultiplayerScreenStyles;
  visible: boolean;
};

export function EmotePicker({ onSelect, styles, visible }: Props) {
  if (!visible) return null;

  return (
    <View style={styles.emotePicker}>
      {EMOTES.map((emote) => (
        <Pressable key={emote} onPress={() => onSelect(emote)} style={styles.emoteBtn}>
          <Text
            style={[
              styles.emoteBtnIcon,
              { textAlign: "center", textAlignVertical: "center", lineHeight: 28 },
            ]}
          >
            {emote}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
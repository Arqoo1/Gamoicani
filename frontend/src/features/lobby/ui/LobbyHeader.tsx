import { Feather } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { AppColors } from "@/application/providers/theme";
import { createStyles } from "@/features/lobby/screens/LobbyScreen.styles";

type LobbyHeaderProps = {
  colors: AppColors;
  onBack: () => void;
  styles: ReturnType<typeof createStyles>;
};

export function LobbyHeader({ colors, onBack, styles }: LobbyHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="უკან დაბრუნება"
        onPress={onBack}
        style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
      >
        <Feather color={colors.primaryText} name="chevron-left" size={28} />
      </Pressable>
      <Text style={styles.title}>მულტიპლეერი</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

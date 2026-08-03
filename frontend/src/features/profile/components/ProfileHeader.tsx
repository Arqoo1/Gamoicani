import { Pressable, Text, View } from "react-native";
import { createStyles } from "@/features/profile/screens/ProfileScreen.styles";

type ProfileHeaderProps = {
  styles: ReturnType<typeof createStyles>;
  onBack: () => void;
};

export function ProfileHeader({ styles, onBack }: ProfileHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]} onPress={onBack}>
        <Text style={styles.headerIcon}>‹</Text>
      </Pressable>
      <Text style={styles.headerTitle}>პროფილი</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

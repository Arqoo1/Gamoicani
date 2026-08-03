import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { AppColors } from "@/application/providers/theme";

type Props = { colors: AppColors; styles: Record<string, any> };

export function ProfileHeader({ colors, styles }: Props) {
  const router = useRouter();
  return (
    <View style={[styles.header, { backgroundColor: colors.card }]}>
      <Pressable style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]} onPress={() => router.push("/")}>
        <Text style={styles.headerIcon}>‹</Text>
      </Pressable>
      <Text style={styles.headerTitle}>პროფილი</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

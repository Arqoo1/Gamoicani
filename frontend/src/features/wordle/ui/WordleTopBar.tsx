import { Pressable, Text, View } from "react-native";
import { StatsIcon } from "@/features/wordle/ui/WordleBoardPieces";
import { createStyles } from "@/features/wordle/screens/WordleScreen.styles";

type WordleStyles = ReturnType<typeof createStyles>;

export function WordleTopBar({ styles, onBack, onRefresh, onStats, showStats }: { styles: WordleStyles; onBack: () => void; onRefresh: () => void; onStats: () => void; showStats: boolean; }) {
  return (
    <View style={styles.header}>
      <Pressable style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]} onPress={onBack}>
        <Text style={styles.headerIcon}>‹</Text>
      </Pressable>
      <View pointerEvents="none" style={styles.logoWrap}>
        <Text style={styles.logo}>სიტყვობანა</Text>
      </View>
      <View style={styles.headerActions}>
        {showStats && (
          <Pressable accessibilityLabel="სტატისტიკა" style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]} onPress={onStats}>
            <StatsIcon styles={styles} />
          </Pressable>
        )}
        <Pressable accessibilityLabel="ახალი სიტყვა" style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]} onPress={onRefresh}>
          <Text style={styles.headerIcon}>↻</Text>
        </Pressable>
      </View>
    </View>
  );
}

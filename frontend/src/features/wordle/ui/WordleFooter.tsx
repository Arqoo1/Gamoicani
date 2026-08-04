import { View } from "react-native";
import { GeorgianKeyboard, type LetterScore } from "@/shared/ui/GeorgianKeyboard";
import { createStyles } from "@/features/wordle/screens/WordleScreen.styles";

type WordleStyles = ReturnType<typeof createStyles>;

export function WordleFooter({
  styles,
  disabled,
  isShifted,
  letterScores,
  onKeyPress,
}: {
  styles: WordleStyles;
  disabled: boolean;
  isShifted: boolean;
  letterScores: Record<string, LetterScore>;
  onKeyPress: (key: string) => void;
}) {
  return (
    <View style={styles.footer}>
      <GeorgianKeyboard
        disabled={disabled}
        isShifted={isShifted}
        letterScores={letterScores}
        onKeyPress={onKeyPress}
      />
    </View>
  );
}

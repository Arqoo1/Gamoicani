import { GeorgianKeyboard } from "@/shared/ui/GeorgianKeyboard";
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
  letterScores: Record<string, any>;
  onKeyPress: (key: string) => void;
}) {
  return (
    <GeorgianKeyboard
      disabled={disabled}
      isShifted={isShifted}
      letterScores={letterScores}
      onKeyPress={onKeyPress}
    />
  );
}

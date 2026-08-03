import { Pressable, Text, View } from "react-native";
import { GameModePicker } from "@/shared/ui/GameModePicker";
import { createStyles } from "@/features/wordle/screens/WordleScreen.styles";

type WordleStyles = ReturnType<typeof createStyles>;

export function WordleModeSheet({
  visible,
  isDailyDone,
  onClose,
  onSelectDaily,
  onSelectPractice,
  onSelectTutorial,
  puzzleNumber,
  styles,
}: {
  visible: boolean;
  isDailyDone: boolean;
  onClose: () => void;
  onSelectDaily: () => void;
  onSelectPractice: () => void;
  onSelectTutorial: () => void;
  puzzleNumber: number;
  styles: WordleStyles;
}) {
  return (
    <GameModePicker
      visible={visible}
      kicker="სიტყობანა"
      title="აირჩიე რეჟიმი"
      onClose={onClose}
      options={[
        {
          id: "daily",
          title: "დღის სიტყვა",
          subtitle: `#${puzzleNumber} · ყოველდღიური`,
          disabledSubtitle: "✓ უკვე შესრულებულია",
          icon: "📅",
          disabled: isDailyDone,
          isDone: isDailyDone,
          onSelect: onSelectDaily
        },
        {
          id: "practice",
          title: "ვარჯიში",
          subtitle: "შემთხვევითი სიტყვა",
          icon: "🔁",
          onSelect: onSelectPractice
        },
        {
          id: "tutorial",
          title: "სწავლება",
          subtitle: "გაკვეთილი დამწყებთათვის",
          icon: "🎓",
          onSelect: onSelectTutorial
        }
      ]}
    />
  );
}

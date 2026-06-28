import { Text, View } from "react-native";

import { AppColors } from "@/application/providers/theme";

export function WordleTiles({ colors, compact }: { colors: AppColors; compact?: boolean }) {
  const tiles = [
    { letter: "ს", color: colors.correct },
    { letter: "ა", color: colors.present },
    { letter: "ხ", color: colors.correct },
    { letter: "ლ", color: colors.absent },
    { letter: "ი", color: colors.present }
  ];
  const size = compact ? 34 : 44;
  const fontSize = compact ? 14 : 18;
  const mb = compact ? 14 : 24;
  return (
    <View style={{ flexDirection: "row", gap: compact ? 5 : 7, marginBottom: mb }}>
      {tiles.map((t, i) => (
        <View
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: compact ? 8 : 10,
            backgroundColor: t.color,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: t.color,
            shadowOffset: { width: 0, height: compact ? 3 : 6 },
            shadowOpacity: 0.45,
            shadowRadius: compact ? 6 : 10,
            elevation: compact ? 4 : 8
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize }}>{t.letter}</Text>
        </View>
      ))}
    </View>
  );
}
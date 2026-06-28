import { View } from "react-native";

export function SunIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 18, height: 18, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, position: "absolute" }} />
      {[0, 45, 90, 135].map((deg) => (
        <View
          key={deg}
          style={{
            position: "absolute",
            width: 18,
            height: 2,
            borderRadius: 1,
            backgroundColor: color,
            transform: [{ rotate: `${deg}deg` }],
            opacity: 0.85
          }}
        />
      ))}
    </View>
  );
}

export function MoonIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 18, height: 18, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: color, overflow: "hidden" }}>
        <View
          style={{
            position: "absolute",
            width: 14,
            height: 14,
            borderRadius: 7,
            top: -3,
            right: -3,
            borderWidth: 3,
            borderColor: color
          }}
        />
      </View>
    </View>
  );
}

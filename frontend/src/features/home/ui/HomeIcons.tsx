import { View } from "react-native";

export function MoonIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 18, height: 18, alignItems: "center", justifyContent: "center" }}>
      {/* outer circle */}
      <View
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          borderWidth: 2,
          borderColor: color,
          overflow: "hidden",
          position: "relative"
        }}
      >
        {/* "bite" that makes the crescent */}
        <View
          style={{
            position: "absolute",
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: "transparent",
            top: -3,
            right: -3,
            borderWidth: 3,
            borderColor: color,
          }}
        />
      </View>
    </View>
  );
}


export function SunIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 18, height: 18, alignItems: "center", justifyContent: "center" }}>
      {/* center circle */}
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
          position: "absolute"
        }}
      />
      {/* rays — 8 tiny bars rotated */}
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


export function BookIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 20, height: 18, alignItems: "center", justifyContent: "center" }}>
      {/* left page */}
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 1,
          width: 8,
          height: 14,
          borderTopLeftRadius: 2,
          borderBottomLeftRadius: 2,
          borderWidth: 2,
          borderRightWidth: 0,
          borderColor: color
        }}
      />
      {/* right page */}
      <View
        style={{
          position: "absolute",
          right: 0,
          top: 1,
          width: 8,
          height: 14,
          borderTopRightRadius: 2,
          borderBottomRightRadius: 2,
          borderWidth: 2,
          borderLeftWidth: 0,
          borderColor: color
        }}
      />
      {/* spine */}
      <View
        style={{
          position: "absolute",
          width: 2,
          height: 14,
          top: 1,
          backgroundColor: color
        }}
      />
      {/* top arc */}
      <View
        style={{
          position: "absolute",
          top: 0,
          width: 6,
          height: 4,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          borderWidth: 2,
          borderBottomWidth: 0,
          borderColor: color
        }}
      />
    </View>
  );
}

export function LeaderboardIcon({ color }: { color: string }) {
  return (
    <View style={{ alignItems: "flex-end", flexDirection: "row", gap: 3, height: 20, width: 22 }}>
      <View style={{ backgroundColor: color, borderRadius: 2, height: 9, width: 4 }} />
      <View style={{ backgroundColor: color, borderRadius: 2, height: 16, width: 4 }} />
      <View style={{ backgroundColor: color, borderRadius: 2, height: 12, width: 4 }} />
    </View>
  );
}

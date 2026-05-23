import { Href, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import games from "../data/games.json";

type GameItem = {
  href?: Href;
  id: string;
  status: "ready" | "soon";
  subtitle: string;
  title: string;
};

const gameList = games as GameItem[];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.kicker}>ქართული თამაშები</Text>
          <Text style={styles.title}>გამოიცანი</Text>
        </View>

        <View style={styles.list}>
          {gameList.map((game) => {
            const ready = game.status === "ready";

            return (
              <Pressable
                key={game.id}
                disabled={!ready}
                style={({ pressed }) => [
                  styles.card,
                  !ready && styles.cardDisabled,
                  pressed && styles.cardPressed
                ]}
                onPress={() => {
                  if (game.href) {
                    router.push(game.href);
                  }
                }}
              >
                <View style={styles.cardCopy}>
                  <Text style={[styles.cardTitle, !ready && styles.disabledText]}>
                    {game.title}
                  </Text>
                  <Text style={[styles.cardSubtitle, !ready && styles.disabledText]}>
                    {game.subtitle}
                  </Text>
                </View>
                <Text
                  style={[ready ? styles.cardArrow : styles.cardStatus, !ready && styles.disabledText]}
                >
                  {ready ? "›" : "მალე"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f4f7fb"
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 24
  },
  header: {
    marginBottom: 26
  },
  kicker: {
    color: "#2f9e5d",
    fontSize: 15,
    fontWeight: "900"
  },
  title: {
    color: "#17352d",
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 0,
    marginTop: 5
  },
  list: {
    gap: 14
  },
  card: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#dce3e8",
    borderRadius: 8,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 84,
    paddingHorizontal: 18,
    paddingVertical: 15,
    shadowColor: "#17352d",
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 10
  },
  cardDisabled: {
    backgroundColor: "#eef1f4"
  },
  cardCopy: {
    flex: 1,
    paddingRight: 12
  },
  cardPressed: {
    opacity: 0.72
  },
  cardTitle: {
    color: "#17352d",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0
  },
  cardSubtitle: {
    color: "#66727f",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 3
  },
  cardArrow: {
    color: "#2f9e5d",
    fontSize: 38,
    fontWeight: "500",
    lineHeight: 38
  },
  cardStatus: {
    color: "#8a95a1",
    fontSize: 13,
    fontWeight: "900"
  },
  disabledText: {
    color: "#8a95a1"
  }
});

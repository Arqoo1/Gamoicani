import { Pressable, Text, View } from "react-native";

import type { GameItem } from "@/features/home/hooks/useHomeScreen";
import { createStyles } from "@/features/home/screens/HomeScreen.styles";

export function GameList({
  gameList,
  onPressGame,
  styles,
}: {
  gameList: Array<GameItem & { ready: boolean; done: boolean }>;
  onPressGame: (href?: GameItem["href"]) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.list}>
      {gameList.map((game) => (
        <Pressable
          key={game.id}
          disabled={!game.ready}
          style={({ pressed }) => [
            styles.card,
            !game.ready && styles.cardDisabled,
            pressed && styles.cardPressed,
          ]}
          onPress={() => onPressGame(game.href)}
        >
          {game.done && (
            <View style={styles.doneCorner}>
              <Text style={styles.doneCornerText}>✓</Text>
            </View>
          )}
          <View style={styles.cardCopy}>
            <Text style={[styles.cardTitle, !game.ready && styles.disabledText]}>{game.title}</Text>
            <Text style={[styles.cardSubtitle, !game.ready && styles.disabledText]}>{game.subtitle}</Text>
          </View>
          <Text
            style={[game.ready ? styles.cardArrow : styles.cardStatus, !game.ready && styles.disabledText]}
          >
            {game.ready ? "›" : "მალე"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

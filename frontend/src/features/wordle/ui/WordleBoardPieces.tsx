import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, StyleSheet, Text, View } from "react-native";

import { LetterScore } from "@/features/wordle/model/wordle";
import { playReveal } from "@/shared/services/sound";

const USE_NATIVE_ANIMATION_DRIVER = Platform.OS !== "web";

type WordleStyles = Record<string, any>;

type WordleTileProps = {
  delayIndex: number;
  fontSize: number;
  letter: string;
  score?: LetterScore;
  size: number;
  styles: WordleStyles;
};

const tileScoreStyles = StyleSheet.create({
  correct: {
    backgroundColor: "#2f9e5d",
    borderColor: "#2f9e5d"
  },
  present: {
    backgroundColor: "#d6a12a",
    borderColor: "#d6a12a"
  },
  absent: {
    backgroundColor: "#66727f",
    borderColor: "#66727f"
  }
});

export function StatsIcon({ styles }: { styles: WordleStyles }) {
  return (
    <View style={styles.statsIcon}>
      <View style={[styles.statsBar, { height: 9 }]} />
      <View style={[styles.statsBar, { height: 16 }]} />
      <View style={[styles.statsBar, { height: 12 }]} />
    </View>
  );
}

export function WordleTile({ delayIndex, fontSize, letter, score, size, styles }: WordleTileProps) {
  const rotation = useRef(new Animated.Value(0)).current;
  const [visibleScore, setVisibleScore] = useState<LetterScore | undefined>(score);
  const animIdRef = useRef(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!score) {
      rotation.stopAnimation();
      rotation.setValue(0);
      setVisibleScore(undefined);
      return;
    }

    const myId = ++animIdRef.current;
    rotation.stopAnimation();
    rotation.setValue(0);
    setVisibleScore(undefined);

    Animated.sequence([
      Animated.delay(delayIndex * 110),
      Animated.timing(rotation, {
        duration: 130,
        easing: Easing.in(Easing.quad),
        toValue: 90,
        useNativeDriver: USE_NATIVE_ANIMATION_DRIVER
      })
    ]).start(({ finished }) => {
      if (!finished || !isMounted.current || animIdRef.current !== myId) return;
      setVisibleScore(score);
      playReveal();
      Animated.timing(rotation, {
        duration: 130,
        easing: Easing.out(Easing.quad),
        toValue: 0,
        useNativeDriver: USE_NATIVE_ANIMATION_DRIVER
      }).start();
    });
  }, [delayIndex, rotation, score]);

  const rotateX = rotation.interpolate({
    inputRange: [0, 90],
    outputRange: ["0deg", "90deg"]
  });

  return (
    <Animated.View
      style={[
        styles.tile,
        { height: size, transform: [{ perspective: 800 }, { rotateX }], width: size },
        letter && !visibleScore && styles.tileFilled,
        visibleScore && tileScoreStyles[visibleScore]
      ]}
    >
      <Text
        style={[
          styles.tileText,
          { fontSize, lineHeight: fontSize + 7 },
          visibleScore && styles.tileTextScored
        ]}
      >
        {letter}
      </Text>
    </Animated.View>
  );
}

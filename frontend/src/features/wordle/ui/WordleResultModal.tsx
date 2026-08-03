import React, { memo, useRef } from "react";
import { Modal, Platform, Pressable, Share, StyleSheet, Text, View } from "react-native";
import ViewShot, { ViewShotRef } from "react-native-view-shot";
import { GameStatus, scoreGuess } from "@/features/wordle/model/wordle";
import { createStyles } from "@/features/wordle/screens/WordleScreen.styles";

type WordleResultModalProps = {
  answer: string;
  gameStatus: GameStatus;
  guesses: string[];
  isVisible: boolean;
  onClose: () => void;
  onNextPuzzle: () => void;
  puzzleNumber: number;
  styles: ReturnType<typeof createStyles>;
  tileSize?: number;
  tileFontSize?: number;
};

function scoreToEmoji(score: "correct" | "present" | "absent") {
  if (score === "correct") return "🟩";
  if (score === "present") return "🟨";
  return "⬛";
}

const staticTileScoreStyles = StyleSheet.create({
  correct: {
    backgroundColor: "#2f9e5d",
    borderColor: "#2f9e5d",
  },
  present: {
    backgroundColor: "#d6a12a",
    borderColor: "#d6a12a",
  },
  absent: {
    backgroundColor: "#66727f",
    borderColor: "#66727f",
  },
});

export const WordleResultModal = memo(function WordleResultModal({
  answer,
  gameStatus,
  guesses,
  isVisible,
  onClose,
  onNextPuzzle,
  puzzleNumber,
  styles,
  tileSize = 38,
  tileFontSize = 20,
}: WordleResultModalProps) {
  const viewShotRef = useRef<ViewShotRef | null>(null);

  const sharePreview = React.useMemo(() => {
    const result = gameStatus === "won" ? `${guesses.length}/6` : "X/6";
    const emojiRows = guesses.map((guess) => scoreGuess(guess, answer).map(scoreToEmoji).join(""));

    return [`ქართული სიტყვობანა #${puzzleNumber} ${result}`, ...emojiRows].join("\n");
  }, [answer, gameStatus, guesses, puzzleNumber]);

  const handleShare = async () => {
    if (Platform.OS === "web") {
      await Share.share({ message: sharePreview });
      return;
    }
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (uri) {
        await Share.share({ url: uri, message: sharePreview });
      } else {
        await Share.share({ message: sharePreview });
      }
    } catch {
      await Share.share({ message: sharePreview });
    }
  };

  return (
    <Modal animationType="fade" transparent visible={isVisible} onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.resultModal} onPress={() => {}}>
          <ViewShot ref={viewShotRef} options={{ format: "png", quality: 0.9 }}>
            <View style={styles.resultModalTop}>
              <View style={styles.resultBadge}>
                <Text style={styles.resultBadgeText}>{gameStatus === "won" ? "\u2713" : "!"}</Text>
              </View>
              <Pressable style={styles.modalCloseButton} onPress={onClose}>
                <Text style={styles.modalCloseText}>{"\u00d7"}</Text>
              </Pressable>
            </View>

            <Text style={styles.resultTitle}>
              {gameStatus === "won"
                ? "\u10db\u10dd\u10d2\u10d4\u10d1\u10d0"
                : "\u10ec\u10d0\u10d2\u10d4\u10d1\u10d0"}
            </Text>
            <Text style={styles.resultSubtitle}>
              {gameStatus === "won"
                ? `${guesses.length}/6 \u10ea\u10d3\u10d0\u10e8\u10d8 \u10d2\u10d0\u10db\u10dd\u10d8\u10ea\u10d0\u10dc\u10d8`
                : `\u10e1\u10ec\u10dd\u10e0\u10d8 \u10e1\u10d8\u10e2\u10e7\u10d5\u10d0 \u10d8\u10e7\u10dd: ${answer}`}
            </Text>

            <View style={styles.resultGrid}>
              {guesses.map((guess, rIdx) => {
                const scores = scoreGuess(guess, answer);
                return (
                  <View key={rIdx} style={[styles.boardRow, { gap: 4, marginVertical: 2 }]}>
                    {Array.from(guess).map((char, cIdx) => (
                      <View
                        key={cIdx}
                        style={[
                          styles.tile,
                          { height: tileSize, width: tileSize },
                          staticTileScoreStyles[scores[cIdx]],
                        ]}
                      >
                        <Text
                          style={[
                            styles.tileText,
                            styles.tileTextScored,
                            { fontSize: tileFontSize, lineHeight: tileFontSize + 7 },
                          ]}
                        >
                          {char}
                        </Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          </ViewShot>

          <View style={styles.resultActions}>
            <Pressable style={styles.resultButton} onPress={handleShare}>
              <Text style={styles.resultButtonText}>
                {"\u10d2\u10d0\u10d6\u10d8\u10d0\u10e0\u10d4\u10d1\u10d0"}
              </Text>
            </Pressable>
            <Pressable style={[styles.resultButton, styles.secondaryResultButton]} onPress={onNextPuzzle}>
              <Text style={[styles.resultButtonText, styles.secondaryResultButtonText]}>
                {"\u10e8\u10d4\u10db\u10d3\u10d4\u10d2\u10d8"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

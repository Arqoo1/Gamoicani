import React, { memo, useRef } from "react";
import { Modal, Platform, Pressable, Share, Text, View } from "react-native";
import ViewShot from "react-native-view-shot";
import { GameStatus, scoreGuess } from "@/features/wordle/model/wordle";
import { WordleTile } from "@/features/wordle/ui/WordleBoardPieces";

type WordleResultModalProps = {
  answer: string;
  gameStatus: GameStatus;
  guesses: string[];
  isVisible: boolean;
  onClose: () => void;
  onNextPuzzle: () => void;
  puzzleNumber: number;
  styles: any;
  tileSize?: number;
  tileFontSize?: number;
};

function scoreToEmoji(score: "correct" | "present" | "absent") {
  if (score === "correct") return "🟩";
  if (score === "present") return "🟨";
  return "⬛";
}

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
  const viewShotRef = useRef<any>(null);

  const sharePreview = React.useMemo(() => {
    const result = gameStatus === "won" ? `${guesses.length}/6` : "X/6";
    const emojiRows = guesses.map((guess) =>
      scoreGuess(guess, answer).map(scoreToEmoji).join("")
    );

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
    <Modal animationType="slide" transparent visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <ViewShot ref={viewShotRef} options={{ format: "png", quality: 0.9 }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {gameStatus === "won" ? "🎉 გილოცავთ!" : "😔 სამწუხაროდ წააგეთ"}
              </Text>
              <Text style={styles.modalSubtitle}>
                {gameStatus === "won" ? `სიტყვა გამოიცანით ${guesses.length}/6 მცდელობაში` : `სწორი სიტყვა იყო: ${answer}`}
              </Text>
            </View>

            <View style={styles.resultGrid}>
              {guesses.map((guess, rIdx) => {
                const scores = scoreGuess(guess, answer);
                return (
                  <View key={rIdx} style={[styles.boardRow, { gap: 4, marginVertical: 2 }]}>
                    {Array.from(guess).map((char, cIdx) => (
                      <WordleTile
                        key={cIdx}
                        delayIndex={0}
                        fontSize={tileFontSize}
                        letter={char}
                        score={scores[cIdx]}
                        size={tileSize}
                        styles={styles}
                      />
                    ))}
                  </View>
                );
              })}
            </View>
          </ViewShot>

          <View style={styles.modalActions}>
            <Pressable style={styles.shareButton} onPress={handleShare}>
              <Text style={styles.shareText}>გაზიარება 🔗</Text>
            </Pressable>
            <Pressable style={[styles.shareButton, styles.nextButton]} onPress={onNextPuzzle}>
              <Text style={styles.shareText}>შემდეგი ➔</Text>
            </Pressable>
          </View>

          <Pressable style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>დახურვა</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
});

import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Share,
  ScrollView,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
  Modal
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import ViewShot from "react-native-view-shot";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/application/providers/auth";
import { useAppTheme } from "@/application/providers/theme";
import { createStyles } from "@/features/andazebi/screens/AndazebiScreen.styles";
import { useAndazebiGame } from "@/features/andazebi/hooks/useAndazebiGame";
import { getHintButtonText } from "@/features/andazebi/model/screenModel";
import { BACKSPACE_KEY, ENTER_KEY, SHIFT_KEY } from "@/shared/constants/georgianKeyboard";
import { GeorgianKeyboard } from "@/shared/ui/GeorgianKeyboard";

type AndazebiStyles = ReturnType<typeof createStyles>;

function BackIcon({ styles }: { styles: AndazebiStyles }) {
  return <Text style={styles.headerIcon}>‹</Text>;
}

export default function AndazebiScreen() {
  const router = useRouter();
  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }, [router]);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { updateUser, user } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const confettiRef = useRef<any>(null);
  const viewShotRef = useRef<any>(null);

  const {
    isDailyDone,
    gameMode,
    setGameMode,
    itemIndex,
    currentItem,
    answers,
    completedItems,
    stats,
    isHydrated,
    activeInputIndex,
    setActiveInputIndex,
    result,
    feedback,
    hintLevel,
    setHintLevel,
    wrongAttempts,
    wordStatuses,
    isShifted,
    handleKeyPress,
    resetCurrent,
    switchGameMode,
    setHintToNextLevel,
    revealAnswer,
    skipCurrent,
    goNext,
    submitAnswer,
    dailyItems,
    items,
    sharePreview,
    progressText,
    currentLevel,
    canGoNext,
    keyboardGap,
    keyboardRowGap,
    keyHeight,
    keyMaxWidth,
    actionKeyMaxWidth,
    keyboardRows,
    dailyNumber,
    levelSummary,
    completedMethods,
    currentHintText,
    canUseHelp,
    shakeTranslateX,
    successScale,
    isOffline,
    dateKey,
    isDailyComplete,
    isPracticeMode
  } = useAndazebiGame(user, updateUser, () => confettiRef.current?.start(), width);

  const shareResult = useCallback(async () => {
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
  }, [sharePreview]);

  return (
    <SafeAreaView edges={["top", "right", "left"]} style={styles.safe}>
      <ConfettiCannon
        ref={confettiRef}
        count={180}
        origin={{ x: width / 2, y: -10 }}
        autoStart={false}
        fadeOut
      />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.card} />

      <Modal
        animationType="fade"
        transparent
        visible={gameMode === null}
        onRequestClose={handleGoBack}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modePickerModal}>
            <Text style={styles.modePickerKicker}>ანდაზები</Text>
            <Text style={styles.modePickerTitle}>აირჩიე რეჟიმი</Text>

            <Pressable
              disabled={isDailyDone}
              style={({ pressed }) => [
                styles.modePickerOption,
                isDailyDone && styles.modePickerOptionDisabled,
                !isDailyDone && pressed && styles.pressed
              ]}
              onPress={() => setGameMode("daily")}
            >
              <View style={styles.modePickerIconWrap}>
                <Text style={styles.modePickerIcon}>📅</Text>
              </View>
              <View style={styles.modePickerText}>
                <Text style={[styles.modePickerOptionTitle, isDailyDone && styles.modePickerDisabledText]}>
                  დღის ანდაზები
                </Text>
                <Text style={[styles.modePickerOptionSub, isDailyDone && styles.modePickerDisabledText]}>
                  {isDailyDone
                    ? "✓ დღეს უკვე ითამაშე"
                    : "5 ახალი ანდაზა ყოველდღე"}
                </Text>
              </View>
              {isDailyDone ? (
                <Text style={styles.modePickerDoneCheck}>✓</Text>
              ) : (
                <Text style={styles.modePickerArrow}>›</Text>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.modePickerOption, styles.modePickerOptionSecondary, pressed && styles.pressed]}
              onPress={() => setGameMode("practice")}
            >
              <View style={styles.modePickerIconWrap}>
                <Text style={styles.modePickerIcon}>🔁</Text>
              </View>
              <View style={styles.modePickerText}>
                <Text style={styles.modePickerOptionTitle}>ვარჯიში</Text>
                <Text style={styles.modePickerOptionSub}>უსასრულო რეჟიმი</Text>
              </View>
              <Text style={styles.modePickerArrow}>›</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.modePickerOption, styles.modePickerOptionSecondary, pressed && styles.pressed]}
              onPress={() => setGameMode("tutorial")}
            >
              <View style={styles.modePickerIconWrap}>
                <Text style={styles.modePickerIcon}>🎓</Text>
              </View>
              <View style={styles.modePickerText}>
                <Text style={styles.modePickerOptionTitle}>როგორ ვითამაშოთ</Text>
                <Text style={styles.modePickerOptionSub}>ინტერაქტიული გაკვეთილი</Text>
              </View>
              <Text style={styles.modePickerArrow}>›</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.modePickerBack, pressed && styles.pressed]}
              onPress={handleGoBack}
            >
              <Text style={styles.modePickerBackText}>← უკან</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Pressable
          accessibilityLabel="უკან დაბრუნება"
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          onPress={handleGoBack}
        >
          <BackIcon styles={styles} />
        </Pressable>
        <Text style={styles.logo}>ანდაზები</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardArea}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!isOffline && (
            <View style={styles.modeRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.modeButton,
                  gameMode === "daily" && styles.modeButtonActive,
                  pressed && styles.pressed
                ]}
                onPress={() => switchGameMode("daily")}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    gameMode === "daily" && styles.modeButtonTextActive
                  ]}
                >
                  დღიური
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modeButton,
                  gameMode === "practice" && styles.modeButtonActive,
                  pressed && styles.pressed
                ]}
                onPress={() => switchGameMode("practice")}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    gameMode === "practice" && styles.modeButtonTextActive
                  ]}
                >
                  ვარჯიში
                </Text>
              </Pressable>
            </View>
          )}

          {isDailyComplete ? (
            <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }}>
              <View style={styles.doneCard}>
                <Text style={styles.doneTitle}>დღევანდელი ანდაზები დასრულებულია!</Text>
                <Text style={styles.doneText}>ახალი ანდაზები დაემატება ხვალ</Text>

                <Text style={styles.doneCount}>{dailyItems.length}</Text>
                <Text style={[styles.doneText, { marginBottom: 16 }]}>ანდაზა</Text>

                <Text style={styles.doneText}>{sharePreview}</Text>

                <View style={styles.actions}>
                  <Pressable
                    style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                    onPress={shareResult}
                  >
                    <Text style={styles.primaryButtonText}>გაზიარება</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                    onPress={() => switchGameMode("practice")}
                  >
                    <Text style={styles.secondaryButtonText}>ვარჯიში</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                    onPress={() => router.push("/")}
                  >
                    <Text style={styles.secondaryButtonText}>მთავარი</Text>
                  </Pressable>
                </View>
              </View>
            </ViewShot>
          ) : currentItem ? (
            <>
              <View style={styles.metaRow}>
                <Text style={styles.progressText}>{progressText}</Text>
                <View style={[styles.levelPill, styles[`${currentItem.level}Level`]]}>
                  <Text style={styles.levelText}>{currentLevel.label}</Text>
                </View>
                <Text style={styles.wordsText}>{currentLevel.words}</Text>
              </View>

              <Animated.View
                style={[
                  styles.gameCard,
                  { transform: [{ translateX: shakeTranslateX }, { scale: successScale }] }
                ]}
              >
                <Text style={styles.prompt}>{currentItem.prompt}</Text>
                <Text
                  style={[
                    styles.feedback,
                    result === "wrong" && styles.feedbackWrong,
                    result === "correct" && styles.feedbackCorrect
                  ]}
                >
                  {feedback}
                </Text>

                <View style={styles.inputs}>
                  {currentItem.missingWords.map((_, index) => (
                    <Pressable
                      accessibilityLabel={`სიტყვა ${index + 1}`}
                      accessibilityRole="button"
                      key={`${currentItem.id}-${index}`}
                      disabled={result === "correct"}
                      onPress={() => setActiveInputIndex(index)}
                      style={[
                        styles.input,
                        index === activeInputIndex && result !== "correct" && styles.inputActive,
                        wordStatuses[index] === "wrong" && styles.inputWrong,
                        wordStatuses[index] === "correct" && styles.inputCorrect,
                        result === "correct" && styles.inputCorrect,
                        result !== "correct" && index === activeInputIndex && styles.inputPressed
                      ]}
                    >
                      <Text
                        style={[
                          styles.inputText,
                          !answers[index] && styles.inputPlaceholder,
                          wordStatuses[index] === "wrong" && styles.inputTextWrong,
                          wordStatuses[index] === "correct" && styles.inputTextCorrect,
                          result === "correct" && styles.inputTextCorrect
                        ]}
                      >
                        {answers[index] || `სიტყვა ${index + 1}`}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.actions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      result === "correct" && styles.primaryButtonComplete,
                      pressed && styles.pressed
                    ]}
                    onPress={submitAnswer}
                  >
                    <Text style={styles.primaryButtonText}>
                      {result === "correct" ? "სწორია" : "შემოწმება"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                    onPress={resetCurrent}
                  >
                    <Text style={styles.secondaryButtonText}>გასუფთავება</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.hintButton, pressed && styles.pressed]}
                  onPress={setHintToNextLevel}
                >
                  <Text style={styles.hintButtonText}>
                    {getHintButtonText(hintLevel)}
                  </Text>
                </Pressable>

                {hintLevel > 0 && <Text style={styles.hintText}>{currentHintText}</Text>}

                {canUseHelp && (
                  <View style={styles.helpActions}>
                    <Pressable
                      style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}
                      onPress={setHintToNextLevel}
                    >
                      <Text style={styles.helpButtonText}>მინიშნება</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}
                      onPress={revealAnswer}
                    >
                      <Text style={styles.helpButtonText}>პასუხის ნახვა</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.helpButton,
                        styles.skipButton,
                        pressed && styles.pressed
                      ]}
                      onPress={skipCurrent}
                    >
                      <Text style={[styles.helpButtonText, styles.skipButtonText]}>გამოტოვება</Text>
                    </Pressable>
                  </View>
                )}

                {result === "correct" && (
                  <View style={styles.completeBox}>
                    <Text style={styles.fullText}>{currentItem.fullText}</Text>
                    <Pressable
                      disabled={!canGoNext}
                      style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}
                      onPress={goNext}
                    >
                      <Text style={styles.nextButtonText}>
                        {isPracticeMode
                          ? "შემდეგი"
                          : itemIndex + 1 >= dailyItems.length
                            ? "დასრულება"
                            : "შემდეგი"}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </Animated.View>
            </>
          ) : null}
        </ScrollView>

        {!isDailyComplete && currentItem && (
          <View style={[styles.footer, { paddingBottom: Math.max(10, insets.bottom) }]}>
            <GeorgianKeyboard
              isShifted={isShifted}
              onKeyPress={handleKeyPress}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

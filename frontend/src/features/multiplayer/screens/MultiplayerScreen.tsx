import { useMemo } from "react";
import { Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/application/providers/theme";
import { ENTER_KEY, SHIFT_KEY } from "@/shared/constants/georgianKeyboard";
import { GeorgianKeyboard } from "@/shared/ui/GeorgianKeyboard";
import { useMultiplayerScreenModel } from "@/features/multiplayer/hooks/useMultiplayerScreenModel";
import { AndazebiMatchPanel } from "@/features/multiplayer/ui/AndazebiMatchPanel";
import { GameOverOverlay } from "@/features/multiplayer/ui/GameOverOverlay";
import { LeaveConfirmOverlay } from "@/features/multiplayer/ui/LeaveConfirmOverlay";
import { MultiplayerHeader } from "@/features/multiplayer/ui/MultiplayerHeader";
import { OpponentStrip } from "@/features/multiplayer/ui/OpponentStrip";
import { TurnBanner } from "@/features/multiplayer/ui/TurnBanner";
import { WordleMatchBoard } from "@/features/multiplayer/ui/WordleMatchBoard";

export default function MultiplayerScreen() {
  const { colors, isDark } = useAppTheme();
  const model = useMultiplayerScreenModel();

  const opponentName = model.opponentProfile?.displayName ?? "მოწინააღმდეგე";
  const prompt = (model.puzzle as { prompt?: string })?.prompt;
  const hint = (model.puzzle as { hint?: string | null })?.hint;

  const andazebiHistory = useMemo(
    () =>
      model.guesses.map((guess, index) => ({
        guess,
        isCorrect: model.guessResults[index] === "correct",
      })),
    [model.guessResults, model.guesses]
  );

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={model.styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      <MultiplayerHeader
        colors={colors}
        gameTitle={model.gameTitle}
        onBackPress={model.handleBackPress}
        onToggleEmotes={() => model.setEmotePickerOpen((value) => !value)}
        styles={model.styles}
      />

      {model.emotePickerOpen && !model.gameOver ? (
        <>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => model.setEmotePickerOpen(false)} />
          <View style={model.styles.emotePicker}>
            {["🔥", "🧠", "🎯", "😂", "😤", "👏", "🤬", "🙏"].map((emote) => (
              <Pressable key={emote} onPress={() => model.sendEmote(emote)} style={({ pressed }) => [model.styles.emoteBtn, pressed && model.styles.pressed]}>
                <Text style={model.styles.emoteBtnIcon}>{emote}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      <OpponentStrip
        andazebiAttempts={model.ANDAZEBI_ATTEMPTS}
        avatarIcon={model.avatarIcon}
        colors={colors}
        gameType={model.gameType}
        myEmote={model.myEmote}
        myOp={model.myOp}
        myY={model.myY}
        oppEmote={model.oppEmote}
        oppOp={model.oppOp}
        oppY={model.oppY}
        opponentName={opponentName}
        opponentProgress={model.opponentProgress}
        styles={model.styles}
        wordLength={model.wordLength}
      />

      {!model.gameOver ? <TurnBanner styles={model.styles} waitingForOpponent={model.waitingForOpponent} timeLeft={model.timeLeft} /> : null}

      {model.gameType === "wordle" ? (
        <WordleMatchBoard
          colors={colors}
          currentGuess={model.currentGuess}
          gameOver={model.gameOver}
          guessResults={model.guessResults}
          guesses={model.guesses}
          styles={model.styles}
          wordLength={model.wordLength}
        />
      ) : (
        <AndazebiMatchPanel
          activeInputIndex={model.activeInputIndex}
          andazebiAnswers={model.andazebiAnswers}
          colors={colors}
          gameOver={model.gameOver}
          hint={hint}
          history={andazebiHistory}
          onPressInput={model.setActiveInputIndex}
          onSubmit={model.submitGuess}
          prompt={prompt}
          styles={model.styles}
        />
      )}

      <GeorgianKeyboard
        isShifted={model.isShifted}
        onKeyPress={(key) => {
          if (key === SHIFT_KEY) model.handleKey("SHIFT");
          else if (key === ENTER_KEY) model.handleKey("ENTER");
          else model.handleKey(key);
        }}
      />

      {model.gameOver && model.results ? (
        <GameOverOverlay
          answer={typeof model.results.answer === "string" ? model.results.answer : null}
          didDraw={model.didDraw}
          didWin={model.didWin}
          onPrimary={() => model.router.replace("/lobby")}
          onSecondary={() => model.router.replace("/")}
          styles={model.styles}
        />
      ) : null}

      {model.leaveModalOpen && !model.gameOver ? (
        <LeaveConfirmOverlay onCancel={() => model.setLeaveModalOpen(false)} onConfirm={model.confirmLeave} styles={model.styles} />
      ) : null}
    </SafeAreaView>
  );
}

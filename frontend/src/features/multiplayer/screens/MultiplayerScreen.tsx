import { useRouter } from "expo-router";
import { StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/application/providers/theme";
import { useMultiplayerScreenModel } from "@/features/multiplayer/hooks/useMultiplayerScreenModel";
import { ENTER_KEY, SHIFT_KEY } from "@/shared/constants/georgianKeyboard";
import { GeorgianKeyboard } from "@/shared/ui/GeorgianKeyboard";

import { OpponentProgressStrip } from "../components/OpponentProgressStrip";
import { GameOverOverlay } from "../ui/GameOverOverlay";
import { LeaveConfirmOverlay } from "../ui/LeaveConfirmOverlay";
import { MultiplayerHeader } from "../ui/MultiplayerHeader";
import { AndazebiMatchPanel } from "../ui/AndazebiMatchPanel";
import { TurnBanner } from "../ui/TurnBanner";
import { WordleMatchBoard } from "../ui/WordleMatchBoard";
import { EmotePicker } from "../ui/EmotePicker";

export default function MultiplayerScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const model = useMultiplayerScreenModel();

  const didWin = model.results?.result === "won";
  const didDraw = model.results?.result === "draw";

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

            <EmotePicker
        onSelect={(emote) => {
          model.sendEmote(emote);
          model.setEmotePickerOpen(false);
        }}
        styles={model.styles}
        visible={model.emotePickerOpen}
      />
      <OpponentProgressStrip
        opponentProfile={model.opponentProfile}
        opponentProgress={model.opponentProgress}
        gameType={model.gameType}
        wordLength={model.wordLength}
        oppEmote={model.oppEmote}
        oppY={model.oppY}
        oppOp={model.oppOp}
        myEmote={model.myEmote}
        myY={model.myY}
        myOp={model.myOp}
        colors={colors}
      />
      <TurnBanner
        styles={model.styles}
        waitingForOpponent={model.waitingForOpponent}
        timeLeft={model.timeLeft}
      />

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
          hint={(model.puzzle as { hint?: string | null } | null)?.hint}
          history={model.guessResults.map((guess, index) => ({
            guess: model.guesses[index] ?? "",
            isCorrect: guess === "correct",
          }))}
          onPressInput={model.setActiveInputIndex}
          onSubmit={model.submitGuess}
          prompt={(model.puzzle as { prompt?: string | null } | null)?.prompt ?? undefined}
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

      <GameOverOverlay
        answer={(model.puzzle as { answer?: string } | null)?.answer}
        didDraw={didDraw}
        didWin={didWin}
        gameOver={model.gameOver}
        onPrimary={() => router.replace("/lobby")}
        onSecondary={() => router.replace("/")}
        styles={model.styles}
      />

      <LeaveConfirmOverlay
        visible={model.leaveModalOpen}
        onCancel={() => model.setLeaveModalOpen(false)}
        onConfirm={model.confirmLeave}
        styles={model.styles}
      />
    </SafeAreaView>
  );
}

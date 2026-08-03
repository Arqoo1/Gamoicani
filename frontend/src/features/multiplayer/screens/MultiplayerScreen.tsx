import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StatusBar, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useSocket } from "@/application/providers/socket";
import { useAuth } from "@/application/providers/auth";
import { AppColors, useAppTheme } from "@/application/providers/theme";
import { playBuzz, playChime, playPop } from "@/shared/services/sound";
import { triggerInvalidHaptic, triggerSelectionHaptic } from "@/shared/services/haptics";
import { TileScore } from "@/shared/api/socket.types";
import { createStyles } from "@/features/multiplayer/screens/MultiplayerScreen.styles";

import {
  BACKSPACE_KEY,
  BASE_GEORGIAN_KEYBOARD_ROWS,
  ENTER_KEY,
  GEORGIAN_LETTERS,
  QWERTY_TO_GEORGIAN,
  SHIFT_KEY,
  SHIFTED_GEORGIAN_KEYS,
  SHIFTED_QWERTY_TO_GEORGIAN,
} from "@/shared/constants/georgianKeyboard";
import { GeorgianKeyboard } from "@/shared/ui/GeorgianKeyboard";
import { useMultiplayerSocket } from "@/features/multiplayer/hooks/useMultiplayerSocket";
import { useMultiplayerRouteParams } from "@/features/multiplayer/hooks/useMultiplayerRouteParams";

import { OpponentProgressStrip } from "../components/OpponentProgressStrip";
import { WordleBoard } from "../components/WordleBoard";
import { AndazebiPlayground } from "../components/AndazebiPlayground";
import { GameOverOverlay } from "../components/GameOverOverlay";
import { LeaveConfirmOverlay } from "../components/LeaveConfirmOverlay";
import { TurnTimer } from "../components/TurnTimer";

const EMOTES = ["🔥", "🧠", "🎯", "😂", "😤", "👏", "🤬", "🙏"];

const BASE_KB_ROWS = BASE_GEORGIAN_KEYBOARD_ROWS;

const CELL_GAP = 5;
const KB_KEY_H = 42;
const KB_GAP = 5;
const GRID_ROWS = 6;

export default function MultiplayerScreen() {
  const { colors, isDark } = useAppTheme();
  const model = useMultiplayerScreenModel();

  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [andazebiAnswers, setAndazebiAnswers] = useState<string[]>(() =>
    Array(puzzle?.missingWordsCount || 1).fill("")
  );
  const [activeInputIndex, setActiveInputIndex] = useState(0);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [activePlayerId, setActivePlayerId] = useState<string | null>(initialActivePlayer);

  const [timerStartSignal, setTimerStartSignal] = useState(0);
  const [timerStopSignal, setTimerStopSignal] = useState(0);

  const triggerTimerStart = () => setTimerStartSignal((n) => n + 1);
  const triggerTimerStop = () => setTimerStopSignal((n) => n + 1);

  const hasStartedTimer = useRef(false);

  useEffect(() => {
    if (user && initialActivePlayer && initialActivePlayer === user.id && !hasStartedTimer.current) {
      hasStartedTimer.current = true;
      triggerTimerStart();
    }
  }, [user, initialActivePlayer]);

  const {
    gameOver,
    guessResults,
    opponentProgress,
    results,
    oppEmote,
    oppOp,
    oppY,
    myEmote,
    myOp,
    myY,
    sendEmote,
    submitGuess: emitGuess,
    forfeitMatch,
  } = useMultiplayerSocket(gameType, roomId, wordLength, {
    onActivePlayerChanged: (id) => {
      setActivePlayerId(id);
      if (user && id === user.id) {
        triggerTimerStart();
      } else {
        triggerTimerStop();
      }
    },
    onTurnTimeout: () => {
      triggerTimerStop();
      setGuesses((prev) => [...prev, ""]);
    },
  });

  const isMyTurn = !!socket && !!activePlayerId && !!user && activePlayerId === user.id;
  const waitingForOpponent = !isMyTurn;

  const [emotePickerOpen, setEmotePickerOpen] = useState(false);
  const [isShifted, setIsShifted] = useState(false);

  const STATUS_H = Platform.OS === "android" ? safeTop : 0;
  const HEADER_H = 48;
  const OPP_H = 74;
  const KB_H = 3 * KB_KEY_H + 2 * KB_GAP + 10;
  const MARGINS = 16;

  const availH = height - STATUS_H - HEADER_H - OPP_H - KB_H - MARGINS;
  const cellFromH = Math.floor((availH - (GRID_ROWS - 1) * CELL_GAP) / GRID_ROWS);
  const cellFromW = Math.floor((width - 32 - (wordLength - 1) * CELL_GAP) / wordLength);
  const cellSize = Math.min(54, Math.max(30, Math.min(cellFromH, cellFromW)));

  const styles = useMemo(() => createStyles(colors, cellSize), [colors, cellSize]);

  const handleBackPress = () => {
    if (gameOver) {
      router.replace("/lobby");
    } else {
      setLeaveModalOpen(true);
    }
  };

  const confirmLeave = () => {
    forfeitMatch();
    router.replace("/lobby");
  };

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameOver || waitingForOpponent) return;
      if (e.key === "Enter") {
        e.preventDefault();
        handleKey("ENTER");
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        handleKey("⌫");
        return;
      }
      const typedLetter = Array.from(e.key)[0];
      const qwertyLetter =
        e.key.length === 1
          ? ((e.shiftKey ? SHIFTED_QWERTY_TO_GEORGIAN[e.key.toUpperCase()] : undefined) ??
            QWERTY_TO_GEORGIAN[e.key.toLowerCase()])
          : undefined;
      const letter = qwertyLetter ?? typedLetter;

      if (letter && GEORGIAN_LETTERS.has(letter)) {
        e.preventDefault();
        handleKey(letter);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [gameOver, currentGuess, gameType, waitingForOpponent]);

  const handleSendEmote = (emote: string) => {
    sendEmote(emote);
    setEmotePickerOpen(false);
  };

  const handleSubmitGuess = () => {
    if (gameOver || waitingForOpponent) return;

    if (gameType === "wordle") {
      if (Array.from(currentGuess).length !== wordLength) {
        triggerInvalidHaptic();
        playBuzz();
        return;
      }
      playChime();
      emitGuess(currentGuess.trim());
      setGuesses((prev) => [...prev, currentGuess.trim()]);
      setCurrentGuess("");
    } else {
      if (andazebiAnswers.some((ans) => ans.trim().length === 0)) {
        triggerInvalidHaptic();
        playBuzz();
        return;
      }
      playChime();
      const combinedGuess = andazebiAnswers.join(" ");
      emitGuess(combinedGuess);
      setGuesses((prev) => [...prev, combinedGuess]);
      setAndazebiAnswers(Array(puzzle?.missingWordsCount || 1).fill(""));
      setActiveInputIndex(0);
    }

    setIsShifted(false);
  };

  const handleKey = (key: string) => {
    if (gameOver) return;

    if (key === BACKSPACE_KEY) {
      triggerSelectionHaptic();
      if (gameType === "wordle") {
        setCurrentGuess((prev) => Array.from(prev).slice(0, -1).join(""));
      } else {
        setAndazebiAnswers((prev) => {
          const next = [...prev];
          next[activeInputIndex] = Array.from(next[activeInputIndex]).slice(0, -1).join("");
          return next;
        });
      }
    } else if (key === "ENTER") {
      triggerSelectionHaptic();
      handleSubmitGuess();
    } else if (key === "SHIFT") {
      triggerSelectionHaptic();
      setIsShifted((v) => !v);
    } else {
      triggerSelectionHaptic();
      playPop();
      const actualKey = isShifted ? (SHIFTED_GEORGIAN_KEYS[key] ?? key) : key;
      if (gameType === "wordle") {
        if (Array.from(currentGuess).length >= wordLength) return;
        setCurrentGuess((prev) => prev + actualKey);
      } else {
        setAndazebiAnswers((prev) => {
          const next = [...prev];
          next[activeInputIndex] = next[activeInputIndex] + actualKey;
          return next;
        });
      }
      setIsShifted(false);
    }
  };

  const didWin = results?.result === "won";
  const didDraw = results?.result === "draw";

  const avatarIcon =
    opponentProfile?.equippedItems?.avatar === "avatar_ninja"
      ? "🥷"
      : opponentProfile?.equippedItems?.avatar === "avatar_wizard"
        ? "🧙‍♂️"
        : opponentProfile?.equippedItems?.avatar === "avatar_cat"
          ? "🐱"
          : "👤";

  const gameTitle = gameType === "wordle" ? "სიტყვობანა" : gameType === "andazebi" ? "ანდაზები" : "მატჩი";

  const kbRows = useMemo(() => {
    return BASE_KB_ROWS.map((row) => {
      return row.map((k) => (isShifted && SHIFTED_GEORGIAN_KEYS[k] ? SHIFTED_GEORGIAN_KEYS[k] : k));
    });
  }, [isShifted]);

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

        <Text style={styles.title}>{gameTitle}</Text>

        <Pressable
          accessibilityLabel="ემოჯი"
          style={({ pressed }) => [styles.hBtn, styles.emoteToggle, pressed && styles.pressed]}
          onPress={() => setEmotePickerOpen((v) => !v)}
        >
          <Text style={styles.emoteToggleIcon}>😊</Text>
        </Pressable>
      </View>

      {model.emotePickerOpen && !model.gameOver ? (
        <>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEmotePickerOpen(false)} />
          <View style={styles.emotePicker}>
            {EMOTES.map((e) => (
              <Pressable
                key={e}
                style={({ pressed }) => [styles.emoteBtn, pressed && styles.pressed]}
                onPress={() => handleSendEmote(e)}
              >
                <Text style={styles.emoteBtnIcon}>{e}</Text>
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

      <OpponentProgressStrip
        opponentProfile={opponentProfile}
        opponentProgress={opponentProgress as Array<"correct" | "wrong" | TileScore[]>}
        gameType={gameType}
        wordLength={wordLength}
        oppEmote={oppEmote}
        oppY={oppY}
        oppOp={oppOp}
        myEmote={myEmote}
        myY={myY}
        myOp={myOp}
        colors={colors}
      />

      {!gameOver && (
        <TurnTimer
          activePlayerId={activePlayerId}
          userId={user?.id ?? null}
          startSignal={timerStartSignal}
          stopSignal={timerStopSignal}
          colors={colors}
        />
      )}

      {gameType === "wordle" ? (
        <WordleBoard
          guesses={guesses}
          currentGuess={currentGuess}
          guessResults={guessResults as TileScore[][]}
          wordLength={wordLength}
          gameOver={gameOver}
          cellSize={cellSize}
          colors={colors}
        />
      ) : (
        <AndazebiPlayground
          puzzle={puzzle}
          guesses={guesses}
          guessResults={guessResults as Array<"correct" | "wrong">}
          gameOver={gameOver}
          andazebiAnswers={andazebiAnswers}
          activeInputIndex={activeInputIndex}
          setActiveInputIndex={setActiveInputIndex}
          onSubmitGuess={handleSubmitGuess}
          colors={colors}
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
        gameOver={gameOver}
        results={results}
        onLobbyPress={() => router.replace("/lobby")}
        onHomePress={() => router.replace("/")}
        colors={colors}
      />

      <LeaveConfirmOverlay
        visible={leaveModalOpen && !gameOver}
        onConfirm={confirmLeave}
        onCancel={() => setLeaveModalOpen(false)}
        colors={colors}
      />
    </SafeAreaView>
  );
}

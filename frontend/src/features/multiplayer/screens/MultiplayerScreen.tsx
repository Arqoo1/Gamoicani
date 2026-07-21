import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSocket } from "@/application/providers/socket";
import { useAuth } from "@/application/providers/auth";
import { AppColors, useAppTheme } from "@/application/providers/theme";

type RouteParam = string | string[] | undefined;
type MultiplayerPuzzle = {
  gameType?: string;
  hint?: string | null;
  prompt?: string | null;
  missingWordsCount?: number;
  validWords?: string[];
  wordLength?: number;
};

function firstParam(value: RouteParam) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePuzzleParam(value: RouteParam): MultiplayerPuzzle | null {
  const raw = firstParam(value);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MultiplayerPuzzle;
  } catch {
    return null;
  }
}

function getTiles(data: unknown): string[] {
  if (Array.isArray(data)) return data as string[];
  const d = data as Record<string, unknown>;
  return Array.isArray(d?.tiles) ? (d.tiles as string[]) : [];
}

const EMOTES = ["🔥", "🧠", "🎯", "😂", "😤", "👏", "🤬", "🙏"];

const QWERTY_TO_GEORGIAN: Record<string, string> = {
  a: "ა", b: "ბ", c: "ც", d: "დ", e: "ე", f: "ფ", g: "გ", h: "ჰ", i: "ი", j: "ჯ",
  k: "კ", l: "ლ", m: "მ", n: "ნ", o: "ო", p: "პ", q: "ქ", r: "რ", s: "ს", t: "ტ",
  u: "უ", v: "ვ", w: "წ", x: "ხ", y: "ყ", z: "ზ"
};
const SHIFTED_QWERTY_TO_GEORGIAN: Record<string, string> = {
  C: "ჩ", J: "ჟ", R: "ღ", S: "შ", T: "თ", W: "ჭ", Z: "ძ"
};
const SHIFTED_GEORGIAN_KEYS: Record<string, string> = {
  ც: "ჩ", ჯ: "ჟ", რ: "ღ", ს: "შ", ტ: "თ", წ: "ჭ", ზ: "ძ"
};

const BASE_KB_ROWS = [
  ["ქ", "წ", "ე", "რ", "ტ", "ყ", "უ", "ი", "ო", "პ"],
  ["ა", "ს", "დ", "ფ", "გ", "ჰ", "ჯ", "კ", "ლ"],
  ["ზ", "ხ", "ც", "ვ", "ბ", "ნ", "მ", "⌫"]
];

const GEORGIAN_LETTERS = new Set([
  ...BASE_KB_ROWS.flat().filter((key) => key.length === 1),
  ...Object.values(SHIFTED_GEORGIAN_KEYS)
]);

const CELL_GAP   = 5;
const KB_KEY_H   = 42;
const KB_GAP     = 5;
const MINI_SIZE  = 9;
const MINI_GAP   = 3;
const GRID_ROWS  = 6;
const ANDAZEBI_ATTEMPTS = 5;

function triggerFloat(
  animY: Animated.Value,
  animOp: Animated.Value,
  onDone: () => void
) {
  animY.setValue(0);
  animOp.setValue(1);
  Animated.parallel([
    Animated.timing(animY,  { toValue: -60, duration: 1700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    Animated.timing(animOp, { toValue: 0,   duration: 1700, delay: 700, useNativeDriver: true }),
  ]).start(onDone);
}

export default function MultiplayerScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{ roomId?: RouteParam; gameType?: RouteParam; puzzle?: RouteParam; activePlayerId?: RouteParam }>();

  const roomId     = firstParam(params.roomId)    ?? "";
  const gameType   = firstParam(params.gameType)  ?? "wordle";
  const initialActivePlayer = firstParam(params.activePlayerId) || null;
  const puzzle     = useMemo(() => parsePuzzleParam(params.puzzle), [params.puzzle]);
  const wordLength = Math.max(1, Math.min(12, Number(puzzle?.wordLength) || 5));

  const { colors, isDark } = useAppTheme();
  const { socket, opponentProfile } = useSocket();
  const { user } = useAuth();

  const [guesses,          setGuesses]          = useState<string[]>([]);
  const [currentGuess,     setCurrentGuess]     = useState("");
  const [andazebiAnswers,  setAndazebiAnswers]  = useState<string[]>(() => Array(puzzle?.missingWordsCount || 1).fill(""));
  const [activeInputIndex, setActiveInputIndex] = useState(0);
  const [guessResults,     setGuessResults]     = useState<any[]>([]);
  const [opponentProgress, setOpponentProgress] = useState<any[]>([]);
  const [gameOver,         setGameOver]         = useState(false);
  const [results,          setResults]          = useState<Record<string, unknown> | null>(null);
  const [leaveModalOpen,   setLeaveModalOpen]   = useState(false);
  const [activePlayerId, setActivePlayerId] = useState<string | null>(initialActivePlayer);
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTimer = () => {
    setTimeLeft(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const hasStartedTimer = useRef(false);

  // Start timer when user is available if it's our turn
  useEffect(() => {
    if (user && initialActivePlayer && initialActivePlayer === user.id && !hasStartedTimer.current) {
      hasStartedTimer.current = true;
      startTimer();
    }
  }, [user, initialActivePlayer]);

  const isMyTurn = !!socket && !!activePlayerId && !!user && activePlayerId === user.id;
  const waitingForOpponent = !isMyTurn;
  
  const [emotePickerOpen,  setEmotePickerOpen]  = useState(false);
  const [isShifted,        setIsShifted]        = useState(false);

  // ── Floating emotes ─────────────────────────────────────────────────────────
  const [oppEmote, setOppEmote] = useState<string | null>(null);
  const oppY  = useRef(new Animated.Value(0)).current;
  const oppOp = useRef(new Animated.Value(0)).current;

  const [myEmote, setMyEmote] = useState<string | null>(null);
  const myY  = useRef(new Animated.Value(0)).current;
  const myOp = useRef(new Animated.Value(0)).current;

  // ── Layout ──────────────────────────────────────────────────────────────────
  const STATUS_H  = Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) : 0;
  const HEADER_H  = 48;
  const OPP_H     = 74;
  const KB_H      = 3 * KB_KEY_H + 2 * KB_GAP + 10;
  const MARGINS   = 16;

  const availH    = height - STATUS_H - HEADER_H - OPP_H - KB_H - MARGINS;
  const cellFromH = Math.floor((availH - (GRID_ROWS - 1) * CELL_GAP) / GRID_ROWS);
  const cellFromW = Math.floor((width - 32 - (wordLength - 1) * CELL_GAP) / wordLength);
  const cellSize  = Math.min(54, Math.max(30, Math.min(cellFromH, cellFromW)));

  const styles = useMemo(() => createStyles(colors, cellSize), [colors, cellSize]);

  useEffect(() => {
    if (!socket) return;

    const onGuessResult = (data: any) => {
      if (gameType === "wordle") {
        setGuessResults(prev => [...prev, getTiles(data)]);
      } else {
        setGuessResults(prev => [...prev, data.isCorrect ? "correct" : "wrong"]);
      }
    };

    const onOpponentGuess = (data: any) => {
      if (gameType === "wordle") {
        setOpponentProgress(prev => [...prev, getTiles(data)]);
      } else {
        setOpponentProgress(prev => [...prev, data.isCorrect ? "correct" : "wrong"]);
      }
    };
    
    const onGameOver = (data: Record<string, unknown>) => { 
      setGameOver(true); 
      setResults(data); 
    };
    
    

    

    const onTurnTimeout = () => {
      stopTimer();
      if (gameType === "wordle") {
        setGuesses(prev => [...prev, ""]);
        setGuessResults(prev => [...prev, Array(wordLength).fill("absent")]);
      } else {
        setGuesses(prev => [...prev, ""]);
        setGuessResults(prev => [...prev, "wrong"]);
      }
    };

    

    const onReceiveEmote = (data: { emote: string }) => {
      setOppEmote(data.emote);
      triggerFloat(oppY, oppOp, () => setOppEmote(null));
    };

    
    const onGameStart = (data: any) => {
      setActivePlayerId(data.activePlayerId);
      if (user && data.activePlayerId === user.id) {
        startTimer();
      } else {
        stopTimer();
      }
    };
    
    const onTurnChanged = (data: any) => {
      setActivePlayerId(data.activePlayerId);
      if (user && data.activePlayerId === user.id) {
        startTimer();
      } else {
        stopTimer();
      }
    };

    socket.on("game-start", onGameStart);
    socket.on("turn-changed", onTurnChanged);

    socket.on("guess-result",   onGuessResult);
    
    socket.on("turn-timeout", onTurnTimeout);
    socket.on("opponent-guess", onOpponentGuess);
    socket.on("game-over",      onGameOver);
    socket.on("receive-emote",  onReceiveEmote);

    return () => {
      socket.off("guess-result",   onGuessResult);
      socket.off("opponent-guess", onOpponentGuess);
      socket.off("game-over",      onGameOver);
      socket.off("receive-emote",  onReceiveEmote);
      
      socket.off("turn-timeout", onTurnTimeout);
      socket.off("game-start", onGameStart);
      socket.off("turn-changed", onTurnChanged);
      stopTimer();
    };
  }, [socket, oppY, oppOp, gameType, wordLength, user]);

  const handleBackPress = () => {
    if (gameOver) {
      router.replace("/lobby");
    } else {
      setLeaveModalOpen(true);
    }
  };

  const confirmLeave = () => {
    socket?.emit("forfeit");
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
      const qwertyLetter = e.key.length === 1
        ? (e.shiftKey ? SHIFTED_QWERTY_TO_GEORGIAN[e.key.toUpperCase()] : undefined) ?? QWERTY_TO_GEORGIAN[e.key.toLowerCase()]
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

  const sendEmote = (emote: string) => {
    socket?.emit("send-emote", { roomId, emote });
    setEmotePickerOpen(false);
    setMyEmote(emote);
    triggerFloat(myY, myOp, () => setMyEmote(null));
  };

  const submitGuess = () => {
    if (gameOver || waitingForOpponent) return;
    
    if (gameType === "wordle") {
      if (Array.from(currentGuess).length !== wordLength) return;
      socket?.emit("submit-guess", { roomId, guess: currentGuess.trim() });
      setGuesses(prev => [...prev, currentGuess.trim()]);
      setCurrentGuess("");
    } else {
      if (andazebiAnswers.some(ans => ans.trim().length === 0)) return;
      const combinedGuess = andazebiAnswers.join(" ");
      socket?.emit("submit-guess", { roomId, guess: combinedGuess });
      setGuesses(prev => [...prev, combinedGuess]);
      setAndazebiAnswers(Array(puzzle?.missingWordsCount || 1).fill(""));
      setActiveInputIndex(0);
    }
    
    setIsShifted(false);
  };

  const handleKey = (key: string) => {
    if (gameOver) return;
    
    if (key === "⌫") {
      if (gameType === "wordle") {
        setCurrentGuess(prev => Array.from(prev).slice(0, -1).join(""));
      } else {
        setAndazebiAnswers(prev => {
          const next = [...prev];
          next[activeInputIndex] = Array.from(next[activeInputIndex]).slice(0, -1).join("");
          return next;
        });
      }
    } else if (key === "ENTER") {
      submitGuess();
    } else if (key === "SHIFT") {
      setIsShifted(v => !v);
    } else {
      const actualKey = isShifted ? (SHIFTED_GEORGIAN_KEYS[key] ?? key) : key;
      if (gameType === "wordle") {
        if (Array.from(currentGuess).length >= wordLength) return;
        setCurrentGuess(prev => prev + actualKey);
      } else {
        setAndazebiAnswers(prev => {
          const next = [...prev];
          next[activeInputIndex] = next[activeInputIndex] + actualKey;
          return next;
        });
      }
      setIsShifted(false);
    }
  };

  const didWin  = results?.result === "won";
  const didDraw = results?.result === "draw";

  const avatarIcon =
    opponentProfile?.equippedItems?.avatar === "avatar_ninja"  ? "🥷"  :
    opponentProfile?.equippedItems?.avatar === "avatar_wizard" ? "🧙‍♂️" :
    opponentProfile?.equippedItems?.avatar === "avatar_cat"    ? "🐱"  : "👤";

  const gameTitle =
    gameType === "wordle"   ? "სიტყვობანა" :
    gameType === "andazebi" ? "ანდაზები"    : "მატჩი";

  const kbRows = useMemo(() => {
    return BASE_KB_ROWS.map((row) => {
      return row.map(k => isShifted && SHIFTED_GEORGIAN_KEYS[k] ? SHIFTED_GEORGIAN_KEYS[k] : k);
    });
  }, [isShifted]);

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {}
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="უკან"
          onPress={handleBackPress}
          style={({ pressed }) => [styles.hBtn, pressed && styles.pressed]}
        >
          <Feather color={colors.primaryText} name="chevron-left" size={26} />
        </Pressable>

        <Text style={styles.title}>{gameTitle}</Text>

        <Pressable
          accessibilityLabel="ემოჯი"
          style={({ pressed }) => [styles.hBtn, styles.emoteToggle, pressed && styles.pressed]}
          onPress={() => setEmotePickerOpen(v => !v)}
        >
          <Text style={styles.emoteToggleIcon}>😊</Text>
        </Pressable>
      </View>

      {}
      {emotePickerOpen && !gameOver && (
        <>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEmotePickerOpen(false)} />
          <View style={styles.emotePicker}>
            {EMOTES.map(e => (
              <Pressable
                key={e}
                style={({ pressed }) => [styles.emoteBtn, pressed && styles.pressed]}
                onPress={() => sendEmote(e)}
              >
                <Text style={styles.emoteBtnIcon}>{e}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {}
      <View style={styles.oppStrip}>
        {}
        <View style={styles.oppInfo}>
          <View style={[styles.oppAvatar, { backgroundColor: colors.button }]}>
            <Text style={styles.oppAvatarIcon}>{avatarIcon}</Text>
          </View>
          <Text style={styles.oppName} numberOfLines={1}>
            {opponentProfile?.displayName ?? "მოწინ."}
          </Text>
        </View>

        {}
        <View style={styles.miniGrid}>
          {gameType === "wordle" ? (
            Array.from({ length: GRID_ROWS }).map((_, rIdx) => {
              const row = opponentProgress[rIdx];
              return (
                <View key={rIdx} style={styles.miniRow}>
                  {Array.from({ length: wordLength }).map((_, cIdx) => {
                    const s  = row?.[cIdx];
                    const bg =
                      s === "correct" ? colors.correct :
                      s === "present" ? colors.present :
                      s === "absent"  ? colors.absent  : colors.button;
                    return <View key={cIdx} style={[styles.miniCell, { backgroundColor: bg }]} />;
                  })}
                </View>
              );
            })
          ) : (
            
            <View style={styles.miniRow}>
              {Array.from({ length: ANDAZEBI_ATTEMPTS }).map((_, rIdx) => {
                const s = opponentProgress[rIdx];
                const bg = 
                  s === "correct" ? colors.correct :
                  s === "wrong"   ? colors.absent : colors.button;
                return <View key={rIdx} style={[styles.miniCircle, { backgroundColor: bg }]} />;
              })}
            </View>
          )}
        </View>

        <View style={styles.vsContainer}>
          <Text style={styles.vsLabel}>VS</Text>
        </View>

        {}
        {oppEmote && (
          <Animated.Text style={[styles.floatEmote, styles.floatLeft,  { opacity: oppOp, transform: [{ translateY: oppY }] }]}>
            {oppEmote}
          </Animated.Text>
        )}
        {myEmote && (
          <Animated.Text style={[styles.floatEmote, styles.floatRight, { opacity: myOp,  transform: [{ translateY: myY  }] }]}>
            {myEmote}
          </Animated.Text>
        )}
      </View>

      {!gameOver && (
        <View style={styles.turnBanner}>
          {waitingForOpponent ? (
            <Text style={styles.waitingText}>⏳ მოწინააღმდეგეს ველოდებით...</Text>
          ) : (
            <Text style={styles.timerText}>⏱ {timeLeft} წამი</Text>
          )}
        </View>
      )}

      {}
      <View style={styles.myGrid}>
        {gameType === "wordle" ? (
          
          Array.from({ length: GRID_ROWS }).map((_, rIdx) => {
            const isCurrent = rIdx === guesses.length && !gameOver;
            const word      = isCurrent ? currentGuess : (guesses[rIdx] ?? "");
            const result    = guessResults[rIdx];
            const letters   = Array.from(word);

            return (
              <View key={rIdx} style={styles.gridRow}>
                {Array.from({ length: wordLength }).map((_, cIdx) => {
                  const letter = letters[cIdx] ?? "";
                  const status = result?.[cIdx];
                  const bg =
                    status === "correct" ? colors.correct :
                    status === "present" ? colors.present :
                    status === "absent"  ? colors.absent  : colors.card;
                  const border = result ? bg : letter ? colors.secondaryText : colors.border;

                  return (
                    <View key={cIdx} style={[styles.gridCell, { backgroundColor: bg, borderColor: border }]}>
                      <Text style={[styles.cellLetter, !!result && styles.cellLetterWhite]}>
                        {letter}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          })
        ) : (
          
          <View style={styles.andazebiContainer}>
            <View style={styles.promptCard}>
              <Text style={styles.promptText}>{puzzle?.prompt}</Text>
              {puzzle?.hint && (
                <Text style={styles.hintText}>მინიშნება: {puzzle.hint}</Text>
              )}
            </View>

            {}
            <View style={styles.historyContainer}>
              {guesses.map((g, i) => (
                <View key={i} style={[styles.historyBadge, guessResults[i] === "correct" ? styles.historyCorrect : styles.historyWrong]}>
                  <Text style={[styles.historyText, guessResults[i] === "correct" && styles.cellLetterWhite]}>
                    {g} {guessResults[i] === "correct" ? "✓" : "✗"}
                  </Text>
                </View>
              ))}
            </View>

            {}
            {!gameOver && (
              <>
                <View style={styles.andazebiInputContainer}>
                  {andazebiAnswers.map((answer, index) => (
                    <Pressable 
                      key={index} 
                      style={[
                        styles.andazebiInputBox, 
                        activeInputIndex === index && styles.andazebiInputBoxActive
                      ]}
                      onPress={() => setActiveInputIndex(index)}
                    >
                      <Text style={[
                        styles.andazebiInputBoxText,
                        activeInputIndex === index && styles.andazebiInputBoxTextActive
                      ]}>
                        {answer || "_"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                  onPress={submitGuess}
                >
                  <Text style={styles.primaryBtnText}>შემოწმება</Text>
                </Pressable>
              </>
            )}
          </View>
        )}
      </View>

      {}
      <View style={styles.keyboard}>
        <View style={styles.kbRow}>
          {kbRows[0].map(key => (
            <Pressable
              key={key}
              style={({ pressed }) => [
                styles.kbKey,
                pressed && styles.pressed
              ]}
              onPress={() => handleKey(key)}
            >
              <Text style={styles.kbKeyText}>{key}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.kbRow}>
          <Pressable
            style={({ pressed }) => [
              styles.kbKey,
              styles.kbShift,
              isShifted && styles.kbShiftActive,
              pressed && styles.pressed
            ]}
            onPress={() => handleKey("SHIFT")}
          >
            <Text style={[
              styles.kbKeyText,
              styles.kbSpecialText,
              isShifted && styles.kbShiftActiveText
            ]}>⇧</Text>
          </Pressable>
          {kbRows[1].map(key => (
            <Pressable
              key={key}
              style={({ pressed }) => [
                styles.kbKey,
                pressed && styles.pressed
              ]}
              onPress={() => handleKey(key)}
            >
              <Text style={styles.kbKeyText}>{key}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.kbRow}>
          <Pressable
            style={({ pressed }) => [
              styles.kbKey,
              styles.kbEnter,
              pressed && styles.pressed
            ]}
            onPress={() => handleKey("ENTER")}
          >
            <Text style={[styles.kbKeyText, styles.kbSpecialText]}>ENTER</Text>
          </Pressable>
          {kbRows[2].map(key => (
            <Pressable
              key={key}
              style={({ pressed }) => [
                styles.kbKey,
                key === "⌫" && styles.kbDel,
                pressed && styles.pressed
              ]}
              onPress={() => handleKey(key)}
            >
              <Text style={[
                styles.kbKeyText,
                key === "⌫" && styles.kbSpecialText
              ]}>{key}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {}
      {gameOver && results && (
        <View style={styles.overlay}>
          <View style={styles.resultCard}>
            <Text style={styles.resultEmoji}>{didWin ? "🏆" : didDraw ? "🤝" : "😢"}</Text>
            <Text style={styles.resultTitle}>{didWin ? "მოიგე!" : didDraw ? "ფრე!" : "წააგე"}</Text>
            {typeof results.answer === "string" && (
              <Text style={styles.resultAnswer}>სწორია: {results.answer}</Text>
            )}
            <View style={styles.resultActions}>
              <Pressable style={styles.primaryBtn} onPress={() => router.replace("/lobby")}>
                <Text style={styles.primaryBtnText}>კვლავ თამაში</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => router.replace("/")}>
                <Text style={styles.secondaryBtnText}>მთავარი</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {leaveModalOpen && !gameOver && (
        <View style={styles.overlay}>
          <View style={styles.resultCard}>
            <Text style={styles.resultEmoji}>🚪</Text>
            <Text style={styles.resultTitle}>ნამდვილად გადიხარ?</Text>
            <Text style={styles.resultAnswer}>თუ გახვალ, ავტომატურად წააგებ.</Text>
            <View style={styles.resultActions}>
              <Pressable style={styles.primaryBtn} onPress={confirmLeave}>
                <Text style={styles.primaryBtnText}>დიახ, გასვლა</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => setLeaveModalOpen(false)}>
                <Text style={styles.secondaryBtnText}>არა, გაგრძელება</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors, cellSize: number) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },

    header:      { alignItems: "center", flexDirection: "row", height: 48, justifyContent: "space-between", paddingHorizontal: 8 },
    hBtn:        { alignItems: "center", height: 40, justifyContent: "center", width: 40 },
    title:       { color: colors.primaryText, fontSize: 17, fontWeight: "900" },
    pressed:     { opacity: 0.65 },
    emoteToggle: { backgroundColor: colors.button, borderRadius: 20 },
    emoteToggleIcon: { fontSize: 20 },

    emotePicker: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      elevation: 12,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      padding: 10,
      position: "absolute",
      right: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      top: 52,
      width: 200,
      zIndex: 999,
    },
    emoteBtn:     { alignItems: "center", backgroundColor: colors.button, borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
    emoteBtnIcon: { fontSize: 24 },

    oppStrip: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderColor: colors.border,
      borderTopWidth: 1,
      flexDirection: "row",
      gap: 10,
      height: 74,
      overflow: "visible",
      paddingHorizontal: 12,
      paddingVertical: 8,
      position: "relative",
    },
    oppInfo:     { alignItems: "center", gap: 3, width: 52 },
    oppAvatar:   { alignItems: "center", borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
    oppAvatarIcon: { fontSize: 18 },
    oppName:     { color: colors.secondaryText, fontSize: 10, fontWeight: "700", textAlign: "center" },
    vsContainer: { width: 52, alignItems: "center", justifyContent: "center" },
    vsLabel:     { color: colors.secondaryText, fontSize: 11, fontWeight: "900", letterSpacing: 1 },

    miniGrid: { flex: 1, gap: MINI_GAP, justifyContent: "center", alignItems: "center" },
    miniRow:  { flexDirection: "row", gap: MINI_GAP },
    miniCell: { borderRadius: 2, height: MINI_SIZE, width: MINI_SIZE },
    miniCircle: { borderRadius: 6, height: 12, width: 12 },
    turnBanner: { paddingVertical: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border },
    waitingText: { color: colors.secondaryText, fontSize: 13, fontWeight: "700" },
    timerText: { color: colors.primaryText, fontSize: 15, fontWeight: "800" },

    floatEmote:  { elevation: 30, fontSize: 36, position: "absolute", top: 4, zIndex: 30 },
    floatLeft:   { left: 10 },
    floatRight:  { right: 10 },

    myGrid:    { alignItems: "center", flex: 1, gap: CELL_GAP, justifyContent: "center", paddingHorizontal: 16 },
    gridRow:   { flexDirection: "row", gap: CELL_GAP },
    gridCell:  { alignItems: "center", borderRadius: 5, borderWidth: 2, height: cellSize, justifyContent: "center", width: cellSize },
    cellLetter:      { color: colors.primaryText, fontSize: Math.round(cellSize * 0.5), fontWeight: "900" },
    cellLetterWhite: { color: "#ffffff" },

    andazebiContainer: { flex: 1, width: "100%", justifyContent: "center", gap: 20 },
    promptCard: { backgroundColor: colors.card, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: colors.border, elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
    promptText: { fontSize: 20, color: colors.primaryText, fontWeight: "800", textAlign: "center", lineHeight: 28 },
    hintText:   { fontSize: 14, color: colors.secondaryText, fontWeight: "600", textAlign: "center", marginTop: 12 },
    historyContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
    historyBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    historyCorrect: { backgroundColor: colors.correct, borderColor: colors.correct },
    historyWrong:   { backgroundColor: colors.absent, borderColor: colors.absent },
    historyText:    { color: colors.primaryText, fontSize: 14, fontWeight: "700" },
    andazebiInputContainer: { flexDirection: "row", gap: 10, justifyContent: "center", flexWrap: "wrap", marginVertical: 8 },
    andazebiInputBox: { backgroundColor: colors.background, borderWidth: 2, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, minWidth: 60, alignItems: "center" },
    andazebiInputBoxActive: { borderColor: colors.accent },
    andazebiInputBoxText: { fontSize: 20, color: colors.secondaryText, fontWeight: "700" },
    andazebiInputBoxTextActive: { color: colors.primaryText, fontWeight: "900" },

    keyboard:     { gap: KB_GAP, paddingBottom: 10, paddingHorizontal: 4 },
    kbRow:        { flexDirection: "row", gap: 4, justifyContent: "center" },
    kbKey:        { alignItems: "center", backgroundColor: colors.key, borderRadius: 5, flex: 1, height: KB_KEY_H, justifyContent: "center", maxWidth: 36 },
    kbEnter:      { flex: 1.7, maxWidth: 58 },
    kbDel:        { flex: 1.3, maxWidth: 46 },
    kbShift:      { flex: 1.2, maxWidth: 42 },
    kbShiftActive: { backgroundColor: colors.accent },
    kbShiftActiveText: { color: "#fff" },
    kbSpace:      { flex: 4, maxWidth: 200 },
    kbKeyText:    { color: colors.primaryText, fontSize: 15, fontWeight: "800" },
    kbSpecialText:{ fontSize: 11 },

    overlay:       { ...StyleSheet.absoluteFill, alignItems: "center", backgroundColor: colors.overlay, justifyContent: "center", padding: 24, zIndex: 200 },
    resultCard:    { alignItems: "center", backgroundColor: colors.card, borderRadius: 20, elevation: 12, maxWidth: 320, padding: 28, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, width: "100%" },
    resultEmoji:   { fontSize: 52, marginBottom: 4 },
    resultTitle:   { color: colors.primaryText, fontSize: 28, fontWeight: "900", marginBottom: 8, textAlign: "center" },
    resultAnswer:  { color: colors.secondaryText, fontSize: 16, fontWeight: "700", marginBottom: 20, textAlign: "center" },
    resultActions: { gap: 10, width: "100%" },
    primaryBtn:    { alignItems: "center", backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14 },
    primaryBtnText:{ color: "#fff", fontSize: 16, fontWeight: "900" },
    secondaryBtn:  { alignItems: "center", backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, paddingVertical: 14 },
    secondaryBtnText: { color: colors.primaryText, fontSize: 16, fontWeight: "800" },
  });
}

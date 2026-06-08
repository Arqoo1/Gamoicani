import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSocket } from "../src/socket";
import { AppColors, useAppTheme } from "../src/theme";

export default function LobbyScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { socket, isConnected } = useSocket();

  const [gameType, setGameType] = useState<"wordle" | "andazebi" | "mix">("wordle");
  
  // Status states
  const [status, setStatus] = useState<"idle" | "public-queue" | "private-hosting" | "private-joining">("idle");
  const [passcode, setPasscode] = useState("");
  const [inputPasscode, setInputPasscode] = useState("");

  useEffect(() => {
    if (!socket) return;

    function onQueueJoined() {
      setStatus("public-queue");
    }

    function onRoomCreated({ roomId, passcode }: { roomId: string; passcode: string }) {
      setPasscode(passcode);
      setStatus("private-hosting");
    }

    function onRoomJoined({ roomId, players }: { roomId: string; players: any[] }) {
      // Transition to playing state - wait for game-start event
    }

    function onGameStart({ gameType, puzzle, roomId }: any) {
      // Navigate to multiplayer game screen
      router.push({
        pathname: "/multiplayer",
        params: { roomId, gameType, puzzle: JSON.stringify(puzzle) }
      });
    }

    function onErrorMessage({ message }: { message: string }) {
      Alert.alert("შეცდომა", message);
      setStatus("idle");
    }

    socket.on("queue-joined", onQueueJoined);
    socket.on("room-created", onRoomCreated);
    socket.on("room-joined", onRoomJoined);
    socket.on("game-start", onGameStart);
    socket.on("error-message", onErrorMessage);

    return () => {
      socket.off("queue-joined", onQueueJoined);
      socket.off("room-created", onRoomCreated);
      socket.off("room-joined", onRoomJoined);
      socket.off("game-start", onGameStart);
      socket.off("error-message", onErrorMessage);
    };
  }, [socket, router]);

  const joinPublic = () => {
    if (!socket || !isConnected) return Alert.alert("შეცდომა", "სერვერთან კავშირი ვერ მოხერხდა");
    socket.emit("join-public-queue", { gameType });
    setStatus("public-queue"); // optimistic update
  };

  const createPrivate = () => {
    if (!socket || !isConnected) return Alert.alert("შეცდომა", "სერვერთან კავშირი ვერ მოხერხდა");
    socket.emit("create-private-room", { gameType });
  };

  const joinPrivate = () => {
    if (!socket || !isConnected) return Alert.alert("შეცდომა", "სერვერთან კავშირი ვერ მოხერხდა");
    if (!inputPasscode || inputPasscode.length !== 4) return Alert.alert("შეცდომა", "შეიყვანეთ 4 ნიშნა კოდი");
    socket.emit("join-private-room", { passcode: inputPasscode });
    setStatus("private-joining");
  };

  const cancelAction = () => {
    if (status === "public-queue" && socket) {
      socket.emit("leave-queue");
    }
    // Also handle leaving private room if needed
    setStatus("idle");
  };

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="უკან დაბრუნება"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Feather color={colors.primaryText} name="chevron-left" size={28} />
        </Pressable>
        <Text style={styles.title}>მულტიპლეერი</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!isConnected ? (
          <View style={styles.connectingBox}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.connectingText}>ვუკავშირდებით სერვერს...</Text>
          </View>
        ) : status === "idle" ? (
          <>
            <Text style={styles.sectionLabel}>აირჩიეთ თამაში:</Text>
            <View style={styles.typeSelector}>
              {(["wordle", "andazebi", "mix"] as const).map((type) => {
                const labels = { wordle: "სიტყვობანა", andazebi: "ანდაზები", mix: "მიქსი" };
                const isActive = gameType === type;
                return (
                  <Pressable
                    key={type}
                    style={[styles.typePill, isActive && styles.typePillActive]}
                    onPress={() => setGameType(type)}
                  >
                    <Text style={[styles.typeText, isActive && styles.typeTextActive]}>{labels[type]}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.spacer} />

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              onPress={joinPublic}
            >
              <Feather name="globe" size={24} color="#fff" />
              <Text style={styles.primaryBtnText}>საჯარო მატჩი</Text>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ან</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.privateBox}>
              <Text style={styles.privateLabel}>პრივატული ოთახი</Text>
              <View style={styles.privateActions}>
                <Pressable
                  style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                  onPress={createPrivate}
                >
                  <Feather name="plus-circle" size={20} color={colors.primaryText} />
                  <Text style={styles.secondaryBtnText}>შექმნა</Text>
                </Pressable>

                <View style={styles.joinBox}>
                  <TextInput
                    style={styles.input}
                    placeholder="კოდი"
                    placeholderTextColor={colors.secondaryText}
                    value={inputPasscode}
                    onChangeText={setInputPasscode}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                  <Pressable
                    style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed, { flex: 0, paddingHorizontal: 16 }]}
                    onPress={joinPrivate}
                  >
                    <Text style={styles.secondaryBtnText}>შესვლა</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.waitingBox}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.waitingText}>
              {status === "public-queue" ? "ვეძებთ მოწინააღმდეგეს..." : 
               status === "private-joining" ? "ვუერთდებით ოთახს..." : "ველოდებით მეგობარს..."}
            </Text>

            {status === "private-hosting" && (
              <View style={styles.passcodeBox}>
                <Text style={styles.passcodeLabel}>თქვენი კოდია:</Text>
                <Text style={styles.passcodeValue}>{passcode}</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
              onPress={cancelAction}
            >
              <Text style={styles.cancelBtnText}>გაუქმება</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 12
    },
    backBtn: {
      alignItems: "center",
      height: 44,
      justifyContent: "center",
      width: 44
    },
    title: {
      color: colors.primaryText,
      fontSize: 18,
      fontWeight: "900"
    },
    pressed: {
      opacity: 0.7
    },
    content: {
      padding: 24,
      paddingTop: 12
    },
    connectingBox: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      marginTop: 60,
      gap: 16
    },
    connectingText: {
      color: colors.secondaryText,
      fontSize: 16,
      fontWeight: "600"
    },
    sectionLabel: {
      color: colors.primaryText,
      fontSize: 18,
      fontWeight: "800",
      marginBottom: 12
    },
    typeSelector: {
      flexDirection: "row",
      gap: 8
    },
    typePill: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 2,
      flex: 1,
      paddingVertical: 12,
      alignItems: "center"
    },
    typePillActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accent + "1A"
    },
    typeText: {
      color: colors.secondaryText,
      fontSize: 14,
      fontWeight: "800"
    },
    typeTextActive: {
      color: colors.accent
    },
    spacer: {
      height: 32
    },
    primaryBtn: {
      backgroundColor: colors.accent,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 18,
      gap: 12,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4
    },
    primaryBtnText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "900"
    },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 32,
      gap: 16
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border
    },
    dividerText: {
      color: colors.secondaryText,
      fontSize: 14,
      fontWeight: "700"
    },
    privateBox: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      padding: 20,
      gap: 16
    },
    privateLabel: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: "800"
    },
    privateActions: {
      gap: 12
    },
    secondaryBtn: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      gap: 8
    },
    secondaryBtnText: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: "700"
    },
    joinBox: {
      flexDirection: "row",
      gap: 8
    },
    input: {
      flex: 1,
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      color: colors.primaryText,
      fontSize: 18,
      fontWeight: "800",
      paddingHorizontal: 16,
      textAlign: "center",
      letterSpacing: 4
    },
    waitingBox: {
      alignItems: "center",
      marginTop: 40,
      gap: 24
    },
    waitingText: {
      color: colors.primaryText,
      fontSize: 18,
      fontWeight: "800"
    },
    passcodeBox: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.accent,
      borderRadius: 16,
      borderWidth: 2,
      padding: 24,
      width: "100%"
    },
    passcodeLabel: {
      color: colors.secondaryText,
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 8
    },
    passcodeValue: {
      color: colors.primaryText,
      fontSize: 48,
      fontWeight: "900",
      letterSpacing: 8
    },
    cancelBtn: {
      paddingVertical: 12,
      paddingHorizontal: 24
    },
    cancelBtnText: {
      color: colors.secondaryText,
      fontSize: 16,
      fontWeight: "700"
    }
  });
}

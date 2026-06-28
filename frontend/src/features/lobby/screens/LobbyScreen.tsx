import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/application/providers/auth";
import { useSocket } from "@/application/providers/socket";
import { AppColors, useAppTheme } from "@/application/providers/theme";
import { sendFriendRequest } from "@/features/social/api/friendsApi";

type ChatMessage = {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  text: string;
  timestamp: number;
};

type LobbyTab = "match" | "chat";

export default function LobbyScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<LobbyTab>("match");
  const [gameType, setGameType] = useState<"wordle" | "andazebi" | "mix">("wordle");

  const [status, setStatus] = useState<"idle" | "public-queue" | "private-hosting" | "private-joining">("idle");
  const [passcode, setPasscode] = useState("");
  const [inputPasscode, setInputPasscode] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [unread, setUnread] = useState(0);
  const chatScrollRef = useRef<ScrollView>(null);
  
  const [selectedUser, setSelectedUser] = useState<{ id: string, displayName: string, username: string } | null>(null);
  const [friendRequestStatus, setFriendRequestStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  useEffect(() => {
    if (!socket) return;

    function onQueueJoined() { setStatus("public-queue"); }

    function onRoomCreated({ roomId, passcode }: { roomId: string; passcode: string }) {
      setPasscode(passcode);
      setStatus("private-hosting");
    }

    function onRoomJoined({ roomId, players }: { roomId: string; players: any[] }) {}

    function onGameStart({ gameType, puzzle, roomId }: any) {
      router.push({
        pathname: "/multiplayer",
        params: { roomId, gameType, puzzle: JSON.stringify(puzzle) }
      });
    }

    function onErrorMessage({ message }: { message: string }) {
      Alert.alert("შეცდომა", message);
      setStatus("idle");
    }

    function onChatMessage(msg: ChatMessage) {
      setMessages((prev) => [...prev.slice(-99), msg]);
      if (activeTab !== "chat") setUnread((n) => n + 1);
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }

    socket.on("queue-joined", onQueueJoined);
    socket.on("room-created", onRoomCreated);
    socket.on("room-joined", onRoomJoined);
    socket.on("game-start", onGameStart);
    socket.on("error-message", onErrorMessage);
    socket.on("chat-message", onChatMessage);

    return () => {
      socket.off("queue-joined", onQueueJoined);
      socket.off("room-created", onRoomCreated);
      socket.off("room-joined", onRoomJoined);
      socket.off("game-start", onGameStart);
      socket.off("error-message", onErrorMessage);
      socket.off("chat-message", onChatMessage);
    };
  }, [socket, router, activeTab]);

  const joinPublic = () => {
    if (!socket || !isConnected) return Alert.alert("შეცდომა", "სერვერთან კავშირი ვერ მოხერხდა");
    socket.emit("join-public-queue", { gameType });
    setStatus("public-queue");
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
    if (status === "public-queue" && socket) socket.emit("leave-queue");
    setStatus("idle");
  };

  const sendChat = () => {
    if (!socket || !chatInput.trim()) return;
    socket.emit("chat-send", { text: chatInput.trim() });
    setChatInput("");
  };

  const switchToChat = () => {
    setActiveTab("chat");
    setUnread(0);
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: false }), 100);
  };

  function formatTime(ts: number) {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  }

  function getInitials(name: string) {
    return name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");
  }

  const handleAddFriend = async () => {
    if (!selectedUser) return;
    setFriendRequestStatus("loading");
    try {
      await sendFriendRequest(selectedUser.id);
      setFriendRequestStatus("sent");
      Alert.alert("მოთხოვნა გაიგზავნა", `${selectedUser.displayName}-ს მეგობრობის მოთხოვნა გაეგზავნა.`);
    } catch (e: any) {
      setFriendRequestStatus("error");
      Alert.alert("შეცდომა", e.message ?? "მოთხოვნა ვერ გაიგზავნა.");
    }
  };

  const avatarColors = ["#2f9e5d","#48c978","#2176ae","#9b5de5","#e63946","#f77f00","#dfb34a"];
  function getUserColor(username: string) {
    let hash = 0;
    for (const ch of username) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return avatarColors[hash % avatarColors.length];
  }

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

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabBtn, activeTab === "match" && styles.tabBtnActive]}
          onPress={() => setActiveTab("match")}
        >
          <Feather name="crosshair" size={16} color={activeTab === "match" ? colors.accent : colors.secondaryText} />
          <Text style={[styles.tabBtnText, activeTab === "match" && styles.tabBtnTextActive]}>მატჩი</Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, activeTab === "chat" && styles.tabBtnActive]}
          onPress={switchToChat}
        >
          <Feather name="message-circle" size={16} color={activeTab === "chat" ? colors.accent : colors.secondaryText} />
          <Text style={[styles.tabBtnText, activeTab === "chat" && styles.tabBtnTextActive]}>ჩათი</Text>
          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {activeTab === "match" ? (
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
              {gameType === "mix" && (
                <View style={styles.mixHint}>
                  <Text style={styles.mixHintText}>🔀 3 რაუნდი: სიტყვობანა → ანდაზები → სიტყვობანა</Text>
                </View>
              )}

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
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={chatScrollRef}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 ? (
              <View style={styles.chatEmpty}>
                <Text style={styles.chatEmptyText}>💬 ჯერ შეტყობინება არ არის. იყავი პირველი!</Text>
              </View>
            ) : (
              messages.map((msg) => {
                const isMe = msg.userId === user?.id;
                const initials = getInitials(msg.displayName);
                const avatarBg = getUserColor(msg.username);
                return (
                  <Pressable 
                    key={msg.id} 
                    style={[styles.msgRow, isMe && styles.msgRowMe]}
                    onPress={() => {
                      if (!isMe) {
                        setSelectedUser({ id: msg.userId, displayName: msg.displayName, username: msg.username });
                        setFriendRequestStatus("idle");
                      }
                    }}
                  >
                    {!isMe && (
                      <View style={[styles.msgAvatar, { backgroundColor: avatarBg }]}>
                        <Text style={styles.msgAvatarText}>{initials}</Text>
                      </View>
                    )}
                    <View style={[styles.msgBubble, isMe && styles.msgBubbleMe]}>
                      {!isMe && <Text style={styles.msgName}>{msg.displayName}</Text>}
                      <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{msg.text}</Text>
                      <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>{formatTime(msg.timestamp)}</Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              placeholder="შეტყობინება..."
              placeholderTextColor={colors.secondaryText}
              value={chatInput}
              onChangeText={setChatInput}
              maxLength={200}
              multiline={false}
              returnKeyType="send"
              onSubmitEditing={sendChat}
            />
            <Pressable
              onPress={sendChat}
              style={({ pressed }) => [styles.sendBtn, pressed && styles.pressed]}
              disabled={!chatInput.trim()}
            >
              <Feather name="send" size={20} color="#fff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Profile Modal */}
      <Modal
        visible={!!selectedUser}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedUser(null)}
      >
        <Pressable style={styles.profileModalBackdrop} onPress={() => setSelectedUser(null)}>
          <Pressable style={styles.profileModalCard} onPress={() => {}}>
            <View style={[styles.profileBanner, { backgroundColor: colors.accent + "44" }]} />
            <View style={[styles.profileAvatarBox, { backgroundColor: getUserColor(selectedUser?.username || "") }]}>
              <Text style={styles.profileAvatarText}>{getInitials(selectedUser?.displayName || "U")}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{selectedUser?.displayName}</Text>
              <Text style={styles.profileUsername}>@{selectedUser?.username}</Text>
            </View>
            <View style={styles.profileActions}>
              <Pressable
                style={({ pressed }) => [styles.profileBtnClose, pressed && styles.pressed]}
                onPress={() => setSelectedUser(null)}
              >
                <Text style={styles.profileBtnCloseText}>დახურვა</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.profileBtnAdd,
                  (pressed || friendRequestStatus === "loading" || friendRequestStatus === "sent") && styles.pressed,
                  friendRequestStatus === "sent" && { backgroundColor: colors.correct }
                ]}
                onPress={handleAddFriend}
                disabled={friendRequestStatus === "loading" || friendRequestStatus === "sent"}
              >
                {friendRequestStatus === "loading" ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Feather name={friendRequestStatus === "sent" ? "check" : "user-plus"} size={16} color="#fff" />
                    <Text style={styles.profileBtnAddText}>
                      {friendRequestStatus === "sent" ? "გაიგზავნა" : "დამატება"}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background , paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) : 0 },
    header: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    backBtn: { alignItems: "center", height: 44, justifyContent: "center", width: 44 },
    title: { color: colors.primaryText, fontSize: 18, fontWeight: "900" },
    pressed: { opacity: 0.7 },
    tabBar: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 16,
    },
    tabBtn: {
      alignItems: "center",
      flexDirection: "row",
      gap: 6,
      paddingBottom: 12,
      paddingHorizontal: 12,
      paddingTop: 4,
      position: "relative",
    },
    tabBtnActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.accent,
    },
    tabBtnText: { color: colors.secondaryText, fontSize: 14, fontWeight: "800" },
    tabBtnTextActive: { color: colors.accent },
    badge: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    badgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },
    content: { padding: 24, paddingTop: 12 },
    connectingBox: { alignItems: "center", flex: 1, justifyContent: "center", marginTop: 60, gap: 16 },
    connectingText: { color: colors.secondaryText, fontSize: 16, fontWeight: "600" },
    sectionLabel: { color: colors.primaryText, fontSize: 18, fontWeight: "800", marginBottom: 12 },
    typeSelector: { flexDirection: "row", gap: 8 },
    typePill: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 2,
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
    },
    typePillActive: { borderColor: colors.accent, backgroundColor: colors.accent + "1A" },
    typeText: { color: colors.secondaryText, fontSize: 14, fontWeight: "800" },
    typeTextActive: { color: colors.accent },
    mixHint: {
      backgroundColor: colors.accent + "15",
      borderRadius: 10,
      marginTop: 10,
      padding: 10,
      alignItems: "center",
    },
    mixHintText: { color: colors.accent, fontSize: 13, fontWeight: "700" },
    spacer: { height: 32 },
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
      elevation: 4,
    },
    primaryBtnText: { color: "#fff", fontSize: 18, fontWeight: "900" },
    divider: { flexDirection: "row", alignItems: "center", marginVertical: 32, gap: 16 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { color: colors.secondaryText, fontSize: 14, fontWeight: "700" },
    privateBox: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      padding: 20,
      gap: 16,
    },
    privateLabel: { color: colors.primaryText, fontSize: 16, fontWeight: "800" },
    privateActions: { gap: 12 },
    secondaryBtn: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      gap: 8,
    },
    secondaryBtnText: { color: colors.primaryText, fontSize: 16, fontWeight: "700" },
    joinBox: { flexDirection: "row", gap: 8 },
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
      letterSpacing: 4,
    },
    waitingBox: { alignItems: "center", marginTop: 40, gap: 24 },
    waitingText: { color: colors.primaryText, fontSize: 18, fontWeight: "800" },
    passcodeBox: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.accent,
      borderRadius: 16,
      borderWidth: 2,
      padding: 24,
      width: "100%",
    },
    passcodeLabel: { color: colors.secondaryText, fontSize: 14, fontWeight: "700", marginBottom: 8 },
    passcodeValue: { color: colors.primaryText, fontSize: 48, fontWeight: "900", letterSpacing: 8 },
    cancelBtn: { paddingVertical: 12, paddingHorizontal: 24 },
    cancelBtnText: { color: colors.secondaryText, fontSize: 16, fontWeight: "700" },
    chatContent: { padding: 12, flexGrow: 1 },
    chatEmpty: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 80 },
    chatEmptyText: { color: colors.secondaryText, fontSize: 15, fontWeight: "600", textAlign: "center" },
    msgRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 10, gap: 8 },
    msgRowMe: { flexDirection: "row-reverse" },
    msgAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    msgAvatarText: { color: "#fff", fontSize: 12, fontWeight: "900" },
    msgBubble: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 16,
      borderBottomLeftRadius: 4,
      maxWidth: "75%",
      padding: 10,
    },
    msgBubbleMe: {
      backgroundColor: colors.accent + "22",
      borderColor: colors.accent,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 4,
    },
    msgName: { color: colors.accent, fontSize: 11, fontWeight: "800", marginBottom: 2 },
    msgText: { color: colors.primaryText, fontSize: 14, fontWeight: "600" },
    msgTextMe: { color: colors.primaryText },
    msgTime: { color: colors.secondaryText, fontSize: 10, fontWeight: "600", marginTop: 4, textAlign: "left" },
    msgTimeMe: { textAlign: "right" },
    chatInputRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    chatInput: {
      flex: 1,
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 22,
      borderWidth: 1,
      color: colors.primaryText,
      fontSize: 15,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    sendBtn: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 22,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    profileModalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    profileModalCard: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: Platform.OS === "ios" ? 40 : 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 20,
    },
    profileBanner: {
      height: 80,
      width: "100%",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    profileAvatarBox: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      position: "absolute",
      top: 44,
      left: 24,
      borderWidth: 4,
      borderColor: colors.card,
    },
    profileAvatarText: { color: "#fff", fontSize: 28, fontWeight: "900" },
    profileInfo: {
      marginTop: 44,
      paddingHorizontal: 24,
    },
    profileName: { color: colors.primaryText, fontSize: 20, fontWeight: "900" },
    profileUsername: { color: colors.secondaryText, fontSize: 14, fontWeight: "700", marginTop: 2 },
    profileActions: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 24,
      marginTop: 24,
    },
    profileBtnClose: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    profileBtnCloseText: { color: colors.primaryText, fontSize: 15, fontWeight: "800" },
    profileBtnAdd: {
      flex: 2,
      backgroundColor: colors.accent,
      paddingVertical: 14,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    profileBtnAddText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  });
}

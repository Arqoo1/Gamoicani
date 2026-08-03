import { Feather } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppColors } from "@/application/providers/theme";
import { AuthUser } from "@/entities/user/types";
import { getInitials, getUserColor } from "@/shared/utils/avatar";
import { createStyles } from "@/features/lobby/components/ChatPane.styles";

type ChatMessage = {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  text: string;
  timestamp: number;
};

interface ChatPaneProps {
  messages: ChatMessage[];
  chatInput: string;
  setChatInput: (val: string) => void;
  sendChat: () => void;
  user: AuthUser | null;
  onSelectUser: (user: { id: string; displayName: string; username: string }) => void;
  colors: AppColors;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function ChatPane({
  messages,
  chatInput,
  setChatInput,
  sendChat,
  user,
  onSelectUser,
  colors,
}: ChatPaneProps) {
  const chatScrollRef = useRef<ScrollView>(null);
  const styles = createStyles(colors);

  return (
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
                    onSelectUser({ id: msg.userId, displayName: msg.displayName, username: msg.username });
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
          style={({ pressed }) => [
            styles.sendBtn,
            pressed && styles.pressed,
            !chatInput.trim() && styles.disabledBtn,
          ]}
          disabled={!chatInput.trim()}
        >
          <Feather name="send" size={20} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

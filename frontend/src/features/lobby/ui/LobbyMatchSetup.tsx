import { Feather } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AppColors } from "@/application/providers/theme";
import { createStyles } from "@/features/lobby/ui/LobbyMatchSetup.styles";

interface LobbyMatchSetupProps {
  isConnected: boolean;
  status: string;
  gameType: "wordle" | "andazebi" | "mix";
  setGameType: (val: "wordle" | "andazebi" | "mix") => void;
  joinPublic: () => void;
  createPrivate: () => void;
  joinPrivate: () => void;
  cancelQueue: () => void;
  inputPasscode: string;
  setInputPasscode: (val: string) => void;
  passcode: string | null;
  colors: AppColors;
}

export function LobbyMatchSetup({
  isConnected,
  status,
  gameType,
  setGameType,
  joinPublic,
  createPrivate,
  joinPrivate,
  cancelQueue,
  inputPasscode,
  setInputPasscode,
  passcode,
  colors,
}: LobbyMatchSetupProps) {
  const styles = createStyles(colors);

  return (
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
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    pressed && styles.pressed,
                    { flex: 0, paddingHorizontal: 16 },
                  ]}
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
            {status === "public-queue"
              ? "ვეძებთ მოწინააღმდეგეს..."
              : status === "private-joining"
                ? "ვუერთდებით ოთახს..."
                : "ველოდებით მეგობარს..."}
          </Text>
          {status === "private-hosting" && (
            <View style={styles.passcodeBox}>
              <Text style={styles.passcodeLabel}>თქვენი კოდია:</Text>
              <Text style={styles.passcodeValue}>{passcode}</Text>
            </View>
          )}
          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
            onPress={cancelQueue}
          >
            <Text style={styles.cancelBtnText}>გაუქმება</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

import { memo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AppColors } from "@/application/providers/theme";

type ChangePasswordCardProps = {
  styles: Record<string, any>;
  colors: AppColors;
  changePassword: (input: { currentPassword: string; newPassword: string }) => Promise<void>;
};

export const ChangePasswordCard = memo(function ChangePasswordCard({
  styles,
  colors,
  changePassword
}: ChangePasswordCardProps) {
  const [showPwSection, setShowPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState(false);

  const handleChangePw = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      setPwErr(true);
      setPwMsg("შეავსეთ ყველა ველი");
      return;
    }
    if (newPw.length < 8) {
      setPwErr(true);
      setPwMsg("პაროლი უნდა იყოს მინ. 8 სიმბოლო");
      return;
    }
    if (newPw !== confirmPw) {
      setPwErr(true);
      setPwMsg("ახალი პაროლები არ ემთხვევა");
      return;
    }

    setPwSaving(true);
    setPwErr(false);
    setPwMsg("");

    try {
      await changePassword({ currentPassword: currentPw, newPassword: newPw });
      setPwErr(false);
      setPwMsg("პაროლი წარმატებით შეიცვალა");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (e) {
      setPwErr(true);
      setPwMsg(e instanceof Error ? e.message : "პაროლის შეცვლა ვერ მოხერხდა");
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <Pressable
        style={({ pressed }) => [styles.sectionToggle, pressed && styles.pressed]}
        onPress={() => {
          setShowPwSection(!showPwSection);
          setPwMsg("");
          setPwErr(false);
        }}
      >
        <Text style={styles.cardTitle}>🔑 პაროლის შეცვლა</Text>
        <Text style={[styles.toggleChevron, showPwSection && styles.toggleChevronOpen]}>›</Text>
      </Pressable>

      {showPwSection && (
        <View style={styles.pwSection}>
          <Text style={styles.pwLabel}>მიმდინარე პაროლი</Text>
          <TextInput
            secureTextEntry
            style={styles.pwInput}
            value={currentPw}
            onChangeText={setCurrentPw}
            placeholderTextColor={colors.secondaryText}
            placeholder="••••••••"
          />
          <Text style={styles.pwLabel}>ახალი პაროლი</Text>
          <TextInput
            secureTextEntry
            style={styles.pwInput}
            value={newPw}
            onChangeText={setNewPw}
            placeholderTextColor={colors.secondaryText}
            placeholder="მინ. 8 სიმბოლო"
          />
          <Text style={styles.pwLabel}>გაიმეორე პაროლი</Text>
          <TextInput
            secureTextEntry
            style={styles.pwInput}
            value={confirmPw}
            onChangeText={setConfirmPw}
            placeholderTextColor={colors.secondaryText}
            placeholder="••••••••"
          />
          {pwMsg ? (
            <Text style={[styles.pwMsg, pwErr ? styles.pwMsgErr : styles.pwMsgOk]}>{pwMsg}</Text>
          ) : null}
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            onPress={handleChangePw}
          >
            <Text style={styles.primaryBtnText}>{pwSaving ? "იტვირთება..." : "შეცვლა"}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
});

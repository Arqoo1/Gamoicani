import { Text, TouchableOpacity, View, Modal } from "react-native";
import { AppColors } from "@/application/providers/theme";
import { createStyles } from "@/features/profile/screens/ProfileScreen.styles";

type Props = {
  colors: AppColors;
  errorMsg: string;
  logout: () => Promise<void>;
  onCloseError: () => void;
  onCloseLogout: () => void;
  onConfirmLogout: () => void;
  showLogoutConfirm: boolean;
  styles: ReturnType<typeof createStyles>;
};

export function ProfileDialogs({ colors, errorMsg, logout, onCloseError, onCloseLogout, onConfirmLogout, showLogoutConfirm, styles }: Props) {
  return (
    <>
      <Modal visible={showLogoutConfirm} transparent animationType="fade" onRequestClose={onCloseLogout}>
        <View style={styles.modalBackdropDialog}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>გასვლა</Text>
            <Text style={styles.dialogText}>ნამდვილად გსურს ანგარიშიდან გასვლა?</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogCancelBtn} onPress={onCloseLogout}><Text style={styles.dialogCancelBtnText}>გაუქმება</Text></TouchableOpacity>
              <TouchableOpacity style={styles.dialogDangerBtn} onPress={() => { onCloseLogout(); void onConfirmLogout(); }}><Text style={styles.dialogDangerBtnText}>გასვლა</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={!!errorMsg} transparent animationType="fade" onRequestClose={onCloseError}>
        <View style={styles.modalBackdropDialog}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>შეცდომა</Text>
            <Text style={styles.dialogText}>{errorMsg}</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogBtn} onPress={onCloseError}><Text style={styles.dialogBtnText}>კარგი</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

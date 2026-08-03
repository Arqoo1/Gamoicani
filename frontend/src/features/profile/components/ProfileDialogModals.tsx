import { Feather } from "@expo/vector-icons";
import { Modal, Text, TouchableOpacity, View } from "react-native";

type ProfileDialogModalsProps = {
  errorMsg: string;
  logout: () => Promise<void>;
  onCloseError: () => void;
  onCloseLogout: () => void;
  showLogoutConfirm: boolean;
  styles: Record<string, any>;
};

export function ProfileDialogModals({
  errorMsg,
  logout,
  onCloseError,
  onCloseLogout,
  showLogoutConfirm,
  styles,
}: ProfileDialogModalsProps) {
  return (
    <>
      <Modal visible={showLogoutConfirm} transparent animationType="fade" onRequestClose={onCloseLogout}>
        <View style={styles.modalBackdropDialog}>
          <View style={styles.dialog}>
            <View style={styles.dialogIconContainer}>
              <Feather name="log-out" size={28} color="#e63946" />
            </View>
            <Text style={styles.dialogTitle}>გასვლა</Text>
            <Text style={styles.dialogText}>ნამდვილად გსურს ანგარიშიდან გასვლა?</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogCancelBtn} onPress={onCloseLogout}>
                <Text style={styles.dialogCancelBtnText}>გაუქმება</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogDangerBtn}
                onPress={() => {
                  onCloseLogout();
                  void logout();
                }}
              >
                <Text style={styles.dialogDangerBtnText}>გასვლა</Text>
              </TouchableOpacity>
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
              <TouchableOpacity style={styles.dialogBtn} onPress={onCloseError}>
                <Text style={styles.dialogBtnText}>კარგი</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

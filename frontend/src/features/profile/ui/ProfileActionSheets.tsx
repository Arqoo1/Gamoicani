import * as ImagePicker from "expo-image-picker";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { AppColors } from "@/application/providers/theme";

type Props = {
  actionSheet: "none" | "cover" | "avatar";
  colors: AppColors;
  styles: Record<string, any>;
  onClose: () => void;
  onPickAvatarColor: () => void;
  onPickCoverColor: () => void;
};

export function ProfileActionSheets({ actionSheet, colors, styles, onClose, onPickAvatarColor, onPickCoverColor }: Props) {
  return (
    <Modal visible={actionSheet !== "none"} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdropAction} activeOpacity={1} onPress={onClose}>
        <View style={styles.actionSheet}>
          <View style={styles.actionSheetHandle} />
          {actionSheet === "cover" && (
            <>
              <Text style={styles.actionSheetTitle}>ქავერის შეცვლა</Text>
              <TouchableOpacity style={styles.actionSheetBtn} onPress={onPickCoverColor}>
                <Text style={styles.actionSheetBtnText}>ფერის არჩევა</Text>
              </TouchableOpacity>
            </>
          )}
          {actionSheet === "avatar" && (
            <>
              <Text style={styles.actionSheetTitle}>პროფილის სურათი</Text>
              <TouchableOpacity style={styles.actionSheetBtn} onPress={onPickAvatarColor}>
                <Text style={styles.actionSheetBtnText}>ფერის არჩევა</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={styles.actionSheetCancelBtn} onPress={onClose}>
            <Text style={styles.actionSheetCancelBtnText}>გაუქმება</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

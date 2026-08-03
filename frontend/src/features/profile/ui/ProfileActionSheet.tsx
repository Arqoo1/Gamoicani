import { Modal, Text, TouchableOpacity, View } from "react-native";
import { createStyles } from "@/features/profile/screens/ProfileScreen.styles";

type ActionSheetKind = "none" | "cover" | "avatar";

type ProfileActionSheetProps = {
  actionSheet: ActionSheetKind;
  onClose: () => void;
  onImageSelect: (kind: "cover" | "avatar") => Promise<void>;
  onOpenColorPicker: (kind: "cover" | "avatar") => void;
  styles: ReturnType<typeof createStyles>;
};

export function ProfileActionSheet({
  actionSheet,
  onClose,
  onImageSelect,
  onOpenColorPicker,
  styles,
}: ProfileActionSheetProps) {
  return (
    <Modal visible={actionSheet !== "none"} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdropAction} activeOpacity={1} onPress={onClose}>
        <View style={styles.actionSheet}>
          <View style={styles.actionSheetHandle} />

          {actionSheet === "cover" && (
            <>
              <Text style={styles.actionSheetTitle}>ყავერის შეცვლა</Text>
              <TouchableOpacity style={styles.actionSheetBtn} onPress={() => void onImageSelect("cover")}>
                <Text style={styles.actionSheetBtnText}>გალერიიდან არჩევა</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionSheetBtn}
                onPress={() => onOpenColorPicker("cover")}
              >
                <Text style={styles.actionSheetBtnText}>ფერით არჩევა</Text>
              </TouchableOpacity>
            </>
          )}

          {actionSheet === "avatar" && (
            <>
              <Text style={styles.actionSheetTitle}>პროფილის სურათი</Text>
              <TouchableOpacity style={styles.actionSheetBtn} onPress={() => void onImageSelect("avatar")}>
                <Text style={styles.actionSheetBtnText}>გალერიიდან არჩევა</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionSheetBtn}
                onPress={() => onOpenColorPicker("avatar")}
              >
                <Text style={styles.actionSheetBtnText}>ფერით არჩევა</Text>
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

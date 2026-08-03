import { Modal, Pressable, Text, View } from "react-native";

import { createStyles } from "@/features/home/screens/HomeScreen.styles";

export function GameGuideModal({
  styles,
  visible,
  onClose,
}: {
  styles: ReturnType<typeof createStyles>;
  visible: boolean;
  onClose: () => void;
}) {
  const normalGuideRows = [
    ["ქ", "წ", "ე", "რ", "ტ", "ყ", "უ", "ი", "ო", "პ"],
    ["ა", "ს", "დ", "ფ", "გ", "ჰ", "ჯ", "კ", "ლ"],
    ["⇧", "ზ", "ხ", "ც", "ვ", "ბ", "ნ", "მ", "⌫"],
  ];
  const shiftedGuideRows = [
    ["ქ", "ჭ", "ე", "ღ", "თ", "ყ", "უ", "ი", "ო", "პ"],
    ["ა", "შ", "დ", "ფ", "გ", "ჰ", "ჟ", "კ", "ლ"],
    ["⇧", "ძ", "ხ", "ჩ", "ვ", "ბ", "ნ", "მ", "⌫"],
  ];

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.guideModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>კლავიატურის გზამკვლევი</Text>
            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && styles.cardPressed]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>
          </View>
          <Text style={styles.guideCopy}>
            ქართული ასოების ტელეფონის ჩვეულებრივი განლაგება მიჰყვება დააჭირე ⇧-ს დასამატებელი ასოებისთვის,
            ხოლო შემდეგ კი კლავიატურა ჩვეული რეჟიმის დაუბრუნდება.
          </Text>
          <View style={styles.guideSection}>
            <Text style={styles.guideLabel}>ჩვეულებრივი</Text>
            {normalGuideRows.map((row) => (
              <View key={row.join("")} style={styles.guideRow}>
                {row.map((key) => (
                  <View key={key} style={styles.guideKey}>
                    <Text style={styles.guideKeyText}>{key}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
          <View style={styles.guideSection}>
            <Text style={styles.guideLabel}>დამატებითი ასოები</Text>
            {shiftedGuideRows.map((row) => (
              <View key={row.join("")} style={styles.guideRow}>
                {row.map((key) => (
                  <View key={key} style={[styles.guideKey, key === "⇧" && styles.guideKeyActive]}>
                    <Text style={[styles.guideKeyText, key === "⇧" && styles.guideKeyTextActive]}>{key}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

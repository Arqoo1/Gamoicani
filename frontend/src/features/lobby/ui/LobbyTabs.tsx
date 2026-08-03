import { Feather } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { AppColors } from "@/application/providers/theme";
import { createStyles } from "@/features/lobby/screens/LobbyScreen.styles";

type LobbyTabsProps = {
  colors: AppColors;
  activeTab: "match" | "chat";
  onChangeTab: (tab: "match" | "chat") => void;
  unread: number;
  styles: ReturnType<typeof createStyles>;
};

export function LobbyTabs({ colors, activeTab, onChangeTab, unread, styles }: LobbyTabsProps) {
  return (
    <View style={styles.tabBar}>
      <Pressable
        style={[styles.tabBtn, activeTab === "match" && styles.tabBtnActive]}
        onPress={() => onChangeTab("match")}
      >
        <Feather
          name="crosshair"
          size={16}
          color={activeTab === "match" ? colors.accent : colors.secondaryText}
        />
        <Text style={[styles.tabBtnText, activeTab === "match" && styles.tabBtnTextActive]}>მატჩი</Text>
      </Pressable>
      <Pressable
        style={[styles.tabBtn, activeTab === "chat" && styles.tabBtnActive]}
        onPress={() => onChangeTab("chat")}
      >
        <Feather
          name="message-circle"
          size={16}
          color={activeTab === "chat" ? colors.accent : colors.secondaryText}
        />
        <Text style={[styles.tabBtnText, activeTab === "chat" && styles.tabBtnTextActive]}>ჩათი</Text>
        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

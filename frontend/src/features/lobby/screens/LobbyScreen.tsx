import { useMemo } from "react";
import { StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/application/providers/theme";
import { LobbyChatTab } from "@/features/lobby/components/LobbyChatTab";
import { LobbyHeader } from "@/features/lobby/components/LobbyHeader";
import { LobbyMatchTab } from "@/features/lobby/components/LobbyMatchTab";
import { LobbyTabs } from "@/features/lobby/components/LobbyTabs";
import { LobbyUserProfileSheet } from "@/features/lobby/components/LobbyUserProfileSheet";
import { useLobbyScreenController } from "@/features/lobby/hooks/useLobbyScreenController";
import { createStyles } from "@/features/lobby/screens/LobbyScreen.styles";

export default function LobbyScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const controller = useLobbyScreenController();

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      <LobbyHeader colors={colors} onBack={() => controller.router.back()} styles={styles} />

      <LobbyTabs
        colors={colors}
        activeTab={controller.activeTab}
        onChangeTab={controller.setActiveTab}
        unread={controller.socketState.unread}
        styles={styles}
      />

      {controller.activeTab === "match" ? (
        <LobbyMatchTab
          colors={colors}
          isConnected={controller.socketState.isConnected}
          status={controller.socketState.status}
          gameType={controller.gameType}
          setGameType={controller.setGameType}
          joinPublic={() => controller.socketState.joinPublic(controller.gameType)}
          createPrivate={() => controller.socketState.createPrivate(controller.gameType)}
          joinPrivate={() => controller.socketState.joinPrivate()}
          cancelQueue={() => controller.socketState.cancelQueue()}
          inputPasscode={controller.socketState.inputPasscode}
          setInputPasscode={controller.socketState.setInputPasscode}
          passcode={controller.socketState.passcode}
        />
      ) : (
        <LobbyChatTab
          chatInput={controller.socketState.chatInput}
          colors={colors}
          messages={controller.socketState.messages}
          onSelectUser={controller.onSelectUser}
          sendChat={controller.socketState.sendChatMessage}
          setChatInput={controller.socketState.setChatInput}
          user={controller.user}
        />
      )}

      <LobbyUserProfileSheet
        colors={colors}
        friendRequestStatus={controller.friendRequestStatus}
        friendsList={controller.friendsList}
        onAddFriend={controller.handleAddFriend}
        onClose={() => controller.setSelectedUser(null)}
        onViewProfile={controller.openUserProfile}
        selectedUser={controller.selectedUser}
      />
    </SafeAreaView>
  );
}

import { AppColors } from "@/application/providers/theme";
import { LobbyChatPane } from "@/features/lobby/components/LobbyChatPane";
import { AuthUser } from "@/entities/user/types";

type SelectedUser = { id: string; displayName: string; username: string };

type LobbyChatTabProps = {
  chatInput: string;
  colors: AppColors;
  messages: Array<{
    id: string;
    userId: string;
    username: string;
    displayName: string;
    text: string;
    timestamp: number;
  }>;
  onSelectUser: (user: SelectedUser) => void;
  sendChat: () => void;
  setChatInput: (value: string) => void;
  user: AuthUser | null;
};

export function LobbyChatTab(props: LobbyChatTabProps) {
  return <LobbyChatPane {...props} />;
}

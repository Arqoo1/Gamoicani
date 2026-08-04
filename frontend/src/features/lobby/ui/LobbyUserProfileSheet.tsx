import { AppColors } from "@/application/providers/theme";
import { UserProfileModal } from "@/features/lobby/ui/UserProfileModal";
import { FriendUser } from "@/entities/user/types";

type SelectedUser = { id: string; displayName: string; username: string } | null;

type LobbyUserProfileSheetProps = {
  colors: AppColors;
  friendRequestStatus: "idle" | "loading" | "sent" | "error";
  friendsList: FriendUser[];
  onAddFriend: () => void;
  onClose: () => void;
  onViewProfile: (username: string) => void;
  selectedUser: SelectedUser;
};

export function LobbyUserProfileSheet(props: LobbyUserProfileSheetProps) {
  return <UserProfileModal {...props} />;
}

import { AppColors } from "@/application/providers/theme";
import { LobbyMatchSetup } from "@/features/lobby/components/LobbyMatchSetup";

type LobbyMatchTabProps = {
  colors: AppColors;
  createPrivate: () => void;
  gameType: "wordle" | "andazebi" | "mix";
  inputPasscode: string;
  isConnected: boolean;
  joinPrivate: () => void;
  joinPublic: () => void;
  cancelQueue: () => void;
  passcode: string | null;
  setGameType: (val: "wordle" | "andazebi" | "mix") => void;
  setInputPasscode: (val: string) => void;
  status: "idle" | "public-queue" | "private-hosting" | "private-joining";
};

export function LobbyMatchTab(props: LobbyMatchTabProps) {
  return <LobbyMatchSetup {...props} />;
}

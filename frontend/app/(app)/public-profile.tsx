import { useLocalSearchParams } from "expo-router";
import PublicProfileScreen from "@/features/profile/screens/PublicProfileScreen";

export default function PublicProfile() {
  const { username } = useLocalSearchParams<{ username: string }>();
  return <PublicProfileScreen username={username!} />;
}

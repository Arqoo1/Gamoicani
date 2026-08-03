import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthUser } from "@/entities/user/types";

const REPAIR_DONE_KEY = "@auth_bootstrap_repair_done_v1";

export async function runAuthBootstrap(
  user: AuthUser,
  updateUser: (next: AuthUser) => void
): Promise<void> {
  try {
    const alreadyRun = await AsyncStorage.getItem(REPAIR_DONE_KEY);
    if (alreadyRun) return;

    const userPlays = Object.values(user.gameStats || {}).reduce((sum, g) => sum + g.plays, 0);

    if (userPlays === 0) {
      const { getRepairCompletions } = await import(
        "@/features/wordle/model/storage"
      );
      const completions = await getRepairCompletions();

      if (completions.length > 0) {
        const { repairStats } = await import(
          "@/features/scores/api/scoresApi"
        );
        const res = await repairStats(completions);
        if (res.user) updateUser(res.user as AuthUser);
      }
    }

    await AsyncStorage.setItem(REPAIR_DONE_KEY, "1");
  } catch (e) {
    console.warn("[authBootstrap] Auto-repair failed:", e);
  }
}

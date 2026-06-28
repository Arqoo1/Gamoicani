export type UserAchievement = {
  description?: string;
  earnedAt: string;
  id: string;
  title?: string;
};

export type GameStat = {
  currentStreak: number;
  lastCompletedKey: string | null;
  lastPlayedAt: string | null;
  maxStreak: number;
  plays: number;
  points: number;
  wins: number;
};

export type AuthUser = {
  achievements: UserAchievement[];
  avatarColor: string;
  bio: string;
  coverGradient: number;
  coverPhotoUrl: string | null;
  createdAt: string | null;
  displayName: string;
  email: string | null;
  gameStats: Record<string, GameStat>;
  id: string;
  profilePhotoUrl: string | null;
  role: "user" | "admin";
  totalPoints: number;
  username: string;
  dailyQuests: {
    dateKey: string;
    quests: {
      id: string;
      type: string;
      target: number;
      progress: number;
      completed: boolean;
      title: string;
    }[];
    bonusClaimed: boolean;
  } | null;
};

export type FriendUser = {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  totalPoints?: number;
};

export type FriendRequest = {
  from: FriendUser;
  createdAt: string;
};

import { Image, Text, View } from "react-native";

type FeedEventCardProps = {
  avatarColor: string;
  avatarText: string;
  avatarUrl: string | null;
  displayName: string;
  gameDescription: string;
  styles: Record<string, any>;
  timeLabel: string;
  winText: string;
};

export function FeedEventCard({
  avatarColor,
  avatarText,
  avatarUrl,
  displayName,
  gameDescription,
  styles,
  timeLabel,
  winText
}: FeedEventCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
        ) : (
          <Text style={styles.avatarText}>{avatarText}</Text>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.timeAgo}>{timeLabel}</Text>
        </View>
        <Text style={styles.gameDesc}>{gameDescription}</Text>
        <Text style={styles.wonBadge}>{winText}</Text>
      </View>
    </View>
  );
}

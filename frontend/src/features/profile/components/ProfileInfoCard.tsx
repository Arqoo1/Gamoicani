import { View, Text } from "react-native";
import { EditRow } from "@/features/profile/ui/EditRow";
import { formatDate } from "@/features/profile/model/profileMeta";
import { createStyles } from "@/features/profile/screens/ProfileScreen.styles";
import { AppColors } from "@/application/providers/theme";
import { AuthUser } from "@/entities/user/types";

export function ProfileInfoCard({
  colors,
  styles,
  user,
  onUpdate,
}: {
  colors: AppColors;
  styles: ReturnType<typeof createStyles>;
  user: AuthUser;
  onUpdate: (input: Partial<Pick<AuthUser, "displayName" | "username" | "bio">>) => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>პროფილის ინფო</Text>
      <EditRow
        colors={colors}
        label="სახელი"
        styles={styles}
        value={user.displayName}
        onSave={async (v: string) => {
          onUpdate({ displayName: v });
        }}
      />
      <View style={styles.divider} />
      <EditRow
        colors={colors}
        icon="at-sign"
        label="მომხმარებლის სახელი"
        limit={15}
        styles={styles}
        value={user.username}
        placeholder="მომხმარებლის სახელი"
        onSave={async (v: string) => {
          onUpdate({ username: v });
        }}
      />
      <View style={styles.divider} />
      <EditRow
        colors={colors}
        label="ბიო"
        multiline
        styles={styles}
        value={user.bio ?? ""}
        placeholder="მოკლე აღწერა..."
        onSave={async (v: string) => {
          onUpdate({ bio: v });
        }}
      />
      <View style={styles.divider} />
      <View style={styles.fieldRow}>
        <View style={styles.fieldContent}>
          <Text style={styles.fieldLabel}>ელ-ფოსტა</Text>
          <Text style={styles.fieldValue}>{user.email ?? "—"}</Text>
        </View>
        <View style={styles.fieldBadge}>
          <Text style={styles.fieldBadgeText}>🔒</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.fieldRow}>
        <View style={styles.fieldContent}>
          <Text style={styles.fieldLabel}>წევრი</Text>
          <Text style={styles.fieldValue}>{formatDate(user.createdAt)}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.fieldRow}>
        <View style={styles.fieldContent}>
          <Text style={styles.fieldLabel}>როლი</Text>
          <Text style={styles.fieldValue}>{user.role === "admin" ? "👑 ადმინი" : "👤 მომხმარებელი"}</Text>
        </View>
      </View>
    </View>
  );
}

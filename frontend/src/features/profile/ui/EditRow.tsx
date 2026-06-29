import { useState } from "react";
import { Pressable, Text, TextInput, TouchableOpacity, View } from "react-native";

import { AppColors } from "@/application/providers/theme";

interface EditRowProps {
  colors: AppColors;
  icon?: string;
  label: string;
  limit?: number;
  multiline?: boolean;
  onSave: (val: string) => Promise<void>;
  placeholder?: string;
  styles: Record<string, any>;
  value: string;
}

export function EditRow({ colors, label, limit, multiline, onSave, placeholder, styles, value }: EditRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleEdit = () => {
    setDraft(value);
    setErr("");
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setErr("");
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setErr("");
    try {
      await onSave(draft.trim());
      setEditing(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "შეცდომა");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <View style={styles.editRowActive}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          autoFocus
          maxLength={limit}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          placeholder={placeholder ?? label}
          placeholderTextColor={colors.secondaryText}
          style={[styles.inlineInput, multiline && styles.inlineInputMulti]}
          value={draft}
          onChangeText={setDraft}
        />
        {err ? <Text style={styles.fieldError}>{err}</Text> : null}
        <View style={styles.editRowActions}>
          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
            onPress={handleSave}
          >
            <Text style={styles.saveBtnText}>{saving ? "..." : "შენახვა"}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
            onPress={handleCancel}
          >
            <Text style={styles.cancelBtnText}>გაუქმება</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue} numberOfLines={multiline ? 3 : 1}>
          {value || <Text style={{ color: colors.secondaryText }}>—</Text>}
        </Text>
      </View>
      <TouchableOpacity style={styles.editIconBtn} onPress={handleEdit}>
        <Text style={styles.editIcon}>✎</Text>
      </TouchableOpacity>
    </View>
  );
}

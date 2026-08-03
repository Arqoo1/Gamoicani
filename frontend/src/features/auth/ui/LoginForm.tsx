import React from "react";
import { Text, TextInput, View } from "react-native";
import { AppColors } from "@/application/providers/theme";

interface LoginFormProps {
  colors: AppColors;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  focusedField: string | null;
  setFocusedField: (val: string | null) => void;
  styles: any;
}

export function LoginForm({
  colors,
  email,
  setEmail,
  password,
  setPassword,
  focusedField,
  setFocusedField,
  styles,
}: LoginFormProps) {
  const inputStyle = (field: string) => [styles.input, focusedField === field && styles.inputFocused];

  return (
    <>
      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>ელ-ფოსტა</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="შენი ელ-ფოსტა"
          placeholderTextColor={colors.secondaryText}
          style={inputStyle("email")}
          value={email}
          onChangeText={setEmail}
          onFocus={() => setFocusedField("email")}
          onBlur={() => setFocusedField(null)}
        />
      </View>

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>პაროლი</Text>
        <TextInput
          placeholder="შენი პაროლი"
          placeholderTextColor={colors.secondaryText}
          secureTextEntry
          style={inputStyle("password")}
          value={password}
          onChangeText={setPassword}
          onFocus={() => setFocusedField("password")}
          onBlur={() => setFocusedField(null)}
        />
      </View>
    </>
  );
}

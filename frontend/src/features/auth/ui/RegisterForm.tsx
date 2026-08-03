import React from "react";
import { Text, TextInput, View } from "react-native";
import { AppColors } from "@/application/providers/theme";

interface RegisterFormProps {
  colors: AppColors;
  displayName: string;
  setDisplayName: (val: string) => void;
  username: string;
  setUsername: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  focusedField: string | null;
  setFocusedField: (val: string | null) => void;
  styles: any;
}

export function RegisterForm({
  colors,
  displayName,
  setDisplayName,
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  focusedField,
  setFocusedField,
  styles,
}: RegisterFormProps) {
  const inputStyle = (field: string) => [styles.input, focusedField === field && styles.inputFocused];

  return (
    <>
      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>სახელი</Text>
        <TextInput
          autoCapitalize="words"
          placeholder="შენი სახელი"
          placeholderTextColor={colors.secondaryText}
          style={inputStyle("displayName")}
          value={displayName}
          onChangeText={setDisplayName}
          onFocus={() => setFocusedField("displayName")}
          onBlur={() => setFocusedField(null)}
        />
      </View>
      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>მომხმარებელი</Text>
        <TextInput
          autoCapitalize="none"
          placeholder="მომხმარებლის სახელი"
          placeholderTextColor={colors.secondaryText}
          style={inputStyle("username")}
          value={username}
          onChangeText={setUsername}
          onFocus={() => setFocusedField("username")}
          onBlur={() => setFocusedField(null)}
        />
      </View>
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

import React from "react";
import { Pressable, Text } from "react-native";
import { Image } from "expo-image";

interface GoogleSignInButtonProps {
  onPress: () => void;
  disabled?: boolean;
  styles: any;
}

export function GoogleSignInButton({ onPress, disabled, styles }: GoogleSignInButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.googleBtn, pressed && styles.pressed]}
      onPress={onPress}
      disabled={disabled}
    >
      <Image
        source={{
          uri: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg",
        }}
        style={{ width: 20, height: 20, marginRight: 12 }}
      />
      <Text style={styles.googleText}>Google-ით შესვლა</Text>
    </Pressable>
  );
}

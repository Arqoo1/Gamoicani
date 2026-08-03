import { useEffect } from "react";
import { Platform } from "react-native";
import {
  BACKSPACE_KEY,
  ENTER_KEY,
  GEORGIAN_LETTERS,
  QWERTY_TO_GEORGIAN,
  SHIFTED_QWERTY_TO_GEORGIAN,
} from "@/shared/constants/georgianKeyboard";

type UseGeorgianWebKeyboardOptions = {
  disabled?: boolean;
  onKeyPress: (key: string) => void;
};

export function useGeorgianWebKeyboard({ disabled = false, onKeyPress }: UseGeorgianWebKeyboardOptions) {
  useEffect(() => {
    if (Platform.OS !== "web" || disabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        onKeyPress(ENTER_KEY);
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        onKeyPress(BACKSPACE_KEY);
        return;
      }
      const typedLetter = Array.from(event.key)[0];
      const qwertyLetter =
        event.key.length === 1
          ? (event.shiftKey ? SHIFTED_QWERTY_TO_GEORGIAN[event.key.toUpperCase()] : undefined) ??
            QWERTY_TO_GEORGIAN[event.key.toLowerCase()]
          : undefined;
      const letter = qwertyLetter ?? typedLetter;

      if (letter && GEORGIAN_LETTERS.has(letter)) {
        event.preventDefault();
        onKeyPress(letter);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [disabled, onKeyPress]);
}

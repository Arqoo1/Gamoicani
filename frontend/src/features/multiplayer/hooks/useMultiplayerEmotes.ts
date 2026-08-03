import { useRef, useState } from "react";
import { Animated, Easing } from "react-native";

import type { AppSocket } from "@/application/providers/socket";

function triggerFloat(animY: Animated.Value, animOp: Animated.Value, onDone: () => void) {
  animY.setValue(0);
  animOp.setValue(1);
  Animated.parallel([
    Animated.timing(animY, {
      toValue: -60,
      duration: 1700,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }),
    Animated.timing(animOp, { toValue: 0, duration: 1700, delay: 700, useNativeDriver: true }),
  ]).start(onDone);
}

export function useMultiplayerEmotes(roomId: string, socket: AppSocket | null) {
  const [emotePickerOpen, setEmotePickerOpen] = useState(false);
  const [oppEmote, setOppEmote] = useState<string | null>(null);
  const [myEmote, setMyEmote] = useState<string | null>(null);
  const oppY = useRef(new Animated.Value(0)).current;
  const oppOp = useRef(new Animated.Value(0)).current;
  const myY = useRef(new Animated.Value(0)).current;
  const myOp = useRef(new Animated.Value(0)).current;

  const sendEmote = (emote: string) => {
    socket?.emit("send-emote", { emoteId: emote, roomId });
    setEmotePickerOpen(false);
    setMyEmote(emote);
    triggerFloat(myY, myOp, () => setMyEmote(null));
  };

  const receiveEmote = (emote: string) => {
    setOppEmote(emote);
    triggerFloat(oppY, oppOp, () => setOppEmote(null));
  };

  return {
    emotePickerOpen,
    myEmote,
    myOp,
    myY,
    oppEmote,
    oppOp,
    oppY,
    receiveEmote,
    sendEmote,
    setEmotePickerOpen,
  };
}

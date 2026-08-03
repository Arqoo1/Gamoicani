import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppColors } from "@/application/providers/theme";
import { useTurnTimer } from "../hooks/useTurnTimer";
import {createStyles} from "@/features/multiplayer/components/TurnTimer.styles"; 

interface TurnTimerProps {
  activePlayerId: string | null;
  userId: string | null;
  startSignal: number;
  stopSignal: number;
  colors: AppColors;
}

export function TurnTimer({ activePlayerId, userId, startSignal, stopSignal, colors }: TurnTimerProps) {
  const { startTimer, stopTimer, timeLeft } = useTurnTimer(30);
  const styles = createStyles(colors);

  const isMyTurn = !!activePlayerId && !!userId && activePlayerId === userId;

  useEffect(() => {
    if (startSignal > 0) startTimer();
  }, [startSignal]);

  useEffect(() => {
    if (stopSignal > 0) stopTimer();
  }, [stopSignal]);

  return (
    <View style={styles.turnBanner}>
      {!isMyTurn ? (
        <Text style={styles.waitingText}>⏳ მოწინააღმდეგეს ველოდებით...</Text>
      ) : (
        <Text style={[styles.timerText, timeLeft <= 5 && styles.timerUrgent]}>⏱ {timeLeft} წამი</Text>
      )}
    </View>
  );
}

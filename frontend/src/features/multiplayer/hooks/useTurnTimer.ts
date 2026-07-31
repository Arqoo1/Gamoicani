import { useCallback, useEffect, useRef, useState } from "react";

export function useTurnTimer(initialSeconds = 30) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    setTimeLeft(initialSeconds);
    stopTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [initialSeconds, stopTimer]);

  useEffect(() => stopTimer, [stopTimer]);

  return { startTimer, stopTimer, timeLeft };
}

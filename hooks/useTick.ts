import { useCallback, useEffect, useRef, useState } from "react";
import { useRunStore } from "@/store/runStore";

export function useTick() {
  const TICK_INTERVAL = 100;
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef(Date.now());
  const pausedDurationRef = useRef(0);
  
  const tick = useCallback(() => {
    const now = Date.now();
    const expectedElapsed = now - startTimeRef.current - pausedDurationRef.current;
    const newSeconds = Math.round(expectedElapsed / 1000);
    setSeconds(newSeconds);
    useRunStore.getState().setDuration(newSeconds);

    const nextExpectedTime = (newSeconds + 1) * 1000 + startTimeRef.current + pausedDurationRef.current;
    const delay = nextExpectedTime - now;
    const nextDelay = Math.max(0, delay);

    timerRef.current = setTimeout(tick, nextDelay);
  }, []);

  const startTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setSeconds(0);
    setIsPaused(false);
    pausedDurationRef.current = 0;
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(tick, TICK_INTERVAL);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPaused(false);
    pausedDurationRef.current = 0;
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPaused(true);
    pausedDurationRef.current = Date.now() - startTimeRef.current - seconds * 1000;
  };

  const resumeTimer = () => {
    if (!isPaused) return;
    setIsPaused(false);
    const now = Date.now();
    pausedDurationRef.current = now - startTimeRef.current - seconds * 1000;
    timerRef.current = setTimeout(tick, TICK_INTERVAL);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  return { startTimer, stopTimer, pauseTimer, resumeTimer, seconds, isPaused };
}

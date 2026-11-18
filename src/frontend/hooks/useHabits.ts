"use client";

import { useCallback, useEffect, useState } from "react";
import { getHabits, incrementHabit } from "../api/liveRepository";
import type { HabitsData } from "../mocks/types";

export interface UseHabitsResult {
  data: HabitsData | null;
  isLoading: boolean;
  error: Error | null;
  incrementHabit: (habitId: string) => Promise<void>;
}

export function useHabits(): UseHabitsResult {
  const [data, setData] = useState<HabitsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    getHabits()
      .then((result) => {
        if (isMounted) setData(result);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleIncrementHabit = useCallback(async (habitId: string) => {
    const { habit } = await incrementHabit(habitId);
    setData((previous) =>
      previous
        ? { habits: previous.habits.map((item) => (item.id === habit.id ? habit : item)) }
        : previous,
    );
  }, []);

  return { data, isLoading, error, incrementHabit: handleIncrementHabit };
}

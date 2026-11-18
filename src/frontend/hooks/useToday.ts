"use client";

import { useCallback, useEffect, useState } from "react";
import { addHabit, addTask, completeTask, getToday, incrementHabit } from "../mocks/repository";
import type { NewHabitInput, NewTaskInput, TodayData } from "../mocks/types";

export interface UseTodayResult {
  data: TodayData | null;
  isLoading: boolean;
  error: Error | null;
  completeTask: (taskId: string) => Promise<void>;
  incrementHabit: (habitId: string) => Promise<void>;
  addTask: (input: NewTaskInput) => Promise<void>;
  addHabit: (input: NewHabitInput) => Promise<void>;
}

export function useToday(): UseTodayResult {
  const [data, setData] = useState<TodayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    getToday()
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

  const handleCompleteTask = useCallback(async (taskId: string) => {
    const { task, companion } = await completeTask(taskId);
    setData((previous) =>
      previous
        ? {
            ...previous,
            companion,
            tasks: previous.tasks.map((item) => (item.id === task.id ? task : item)),
          }
        : previous,
    );
  }, []);

  const handleIncrementHabit = useCallback(async (habitId: string) => {
    const { habit, companion } = await incrementHabit(habitId);
    setData((previous) =>
      previous
        ? { ...previous, companion, habits: previous.habits.map((item) => (item.id === habit.id ? habit : item)) }
        : previous,
    );
  }, []);

  const handleAddTask = useCallback(async (input: NewTaskInput) => {
    const { task } = await addTask(input);
    setData((previous) => (previous ? { ...previous, tasks: [...previous.tasks, task] } : previous));
  }, []);

  const handleAddHabit = useCallback(async (input: NewHabitInput) => {
    const { habit } = await addHabit(input);
    setData((previous) => (previous ? { ...previous, habits: [...previous.habits, habit] } : previous));
  }, []);

  return {
    data,
    isLoading,
    error,
    completeTask: handleCompleteTask,
    incrementHabit: handleIncrementHabit,
    addTask: handleAddTask,
    addHabit: handleAddHabit,
  };
}

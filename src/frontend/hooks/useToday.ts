"use client";

import { useCallback, useEffect, useState } from "react";
import { completeTask, getToday } from "../mocks/repository";
import type { TodayData } from "../mocks/types";

export interface UseTodayResult {
  data: TodayData | null;
  isLoading: boolean;
  error: Error | null;
  completeTask: (taskId: string) => Promise<void>;
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

  return { data, isLoading, error, completeTask: handleCompleteTask };
}

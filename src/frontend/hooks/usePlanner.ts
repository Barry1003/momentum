"use client";

import { useCallback, useEffect, useState } from "react";
import { getPlanner, moveCarryOverToToday, moveListTaskToToday, rescheduleCarryOver } from "../mocks/repository";
import type { PlannerData, Task } from "../mocks/types";

export interface UsePlannerResult {
  data: PlannerData | null;
  isLoading: boolean;
  error: Error | null;
  /** Moves yesterday's leftover into today and returns the new task. */
  moveCarryOverToToday: () => Promise<Task | null>;
  rescheduleCarryOver: () => Promise<void>;
  /** Moves a task from the full list into today and returns the new task. */
  moveToToday: (listTaskId: string) => Promise<Task | null>;
  reload: () => Promise<void>;
}

export function usePlanner(): UsePlannerResult {
  const [data, setData] = useState<PlannerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    getPlanner()
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

  const handleMove = useCallback(async () => {
    const result = await moveCarryOverToToday();
    setData(result.planner);
    return result.task;
  }, []);

  const handleReschedule = useCallback(async () => {
    setData(await rescheduleCarryOver());
  }, []);

  const handleMoveToToday = useCallback(async (listTaskId: string) => {
    const result = await moveListTaskToToday(listTaskId);
    setData(result.planner);
    return result.task;
  }, []);

  const reload = useCallback(async () => {
    setData(await getPlanner());
  }, []);

  return { data, isLoading, error, moveCarryOverToToday: handleMove, rescheduleCarryOver: handleReschedule, moveToToday: handleMoveToToday, reload };
}

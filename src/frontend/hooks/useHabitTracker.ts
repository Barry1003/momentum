"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addHabit,
  archiveHabit,
  getHabitTracker,
  incrementHabit,
  pauseHabit,
  resumeHabit,
  updateHabit,
  type HabitChanges,
} from "../api/liveRepository";
import type { ConsistencyMoment, HabitTracker, NewHabitInput } from "../mocks/types";

export interface UseHabitTrackerResult {
  data: HabitTracker | null;
  isLoading: boolean;
  error: Error | null;
  /** Logs made while offline, per habit, waiting to sync. */
  pending: Record<string, number>;
  isOffline: boolean;
  /** Log one more for today. Resolves with a consistency moment when the server awards one. */
  log: (habitId: string) => Promise<ConsistencyMoment | null>;
  create: (input: NewHabitInput) => Promise<void>;
  update: (habitId: string, changes: HabitChanges) => Promise<void>;
  pause: (habitId: string, weeks: number | null) => Promise<void>;
  resume: (habitId: string) => Promise<void>;
  archive: (habitId: string) => Promise<void>;
}

function online(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

export function useHabitTracker(): UseHabitTrackerResult {
  const [data, setData] = useState<HabitTracker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const pending: Record<string, number> = {};
  const [isOffline, setIsOffline] = useState(false);

  const refresh = useCallback(async () => {
    setData(await getHabitTracker());
  }, []);

  useEffect(() => {
    let alive = true;
    getHabitTracker()
      .then((result) => {
        if (alive) setData(result);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const log = useCallback(
    async (habitId: string) => {
      if (!online()) {
        setIsOffline(true);
        throw new Error("You are offline. Habit logging needs a connection until offline sync is implemented.");
      }
      const { moment } = await incrementHabit(habitId);
      await refresh();
      return moment;
    },
    [refresh],
  );

  const create = useCallback(
    async (input: NewHabitInput) => {
      await addHabit(input);
      await refresh();
    },
    [refresh],
  );

  const update = useCallback(
    async (habitId: string, changes: HabitChanges) => {
      await updateHabit(habitId, changes);
      await refresh();
    },
    [refresh],
  );

  const pause = useCallback(
    async (habitId: string, weeks: number | null) => {
      await pauseHabit(habitId, weeks);
      await refresh();
    },
    [refresh],
  );

  const resume = useCallback(
    async (habitId: string) => {
      await resumeHabit(habitId);
      await refresh();
    },
    [refresh],
  );

  const archive = useCallback(
    async (habitId: string) => {
      await archiveHabit(habitId);
      await refresh();
    },
    [refresh],
  );

  return { data, isLoading, error, pending, isOffline, log, create, update, pause, resume, archive };
}

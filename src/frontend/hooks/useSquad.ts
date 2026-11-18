"use client";

import { useEffect, useState } from "react";
import { getSquad } from "../mocks/repository";
import type { SquadData } from "../mocks/types";

export interface UseSquadResult {
  data: SquadData | null;
  isLoading: boolean;
  error: Error | null;
}

export function useSquad(): UseSquadResult {
  const [data, setData] = useState<SquadData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    getSquad()
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

  return { data, isLoading, error };
}

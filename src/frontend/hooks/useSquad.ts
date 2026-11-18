"use client";

import { useEffect, useState } from "react";
import type { SquadData } from "../mocks/types";

export interface UseSquadResult {
  data: SquadData | null;
  squadName: string | null;
  isLoading: boolean;
  error: Error | null;
}

async function loadSquad(signal: AbortSignal): Promise<{ data: SquadData; name: string | null }> {
  const init: RequestInit = { credentials: "same-origin", cache: "no-store", signal };
  const list = await fetch("/api/squads", init);
  if (!list.ok) throw new Error("Unable to load your squad");
  const payload = await list.json() as { squads: { id: string; name: string }[] };
  const squad = payload.squads[0];
  if (!squad) return { data: { hasSquad: false, members: [] }, name: null };
  const response = await fetch(`/api/squads/${encodeURIComponent(squad.id)}/members`, init);
  if (!response.ok) throw new Error("Unable to load squad members");
  const result = await response.json() as {
    members: { userId: string; user: { name: string; profile: { displayName: string } | null } }[];
  };
  return {
    name: squad.name,
    data: {
      hasSquad: true,
      members: result.members.map(item => {
        const name = item.user.profile?.displayName || item.user.name;
        return {
          id: item.userId,
          name,
          avatarInitial: name.slice(0, 1).toUpperCase() || "?",
          stage: "child" as const,
          isFocusing: false,
          isCheckedInToday: false,
        };
      }),
    },
  };
}

export function useSquad(): UseSquadResult {
  const [data, setData] = useState<SquadData | null>(null);
  const [squadName, setSquadName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void loadSquad(controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setData(result.data);
      setSquadName(result.name);
    }).catch(err => {
      if (!controller.signal.aborted) setError(err instanceof Error ? err : new Error(String(err)));
    }).finally(() => {
      if (!controller.signal.aborted) setIsLoading(false);
    });
    return () => controller.abort();
  }, []);

  return { data, squadName, isLoading, error };
}

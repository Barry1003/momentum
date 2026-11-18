"use client";
import type { OnboardingPatch } from "@/modules/onboarding/contract";

export type OnboardingStatus = {
  profile: { displayName: string; timezone: string; onboardingStep: string } | null;
  avatar: { name: string; artStyle: "ANIME" | "SOFT_3D"; bodyForm: "BOY" | "GIRL"; stage: string; totalXp: number } | null;
  path: "solo" | "squad";
  complete: boolean;
  hasSquad: boolean;
  squads: { id: string; name: string }[];
  destination: string;
};

export class OnboardingApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init, credentials: "same-origin", cache: "no-store",
    headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload as { error?: { message?: string } | string } | null;
    const description = typeof error?.error === "string" ? error.error : error?.error?.message;
    throw new OnboardingApiError(response.status, description || "Unable to save. Please try again.");
  }
  return payload as T;
}

export const onboardingApi = {
  status: () => json<OnboardingStatus>("/api/onboarding"),
  save: (step: OnboardingPatch) => json<OnboardingStatus>("/api/onboarding", {
    method: "PATCH", body: JSON.stringify(step),
  }),
  complete: () => json<OnboardingStatus>("/api/onboarding/complete", { method: "POST" }),
  createSquad: (name: string) => json<{ squad: { id: string; name: string } }>("/api/squads", {
    method: "POST", body: JSON.stringify({ name, maxMembers: 8 }),
  }),
  previewInvitation: (code: string) => json<{ invitation: { squadName: string; memberCount: number; available: boolean; full: boolean } }>(
    `/api/invitations/${encodeURIComponent(code)}`,
  ),
  acceptInvitation: (code: string) => json<{ squadId: string; joined: boolean }>(
    `/api/invitations/${encodeURIComponent(code)}/accept`, { method: "POST" },
  ),
};

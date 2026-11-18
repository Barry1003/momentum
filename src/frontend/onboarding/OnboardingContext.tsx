"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onboardingApi } from "./api";

export interface OnboardingData {
  email: string;
  displayName: string;
  companionStyle: "anime" | "soft3d";
  companionLook: "boy" | "girl";
  companionName: string;
  path: "solo" | "squad" | null;
}

const DEFAULT_DATA: OnboardingData = {
  email: "",
  displayName: "",
  companionStyle: "anime",
  companionLook: "boy",
  companionName: "Ari",
  path: null,
};

const STORAGE_KEY = "momentum.onboarding";

interface OnboardingContextValue {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        // One-time hydration from sessionStorage after mount — sessionStorage
        // doesn't exist during SSR, so this can't be a lazy useState initializer.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setData({ ...DEFAULT_DATA, ...JSON.parse(stored) });
      } catch {
        // ignore malformed storage, keep defaults
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void onboardingApi.status().then(status => {
      const profile = status.profile;
      if (!mounted || !profile) return;
      setData(previous => ({
        ...previous,
        displayName: profile.displayName || previous.displayName,
        companionName: status.avatar?.name || previous.companionName,
        companionStyle: status.avatar ? (status.avatar.artStyle === "ANIME" ? "anime" : "soft3d") : previous.companionStyle,
        companionLook: status.avatar ? (status.avatar.bodyForm === "BOY" ? "boy" : "girl") : previous.companionLook,
        path: profile.onboardingStep === "PATH" || status.complete ? status.path : previous.path,
      }));
    }).catch(() => { /* A signed-out preview has no server draft. */ });
    return () => { mounted = false; };
  }, []);

  const update = (patch: Partial<OnboardingData>) => {
    setData((previous) => {
      const next = { ...previous, ...patch };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return <OnboardingContext.Provider value={{ data, update }}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error("useOnboarding must be used within OnboardingProvider");
  return context;
}

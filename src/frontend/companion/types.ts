export type GrowthStage = "child" | "preteen" | "teen" | "youngAdult" | "adult";

export type CompanionReaction = "idle" | "hello" | "taskDone" | "milestone" | "focus" | "quietDay";

export type CompanionRoom = "lavender" | "sage" | "sunrise" | "midnight";

export type CompanionOutfit = "original";

export interface CompanionLook {
  room: CompanionRoom;
  outfit: CompanionOutfit;
}

export type CompanionSize = "hero" | "card" | "face";

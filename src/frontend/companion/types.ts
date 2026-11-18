export type GrowthStage = "child" | "preteen" | "teen" | "youngAdult" | "adult";

export type CompanionReaction = "idle" | "hello" | "taskDone" | "milestone" | "focus" | "quietDay";

export type CompanionRoom = "lavender" | "sage" | "sunrise" | "midnight";

export type CompanionOutfit = "original";

export interface CompanionLook {
  room: CompanionRoom;
  outfit: CompanionOutfit;
}

/** `bust` shows head and shoulders only, for "peeking over a card" layouts. */
export type CompanionSize = "hero" | "card" | "bust" | "face";

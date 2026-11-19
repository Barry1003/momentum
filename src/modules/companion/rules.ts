export type Stage = "child" | "preteen" | "teen" | "youngAdult" | "adult";
export const STAGE_ORDER: Stage[] = ["child", "preteen", "teen", "youngAdult", "adult"];
export const atLeast = (current: Stage, stage: Stage) => STAGE_ORDER.indexOf(current) >= STAGE_ORDER.indexOf(stage);

export type Status = "selected" | "available" | "earned" | "locked" | "soon";
export interface Option { id: string; label: string; detail: string; status: Status; unlock?: string }
export interface Look { name: string; room: string; plinth: string; outfit: string; accents: string[] }
export interface Unlocks { stage: Stage; longestRun: number; goalDone: boolean; inSquad: boolean; deepDiver: boolean }

const option = (id: string, label: string, detail: string, status: Status, unlock?: string): Option => (unlock ? { id, label, detail, status, unlock } : { id, label, detail, status });

export const PLINTHS = [
  { id: "cream", label: "Cream", color: "#f8f0e2" },
  { id: "lavender", label: "Lavender", color: "#ddd2f8" },
  { id: "mint", label: "Mint", color: "#d6f0e6" },
  { id: "peach", label: "Peach", color: "#fbdcc8" },
];

/** Every option with its status for this person. Looks are cosmetic: they never change the stage. */
export function buildStudio(look: Look, unlocks: Unlocks) {
  const pick = (id: string, current: string, available: boolean, unlock?: string): Status =>
    id === current ? "selected" : available ? "available" : unlock ? "locked" : "soon";
  const youngAdult = atLeast(unlocks.stage, "youngAdult");
  return {
    name: look.name,
    room: look.room,
    plinth: look.plinth,
    outfit: look.outfit,
    rooms: [
      option("lavender", "Lavender nook", "Soft purple · default", pick("lavender", look.room, true)),
      option("sage", "Sage studio", "Calm green walls, a plant, and a little desk lamp", pick("sage", look.room, true)),
      option("sunrise", "Sunrise loft", youngAdult ? "Warm light · earned" : "Unlocks at Young Adult", pick("sunrise", look.room, youngAdult, "Unlocks at Young Adult")),
      option("midnight", "Midnight room", "Coming later", "soon"),
    ],
    accents: [
      option("plant", "Little plant", "Sits on the desk", look.accents.includes("plant") ? "selected" : "available"),
      option("lamp", "Desk lamp", "A warm pool of light", look.accents.includes("lamp") ? "selected" : "available"),
      option("lights", "String lights", "Coming later", "soon"),
    ],
    outfits: [
      option("original", "Ari’s original", "Blue jacket · white hoodie · headphones", look.outfit === "original" ? "selected" : "available"),
      option("coat", "Rainy day coat", unlocks.deepDiver ? "Earned with “Deep diver” · art arrives soon" : "Unlocks with “Deep diver”", unlocks.deepDiver ? "earned" : "locked", "Unlocks with “Deep diver”"),
      option("festival", "Festival look", "Coming later", "soon"),
    ],
    extras: [
      option("headphones", "Headphones", "Unlocked", "earned"),
      option("backpack", "Backpack", "7-day rhythm", unlocks.longestRun >= 7 ? "earned" : "locked", "7-day rhythm"),
      option("aura", "Gold aura", "First goal done", unlocks.goalDone || youngAdult ? "earned" : "locked", "First goal done"),
      option("scarf", "Squad scarf", "Join a squad", unlocks.inSquad ? "earned" : "locked", "Join a squad"),
    ],
    styles: [
      option("anime-boy", "Anime · Boy", "Ari", "selected"),
      option("anime-girl", "Anime · Girl", "Art for every stage is coming", "soon"),
      option("anime-bold", "Anime · Bold", "Art for every stage is coming", "soon"),
      option("soft-boy", "Soft 3D · Boy", "Art for every stage is coming", "soon"),
      option("soft-girl", "Soft 3D · Girl", "Art for every stage is coming", "soon"),
    ],
    plinths: PLINTHS,
  };
}

/** Apply requested changes, keeping only choices that are actually open to this person. */
export function applyLook(current: Look, changes: { name?: string; room?: string; plinth?: string; outfit?: string; accents?: string[] }, unlocks: Unlocks): Look {
  const studio = buildStudio(current, unlocks);
  const usable = (list: Option[], id: string | undefined) => id !== undefined && list.some((item) => item.id === id && (item.status === "selected" || item.status === "available"));
  return {
    name: changes.name ?? current.name,
    room: usable(studio.rooms, changes.room) ? (changes.room as string) : current.room,
    plinth: PLINTHS.some((item) => item.id === changes.plinth) ? (changes.plinth as string) : current.plinth,
    outfit: usable(studio.outfits, changes.outfit) ? (changes.outfit as string) : current.outfit,
    accents: changes.accents ? [...new Set(changes.accents.filter((id) => usable(studio.accents, id) || current.accents.includes(id)))] : current.accents,
  };
}

/** "About 5 days" or "About 3 weeks" at the pace of the last two weeks. */
export function paceNote(xp: number, nextAt: number | null, xpLastTwoWeeks: number): string | null {
  if (nextAt === null) return null;
  const perDay = xpLastTwoWeeks / 14;
  if (perDay <= 0) return null;
  const days = Math.max(1, Math.ceil((nextAt - xp) / perDay));
  return days <= 10 ? `About ${days} days at your usual pace.` : `About ${Math.round(days / 7)} weeks at your usual pace.`;
}

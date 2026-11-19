import { describe, expect, it } from "vitest";
import { applyLook, buildStudio, paceNote } from "./rules";
import { lookSchema } from "./validation";

const look = { name: "Ari", room: "lavender", plinth: "cream", outfit: "original", accents: [] };
const child = { stage: "child" as const, longestRun: 0, goalDone: false, inSquad: false, deepDiver: false };

describe("character studio", () => {
  it("locks rooms until the stage is reached", () => {
    expect(buildStudio(look, child).rooms.find((room) => room.id === "sunrise")?.status).toBe("locked");
    expect(buildStudio(look, { ...child, stage: "youngAdult" }).rooms.find((room) => room.id === "sunrise")?.status).toBe("available");
  });
  it("ignores choices that aren't open yet", () => {
    const next = applyLook(look, { room: "sunrise", outfit: "coat", plinth: "mint", accents: ["plant", "lights"] }, child);
    expect(next.room).toBe("lavender");
    expect(next.outfit).toBe("original");
    expect(next.plinth).toBe("mint");
    expect(next.accents).toEqual(["plant"]);
  });
  it("estimates the pace from recent XP", () => {
    expect(paceNote(400, 900, 0)).toBeNull();
    expect(paceNote(400, 900, 700)).toBe("About 10 days at your usual pace.");
    expect(paceNote(400, null, 700)).toBeNull();
  });
  it("validates names and choices", () => {
    expect(lookSchema.safeParse({ name: "" }).success).toBe(false);
    expect(lookSchema.safeParse({ room: "../etc" }).success).toBe(false);
    expect(lookSchema.safeParse({ stage: "adult" }).success).toBe(false);
  });
});

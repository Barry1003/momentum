import { describe, expect, it } from "vitest";
import { shape, shortWhen } from "./format";

const now = new Date("2026-11-19T12:00:00Z");
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60000);

describe("notification times", () => {
  it("reads short", () => {
    expect(shortWhen(ago(0), now)).toBe("now");
    expect(shortWhen(ago(2), now)).toBe("2m");
    expect(shortWhen(ago(180), now)).toBe("3h");
    expect(shortWhen(ago(60 * 24 * 10), now)).toBe("9 Nov");
  });
});

describe("notification list", () => {
  it("sorts newest first, groups by day and marks read", () => {
    const list = shape(
      [
        { id: "a", at: ago(60 * 30), kind: "squad", title: "Old", body: "" },
        { id: "b", at: ago(5), kind: "cheer", title: "New", body: "", fromName: "Zara" },
      ],
      ago(60),
      now,
      "2026-11-19",
    );
    expect(list.map((item) => item.id)).toEqual(["b", "a"]);
    expect(list[0]?.group).toBe("today");
    expect(list[1]?.group).toBe("earlier");
    expect(list[0]?.isRead).toBe(false);
    expect(list[1]?.isRead).toBe(true);
    expect(list[0]?.fromName).toBe("Zara");
  });
});

import { describe, expect, it } from "vitest";
import { monthCells, scheduleLabel, shortRange, todayLine, weekDates } from "./format";

describe("habit formatting", () => {
  it("names schedules plainly", () => {
    expect(scheduleLabel([0, 1, 2, 3, 4, 5, 6])).toBe("Every day");
    expect(scheduleLabel([4, 3, 2, 1, 0])).toBe("Weekdays");
    expect(scheduleLabel([6, 0, 2, 4])).toBe("Mon Wed Fri Sun");
  });

  it("builds Monday-first weeks and months", () => {
    expect(weekDates("2026-11-18", -1)).toEqual(["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15"]);
    expect(shortRange(weekDates("2026-11-18", -1))).toBe("9–15 Nov");
    const november = monthCells(2026, 10);
    expect(november.slice(0, 7)).toEqual([null, null, null, null, null, null, "2026-11-01"]);
    expect(november.at(-1)).toBe("2026-11-30");
  });

  it("describes today's progress", () => {
    const base = { id: "h", name: "Drink water", isScheduledToday: true };
    expect(todayLine({ ...base, targetCount: 8, completedCount: 2, kind: "target", unit: "glasses" })).toBe("2 of 8 glasses");
    expect(todayLine({ ...base, targetCount: 1, completedCount: 1, kind: "tick", detail: "10 pages" })).toBe("10 pages · done");
  });
});

import { describe, expect, it } from "vitest";
import { dayHeading, slotFor, weekOf, weekRangeLabel, weekdayIndex } from "./dates";

describe("planner dates", () => {
  it("builds a Monday-first week around today", () => {
    const week = weekOf(new Date(2026, 10, 18)); // Wed 18 Nov 2026
    expect(week.map((day) => day.dateLabel)).toEqual(["16", "17", "18", "19", "20", "21", "22"]);
    expect(week[2].isToday).toBe(true);
    expect(week[0].dayLabel).toBe("Mon");
    expect(weekRangeLabel(week)).toBe("16–22 November");
  });

  it("treats Sunday as the last day of the week", () => {
    expect(weekdayIndex(new Date(2026, 10, 22))).toBe(6);
    expect(weekOf(new Date(2026, 10, 22))[0].iso).toBe("2026-11-16");
  });

  it("labels weeks that cross a month", () => {
    expect(weekRangeLabel(weekOf(new Date(2026, 11, 31)))).toBe("28 December–3 January");
  });

  it("puts times into parts of the day", () => {
    expect(slotFor("08:30")).toBe("morning");
    expect(slotFor("12:00")).toBe("afternoon");
    expect(slotFor("17:30")).toBe("evening");
    expect(slotFor(undefined)).toBe("morning");
    expect(dayHeading("2026-11-18")).toBe("Wednesday 18");
  });
});

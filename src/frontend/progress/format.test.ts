import { describe, expect, it } from "vitest";
import { hoursMinutes, rangeLabel, signedMinutes, weekStart } from "./format";

describe("progress formatting", () => {
  it("formats durations", () => {
    expect(hoursMinutes(380)).toBe("6h 20m");
    expect(hoursMinutes(48)).toBe("48m");
    expect(hoursMinutes(425)).toBe("7h 05m");
    expect(signedMinutes(48)).toBe("+48m");
    expect(signedMinutes(-65)).toBe("−1h 05m");
  });

  it("labels ranges and weeks", () => {
    expect(weekStart("2026-11-18")).toBe("2026-11-16");
    expect(rangeLabel("2026-11-11", "2026-11-17", true)).toBe("11–17 November");
    expect(rangeLabel("2026-10-28", "2026-11-03")).toBe("28 Oct–3 Nov");
  });
});

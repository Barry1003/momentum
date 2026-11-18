import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WeekStrip } from "./WeekStrip";

const days = [
  { date: "2026-11-16", dayLabel: "Mon", dateLabel: "16", isPast: true },
  { date: "2026-11-17", dayLabel: "Tue", dateLabel: "17", isToday: true, hasActivity: true },
  { date: "2026-11-18", dayLabel: "Wed", dateLabel: "18" },
];

describe("WeekStrip", () => {
  it("marks the selected day and reports selection changes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<WeekStrip days={days} selected="2026-11-17" onSelect={onSelect} />);

    const selected = screen.getByRole("radio", { checked: true });
    expect(selected).toHaveAccessibleName(/17/);

    await user.click(screen.getByRole("radio", { name: /18/ }));
    expect(onSelect).toHaveBeenCalledWith("2026-11-18");
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MonthCalendar } from "./MonthCalendar";

const days = [
  { date: "2026-11-16", dateLabel: "16", isPast: true },
  { date: "2026-11-17", dateLabel: "17", isToday: true, hasActivity: true },
  { date: "2026-11-18", dateLabel: "18" },
];

describe("MonthCalendar", () => {
  it("marks the selected day and reports selection changes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <MonthCalendar weekdayLabels={["S", "M", "T"]} days={days} selected="2026-11-17" onSelect={onSelect} />,
    );

    expect(screen.getByRole("gridcell", { name: "17" })).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("gridcell", { name: "18" }));
    expect(onSelect).toHaveBeenCalledWith("2026-11-18");
  });
});

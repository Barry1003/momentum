import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChipGroup } from "./ChipGroup";

const options = [
  { value: "today", label: "Today" },
  { value: "25min", label: "25 min" },
  { value: "goal", label: "Goal…" },
];

describe("ChipGroup", () => {
  it("behaves as a single-select radio group", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ChipGroup legend="Quick add" mode="single" value="today" onChange={onChange} options={options} />);

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "Today" })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "25 min" }));
    expect(onChange).toHaveBeenCalledWith("25min");
  });

  it("behaves as a multi-select checkbox group", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ChipGroup legend="Filter" mode="multi" value={["today"]} onChange={onChange} options={options} />);

    expect(screen.getByRole("checkbox", { name: "Today" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "25 min" })).not.toBeChecked();

    await user.click(screen.getByRole("checkbox", { name: "25 min" }));
    expect(onChange).toHaveBeenCalledWith(["today", "25min"]);
  });

  it("disables busy chips and excludes them from interaction", () => {
    render(
      <ChipGroup
        legend="Quick add"
        mode="single"
        value={null}
        onChange={vi.fn()}
        options={[...options, { value: "busy", label: "Busy", busy: true }]}
      />,
    );

    expect(screen.getByRole("radio", { name: "Busy" })).toBeDisabled();
  });
});

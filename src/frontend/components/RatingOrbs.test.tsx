import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RatingOrbs } from "./RatingOrbs";

describe("RatingOrbs", () => {
  it("renders five labelled options as a radio group", () => {
    render(<RatingOrbs legend="How does Rest feel?" value={null} onChange={vi.fn()} />);
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    expect(screen.getByText("Needs room")).toBeInTheDocument();
    expect(screen.getByText("Well supported")).toBeInTheDocument();
  });

  it("marks the current value as checked and reports changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RatingOrbs legend="How does Rest feel?" value={3} onChange={onChange} />);

    const radios = screen.getAllByRole("radio");
    expect(radios[2]).toBeChecked();

    await user.click(radios[4]);
    expect(onChange).toHaveBeenCalledWith(5);
  });
});

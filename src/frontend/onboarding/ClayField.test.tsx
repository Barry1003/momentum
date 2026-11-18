import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClayPasswordField } from "./ClayField";
import { OnboardingProgress } from "./OnboardingProgress";
import { GreetingBubble } from "../companion/GreetingBubble";

describe("ClayPasswordField", () => {
  it("hides the password until the eye button is pressed", async () => {
    const user = userEvent.setup();
    render(<ClayPasswordField label="Password" defaultValue="secret-pass" />);

    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute("aria-pressed", "true");
  });

  it("announces validation errors", () => {
    render(<ClayPasswordField label="Password" errorText="Use at least 8 characters." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Use at least 8 characters.");
    expect(screen.getByLabelText("Password")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("OnboardingProgress", () => {
  it("describes the current step out of six", () => {
    render(<OnboardingProgress step={3} />);
    expect(screen.getByRole("progressbar")).toHaveAccessibleName("Step 3 of 6: Your name");
  });
});

describe("GreetingBubble", () => {
  it("only renders once the companion has greeted", () => {
    const { rerender } = render(<GreetingBubble visible={false}>Hi!</GreetingBubble>);
    expect(screen.queryByText("Hi!")).not.toBeInTheDocument();
    rerender(<GreetingBubble visible wave>Hi!</GreetingBubble>);
    expect(screen.getByRole("status")).toHaveTextContent("Hi!");
  });
});

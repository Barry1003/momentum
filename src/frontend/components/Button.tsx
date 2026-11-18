import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "secondary";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  fullWidth = true,
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "rounded-button px-6 py-3 font-heading text-label font-bold transition-[transform,box-shadow] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-45",
        fullWidth ? "w-full md:w-auto" : "",
        variant === "primary"
          ? "bg-[image:var(--gradient-primary)] text-white shadow-pressable active:translate-y-0.5 active:shadow-pressable-active"
          : "bg-surface text-accent-strong shadow-raised active:translate-y-0.5",
        className,
      )}
      {...rest}
    />
  );
}

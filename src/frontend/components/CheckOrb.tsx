import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export interface CheckOrbProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className" | "size"> {
  label: string;
  size?: "sm" | "md";
}

export function CheckOrb({ label, size = "md", id, ...rest }: CheckOrbProps) {
  const inputId = id ?? `check-orb-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const dimension = size === "sm" ? "h-9 w-9" : "h-11 w-11";

  return (
    <label htmlFor={inputId} className="inline-flex cursor-pointer items-center justify-center">
      <input id={inputId} type="checkbox" className="peer sr-only" {...rest} />
      <span className="sr-only">{label}</span>
      <span
        aria-hidden
        className={cn(
          dimension,
          "flex items-center justify-center rounded-full bg-surface shadow-raised transition-[background,box-shadow] duration-200 ease-out",
          "peer-checked:bg-[image:var(--gradient-primary)] peer-checked:shadow-pressable",
          "peer-checked:[&>svg]:scale-100",
          "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent peer-focus-visible:outline-offset-2",
        )}
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5 scale-0 text-white transition-transform duration-150 ease-out"
        >
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </label>
  );
}

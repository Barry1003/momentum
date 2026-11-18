import type { InputHTMLAttributes } from "react";

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> {
  label: string;
  hideLabel?: boolean;
}

export function Switch({ label, hideLabel = false, id, ...rest }: SwitchProps) {
  const inputId = id ?? `switch-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label htmlFor={inputId} className="inline-flex cursor-pointer items-center gap-2">
      <span className="relative inline-block h-7 w-12 shrink-0">
        <input
          id={inputId}
          type="checkbox"
          className="peer sr-only"
          {...rest}
        />
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-outline shadow-inset transition-colors duration-200 ease-out peer-checked:bg-[image:var(--gradient-primary)] peer-checked:shadow-none peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent peer-focus-visible:outline-offset-2"
        />
        <span
          aria-hidden
          className="absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-raised transition-transform duration-200 ease-out peer-checked:translate-x-5"
        />
      </span>
      <span className={hideLabel ? "sr-only" : "font-heading text-body"}>{label}</span>
    </label>
  );
}

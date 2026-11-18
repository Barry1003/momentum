"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { EyeIcon, EyeOffIcon, LockIcon } from "./icons";

export interface ClayFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  /** Accessible label. Shown visually only when `showLabel` is true. */
  label: string;
  icon: ReactNode;
  showLabel?: boolean;
  errorText?: string;
  trailing?: ReactNode;
}

/**
 * The soft "clay" input used on the sign-in and sign-up screens:
 * a round purple icon badge on the left and a pillowy inset field.
 */
export function ClayField({ label, icon, showLabel = false, errorText, trailing, id, ...rest }: ClayFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className={showLabel ? "font-heading text-label font-bold text-text" : "sr-only"}>
        {label}
      </label>
      <div
        className={cn(
          "flex items-center gap-3 rounded-full bg-[#fbf7f1] py-1.5 pr-4 pl-1.5",
          "shadow-[inset_0_2px_5px_rgba(76,49,155,.12),0_1px_0_rgba(255,255,255,.9)]",
          "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent",
          errorText ? "outline-2 outline-warning" : "",
        )}
      >
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-white shadow-pressable"
        >
          {icon}
        </span>
        <input
          id={inputId}
          aria-invalid={Boolean(errorText)}
          aria-describedby={errorText ? errorId : undefined}
          className="min-w-0 flex-1 bg-transparent py-2.5 font-heading text-body text-text outline-none placeholder:text-text-muted"
          {...rest}
        />
        {trailing}
      </div>
      {errorText ? (
        <p id={errorId} role="alert" className="pl-4 font-heading text-meta text-warning">
          {errorText}
        </p>
      ) : null}
    </div>
  );
}

export interface ClayPasswordFieldProps extends Omit<ClayFieldProps, "icon" | "type" | "trailing"> {
  icon?: ReactNode;
}

/** Password version of ClayField with a show/hide eye toggle. */
export function ClayPasswordField({ icon, ...rest }: ClayPasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <ClayField
      {...rest}
      type={isVisible ? "text" : "password"}
      icon={icon ?? <LockIcon className="h-5 w-5" />}
      trailing={
        <button
          type="button"
          onClick={() => setIsVisible((value) => !value)}
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
          className="shrink-0 rounded-full p-1 text-text-muted hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-accent"
        >
          {isVisible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      }
    />
  );
}

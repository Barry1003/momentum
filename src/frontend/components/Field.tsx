import { useId, type InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: string;
  helperText?: string;
  errorText?: string;
}

export function Field({ label, helperText, errorText, id, ...rest }: FieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="font-heading text-label font-bold">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-describedby={cn(helperText && helperId, errorText && errorId) || undefined}
          aria-invalid={Boolean(errorText)}
          className={cn(
            "w-full rounded-input bg-surface px-4 py-3 font-heading text-body text-text shadow-inset outline-none placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-accent",
            errorText ? "outline-2 outline-warning" : "",
            helperText ? "pr-16" : "",
          )}
          {...rest}
        />
        {helperText ? (
          <span
            id={helperId}
            className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 font-heading text-meta text-text-muted"
          >
            {helperText}
          </span>
        ) : null}
      </div>
      {errorText ? (
        <p id={errorId} role="alert" className="font-heading text-meta text-warning">
          {errorText}
        </p>
      ) : null}
    </div>
  );
}

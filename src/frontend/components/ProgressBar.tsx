import { cn } from "../lib/cn";

export interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  valueLabel?: string;
  helperText?: string;
  className?: string;
}

export function ProgressBar({ label, value, max, valueLabel, helperText, className }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between font-heading text-label font-bold">
        <span>{label}</span>
        <span className="text-text-muted font-medium">{valueLabel ?? `${value} / ${max}`}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="h-3 w-full overflow-hidden rounded-full bg-outline shadow-inset"
      >
        <div
          className="h-full rounded-full bg-[image:var(--gradient-primary)] transition-[width] duration-200 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      {helperText ? <p className="font-heading text-meta text-text-muted">{helperText}</p> : null}
    </div>
  );
}

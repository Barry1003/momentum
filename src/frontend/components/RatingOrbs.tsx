"use client";

import { useId } from "react";
import { cn } from "../lib/cn";

const RATING_LABELS = ["Needs room", "Some room", "Steady", "Feels good", "Well supported"] as const;

export interface RatingOrbsProps {
  legend: string;
  hideLegend?: boolean;
  value: number | null;
  onChange: (value: number) => void;
  className?: string;
}

export function RatingOrbs({ legend, hideLegend = false, value, onChange, className }: RatingOrbsProps) {
  const groupId = useId();
  const name = `rating-${groupId}`;

  return (
    <fieldset className={cn("m-0 border-0 p-0", className)}>
      <legend className={hideLegend ? "sr-only" : "mb-2 font-heading text-label font-bold"}>{legend}</legend>
      <div className="flex justify-between gap-1">
        {RATING_LABELS.map((label, index) => {
          const rating = index + 1;
          const inputId = `${name}-${rating}`;
          const isChecked = value === rating;
          return (
            <label key={rating} htmlFor={inputId} className="flex flex-1 cursor-pointer flex-col items-center gap-1.5">
              <input
                id={inputId}
                type="radio"
                name={name}
                value={rating}
                checked={isChecked}
                onChange={() => onChange(rating)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full font-heading text-body font-bold transition-[background,box-shadow] duration-150 ease-out",
                  isChecked
                    ? "bg-[image:var(--gradient-primary)] text-white shadow-pressable"
                    : "bg-surface text-text shadow-raised",
                )}
              >
                {rating}
              </span>
              <span className="text-center font-heading text-meta text-text-muted">{label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

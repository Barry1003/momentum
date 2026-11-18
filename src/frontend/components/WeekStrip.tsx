"use client";

import { cn } from "../lib/cn";

export interface WeekStripDay {
  date: string; // ISO date, used as the value
  dayLabel: string; // e.g. "Mon"
  dateLabel: string; // e.g. "17"
  isToday?: boolean;
  isPast?: boolean;
  hasActivity?: boolean;
}

export interface WeekStripProps {
  days: WeekStripDay[];
  selected: string;
  onSelect: (date: string) => void;
  className?: string;
}

export function WeekStrip({ days, selected, onSelect, className }: WeekStripProps) {
  return (
    <div role="radiogroup" aria-label="Select a day" className={cn("flex justify-between gap-1", className)}>
      {days.map((day) => {
        const isSelected = day.date === selected;
        return (
          <button
            key={day.date}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(day.date)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-chip px-2 py-2 font-heading transition-colors duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
              isSelected
                ? "bg-[image:var(--gradient-primary)] text-white shadow-pressable"
                : day.isToday
                  ? "border-2 border-accent text-text"
                  : "text-text",
              day.isPast && !isSelected ? "opacity-45" : "",
            )}
          >
            <span className="text-meta font-bold uppercase">{day.dayLabel}</span>
            <span className="text-body font-bold">{day.dateLabel}</span>
            <span
              aria-hidden
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                day.hasActivity ? (isSelected ? "bg-white" : "bg-accent") : "bg-transparent",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

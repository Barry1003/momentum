"use client";

import { cn } from "../lib/cn";

export interface MonthCalendarDay {
  date: string; // ISO date
  dateLabel: string; // e.g. "1"
  isToday?: boolean;
  isPast?: boolean;
  isOutsideMonth?: boolean;
  hasActivity?: boolean;
}

export interface MonthCalendarProps {
  weekdayLabels: string[];
  days: MonthCalendarDay[];
  selected?: string;
  onSelect: (date: string) => void;
  className?: string;
}

export function MonthCalendar({ weekdayLabels, days, selected, onSelect, className }: MonthCalendarProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 grid grid-cols-7 gap-1">
        {weekdayLabels.map((label, index) => (
          <span key={index} className="text-center font-heading text-meta font-bold text-text-muted">
            {label}
          </span>
        ))}
      </div>
      <div role="grid" aria-label="Month" className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isSelected = day.date === selected;
          return (
            <button
              key={day.date}
              type="button"
              role="gridcell"
              aria-selected={isSelected}
              onClick={() => onSelect(day.date)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-chip font-heading text-body transition-colors duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
                day.isOutsideMonth ? "text-text-muted opacity-45" : "text-text",
                isSelected ? "bg-[image:var(--gradient-primary)] text-white shadow-pressable" : "",
                day.isToday && !isSelected ? "border-2 border-accent" : "",
                day.isPast && !isSelected && !day.isOutsideMonth ? "opacity-60" : "",
              )}
            >
              <span>{day.dateLabel}</span>
              <span
                aria-hidden
                className={cn(
                  "h-1 w-1 rounded-full",
                  day.hasActivity ? (isSelected ? "bg-white" : "bg-accent") : "bg-transparent",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

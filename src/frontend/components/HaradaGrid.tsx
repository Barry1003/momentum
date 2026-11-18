"use client";

import { cn } from "../lib/cn";

export interface HaradaArea {
  id: string;
  name: string;
  actionCount: number;
}

export interface HaradaGridProps {
  goalLabel: string;
  areas: HaradaArea[]; // exactly 8, surrounding the centre goal cell
  selectedAreaId?: string;
  onSelectArea: (id: string) => void;
  className?: string;
}

export function HaradaGrid({ goalLabel, areas, selectedAreaId, onSelectArea, className }: HaradaGridProps) {
  const cells = [...areas.slice(0, 4), null, ...areas.slice(4, 8)];

  return (
    <div className={cn("grid grid-cols-3 grid-rows-3 gap-2", className)} role="group" aria-label="Harada goal grid">
      {cells.map((area) =>
        area === null ? (
          <div
            key="goal"
            className="flex aspect-square flex-col items-center justify-center rounded-card bg-[image:var(--gradient-primary)] p-2 text-center text-white shadow-pressable"
          >
            <span className="font-heading text-meta font-bold tracking-wide uppercase">Your goal</span>
            <span className="mt-1 font-heading text-body font-bold">{goalLabel}</span>
          </div>
        ) : (
          <button
            key={area.id}
            type="button"
            aria-pressed={selectedAreaId === area.id}
            onClick={() => onSelectArea(area.id)}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1 rounded-card border-2 border-dashed border-outline p-2 text-center font-heading transition-colors duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
              selectedAreaId === area.id
                ? "border-solid border-accent bg-accent-tint"
                : "bg-surface",
            )}
          >
            <span className="text-body font-bold text-text">{area.name}</span>
            <span className="text-meta text-text-muted">{area.actionCount} actions</span>
          </button>
        ),
      )}
    </div>
  );
}

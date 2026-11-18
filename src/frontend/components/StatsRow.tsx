import { cn } from "../lib/cn";

export interface Stat {
  value: string;
  label: string;
}

export interface StatsRowProps {
  stats: Stat[];
  className?: string;
}

export function StatsRow({ stats, className }: StatsRowProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3", className)}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-card bg-surface px-4 py-3 text-center shadow-raised"
        >
          <p className="font-display text-title font-extrabold text-accent-strong">
            {stat.value}
          </p>
          <p className="font-heading text-meta text-text-muted">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

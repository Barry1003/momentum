import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type QuadrantKey = "doNext" | "planATime" | "reconsider" | "leaveRoom";

const QUADRANT_META: Record<QuadrantKey, { title: string; background: string }> = {
  doNext: { title: "Do next", background: "bg-accent-tint" },
  planATime: { title: "Plan a time", background: "bg-surface shadow-raised" },
  reconsider: { title: "Reconsider", background: "bg-cream" },
  leaveRoom: { title: "Leave room", background: "bg-cream" },
};

export interface QuadrantBoardProps {
  items: Record<QuadrantKey, ReactNode[]>;
  emptyMessage?: string;
  className?: string;
}

export function QuadrantBoard({ items, emptyMessage = "Nothing here yet.", className }: QuadrantBoardProps) {
  const order: QuadrantKey[] = ["doNext", "planATime", "reconsider", "leaveRoom"];

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {order.map((key) => {
        const meta = QUADRANT_META[key];
        const quadrantItems = items[key];
        return (
          <div key={key} className={cn("rounded-card p-3", meta.background)}>
            <p className="mb-2 font-heading text-label font-bold text-text">{meta.title}</p>
            {quadrantItems.length === 0 ? (
              <p className="font-heading text-meta text-text-muted">{emptyMessage}</p>
            ) : (
              <div className="flex flex-col gap-2">{quadrantItems}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

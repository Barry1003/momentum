import type { ReactNode } from "react";
import { ListCard, ListCardRow } from "./ListCard";

export interface DayAgendaItem {
  id: string;
  time?: string;
  title: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
}

export interface DayAgendaProps {
  items: DayAgendaItem[];
  emptyMessage?: string;
  className?: string;
}

export function DayAgenda({ items, emptyMessage = "Nothing planned for this day.", className }: DayAgendaProps) {
  if (items.length === 0) {
    return (
      <div className={className}>
        <p className="font-heading text-body text-text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ListCard className={className}>
      {items.map((item) => (
        <ListCardRow
          key={item.id}
          leading={item.leading}
          title={item.title}
          meta={item.time}
          trailing={item.trailing}
          onClick={item.onClick}
        />
      ))}
    </ListCard>
  );
}

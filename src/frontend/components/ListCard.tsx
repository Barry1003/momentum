import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface ListCardRowProps {
  leading?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ListCardRow({ leading, title, meta, trailing, onClick, className }: ListCardRowProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left",
        onClick && "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px]",
        className,
      )}
    >
      {leading ? <span className="shrink-0">{leading}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-heading text-body font-bold text-text">{title}</span>
        {meta ? <span className="block truncate font-heading text-meta text-text-muted">{meta}</span> : null}
      </span>
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </Component>
  );
}

export interface ListCardProps {
  groupTitle?: string;
  children: ReactNode;
  className?: string;
}

export function ListCard({ groupTitle, children, className }: ListCardProps) {
  return (
    <div className={cn("overflow-hidden rounded-card bg-surface shadow-raised", className)}>
      {groupTitle ? (
        <p className="px-4 pt-3 font-heading text-meta font-bold tracking-wide text-text-muted uppercase">
          {groupTitle}
        </p>
      ) : null}
      <div className="divide-y divide-outline">{children}</div>
    </div>
  );
}

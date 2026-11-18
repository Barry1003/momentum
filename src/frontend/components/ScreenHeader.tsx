import Image from "next/image";
import type { ReactNode } from "react";
import bellIcon from "../assets/icons/bell.svg";
import { cn } from "../lib/cn";

export interface ScreenHeaderProps {
  kicker?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  onBack?: () => void;
  onNotificationsClick?: () => void;
  hasUnreadNotifications?: boolean;
  className?: string;
}

export function ScreenHeader({
  kicker,
  title,
  subtitle,
  onBack,
  onNotificationsClick,
  hasUnreadNotifications = false,
  className,
}: ScreenHeaderProps) {
  return (
    <header className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex items-start gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface shadow-raised"
          >
            <svg aria-hidden viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-text">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
        <div>
          {kicker ? (
            <p className="font-heading text-meta font-bold tracking-wide text-text-muted uppercase">{kicker}</p>
          ) : null}
          <h1 className="font-display text-title font-extrabold text-text md:text-display">{title}</h1>
          {subtitle ? <p className="mt-1 font-heading text-body text-text-muted">{subtitle}</p> : null}
        </div>
      </div>
      {onNotificationsClick ? (
        <button
          type="button"
          onClick={onNotificationsClick}
          aria-label="Notifications"
          className="relative hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface shadow-raised md:flex"
        >
          <Image src={bellIcon} alt="" className="h-5 w-5" />
          {hasUnreadNotifications ? (
            <span aria-hidden className="absolute top-2 right-2 h-2 w-2 rounded-full bg-warning" />
          ) : null}
        </button>
      ) : null}
    </header>
  );
}

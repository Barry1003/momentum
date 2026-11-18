import Image from "next/image";
import Link from "next/link";
import homeIcon from "../assets/icons/home.svg";
import meIcon from "../assets/icons/me.svg";
import planIcon from "../assets/icons/plan.svg";
import plusIcon from "../assets/icons/plus.svg";
import progressIcon from "../assets/icons/progress.svg";
import { cn } from "../lib/cn";

export type BottomNavKey = "home" | "plan" | "progress" | "me";

export interface BottomNavProps {
  activeKey: BottomNavKey;
  hrefs: Record<BottomNavKey, string>;
  onCreate: () => void;
  createLabel?: string;
  className?: string;
}

const NAV_ITEMS: { key: BottomNavKey; label: string; icon: typeof homeIcon }[] = [
  { key: "home", label: "Home", icon: homeIcon },
  { key: "plan", label: "Plan", icon: planIcon },
  { key: "progress", label: "Progress", icon: progressIcon },
  { key: "me", label: "Me", icon: meIcon },
];

export function BottomNav({ activeKey, hrefs, onCreate, createLabel = "Quick create", className }: BottomNavProps) {
  const [firstHalf, secondHalf] = [NAV_ITEMS.slice(0, 2), NAV_ITEMS.slice(2)];

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed right-4 bottom-4 left-4 z-40 flex h-[72px] items-center justify-between rounded-[36px] bg-surface/94 px-5 shadow-floating md:hidden",
        className,
      )}
    >
      {firstHalf.map((item) => (
        <NavLink key={item.key} item={item} href={hrefs[item.key]} isActive={activeKey === item.key} />
      ))}
      <button
        type="button"
        onClick={onCreate}
        aria-label={createLabel}
        className="relative -top-3.5 flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] shadow-pressable active:translate-y-0.5 active:shadow-pressable-active"
      >
        <Image src={plusIcon} alt="" className="h-4 w-4" />
      </button>
      {secondHalf.map((item) => (
        <NavLink key={item.key} item={item} href={hrefs[item.key]} isActive={activeKey === item.key} />
      ))}
    </nav>
  );
}

function NavLink({
  item,
  href,
  isActive,
}: {
  item: (typeof NAV_ITEMS)[number];
  href: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className="flex flex-col items-center gap-[3px]"
    >
      <span className="flex h-[22px] w-[22px] items-center justify-center">
        <Image src={item.icon} alt="" className="h-auto max-h-[22px] w-auto max-w-[22px]" />
      </span>
      <span
        className={cn(
          "font-heading text-meta font-medium",
          isActive ? "text-accent-strong" : "text-text-muted",
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}

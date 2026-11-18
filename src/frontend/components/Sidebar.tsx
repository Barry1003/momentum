import Image from "next/image";
import Link from "next/link";
import homeIcon from "../assets/icons/home.svg";
import meIcon from "../assets/icons/me.svg";
import planIcon from "../assets/icons/plan.svg";
import plusIcon from "../assets/icons/plus.svg";
import progressIcon from "../assets/icons/progress.svg";
import { cn } from "../lib/cn";
import { Logo } from "./Logo";

export type SidebarKey = "home" | "plan" | "create" | "progress" | "me";

export interface SidebarProps {
  activeKey: SidebarKey;
  hrefs: Record<SidebarKey, string>;
  className?: string;
}

const SIDEBAR_ITEMS: { key: SidebarKey; label: string; icon: typeof homeIcon }[] = [
  { key: "home", label: "Home", icon: homeIcon },
  { key: "plan", label: "Plan", icon: planIcon },
  { key: "create", label: "Create", icon: plusIcon },
  { key: "progress", label: "Progress", icon: progressIcon },
  { key: "me", label: "Me", icon: meIcon },
];

export function Sidebar({ activeKey, hrefs, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "hidden h-screen w-[248px] shrink-0 flex-col justify-between px-4 py-6 md:flex",
        className,
      )}
    >
      <div>
        <div className="mb-8 px-2">
          <Logo />
        </div>
        <nav aria-label="Primary" className="flex flex-col gap-1">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = activeKey === item.key;
            return (
              <Link
                key={item.key}
                href={hrefs[item.key]}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-button px-4 py-3 font-heading text-label font-bold transition-colors duration-150 ease-out",
                  isActive ? "bg-surface text-accent-strong shadow-raised" : "text-text-muted hover:text-text",
                )}
              >
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center">
                  <Image
                    src={item.icon}
                    alt=""
                    className={cn(
                      "h-auto max-h-[22px] w-auto max-w-[22px]",
                      item.key === "create" && "rounded-full bg-[image:var(--gradient-primary)] p-1",
                    )}
                  />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <p className="px-2 font-heading text-meta text-text-muted">
        Your space is private. Sharing is always a choice.
      </p>
    </aside>
  );
}

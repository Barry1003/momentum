import Image from "next/image";
import logoMarkLight from "../assets/brand/logo-mark-light.svg";
import logoMarkDark from "../assets/brand/logo-mark-dark.svg";
import { cn } from "../lib/cn";

export interface LogoProps {
  variant?: "light" | "dark";
  className?: string;
}

/**
 * From Figma section 08 (node 285:839, "Brand / Logo lockup"):
 * three rising figures with a gold head on the leader, plus the wordmark.
 */
export function Logo({ variant = "light", className }: LogoProps) {
  const mark = variant === "dark" ? logoMarkDark : logoMarkLight;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image src={mark} alt="" className="h-8 w-8" priority />
      <span
        className={cn(
          "font-display text-[18px] leading-none font-extrabold tracking-[-0.18px]",
          variant === "dark" ? "text-dark-text" : "text-accent-strong",
        )}
      >
        Momentum
      </span>
    </div>
  );
}

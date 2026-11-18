import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  as?: ElementType;
}

export function Card({ children, className, as: Component = "div", ...rest }: CardProps) {
  return (
    <Component
      className={cn(
        "rounded-card bg-surface p-4 md:p-[18px] shadow-raised",
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

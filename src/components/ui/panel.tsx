import type { HTMLAttributes, ReactNode } from "react";

type PanelProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  as?: "section" | "article" | "div";
};

export function Panel({ as: Component = "section", className = "", children, ...props }: PanelProps) {
  return (
    <Component
      className={`rounded-3xl border border-slate-200/90 bg-white p-5 shadow-[0_4px_24px_rgba(30,27,75,0.035)] sm:p-6 ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

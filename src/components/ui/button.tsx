import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const styles: Record<ButtonVariant, string> = {
  primary: "bg-violet-700 text-white shadow-sm hover:bg-violet-800 focus-visible:outline-violet-700",
  secondary: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus-visible:outline-violet-700",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-violet-700",
};

export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

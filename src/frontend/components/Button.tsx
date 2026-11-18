import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "secondary";

function buttonClasses(variant: ButtonVariant, fullWidth: boolean, className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-button px-6 py-3 text-center font-heading text-label font-bold transition-[transform,box-shadow] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-45",
    fullWidth ? "w-full md:w-auto" : "",
    variant === "primary"
      ? "bg-[image:var(--gradient-primary)] text-white shadow-pressable active:translate-y-0.5 active:shadow-pressable-active"
      : "bg-surface text-accent-strong shadow-raised active:translate-y-0.5",
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export function Button({ variant = "primary", fullWidth = true, className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, fullWidth, className)} {...rest} />;
}

export interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export function LinkButton({ href, variant = "primary", fullWidth = true, className, ...rest }: LinkButtonProps) {
  return <Link href={href} className={buttonClasses(variant, fullWidth, className)} {...rest} />;
}

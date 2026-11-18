"use client";

import Image, { type StaticImageData } from "next/image";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { BackIcon } from "../home/icons";
import { cn } from "../lib/cn";

/** Dark, quiet backdrop for every Focus screen. One centred column on all sizes. */
export function FocusFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_50%_30%,#4a2f97_0%,#2f1d66_45%,#1a1236_100%)] text-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col px-4 pt-6 pb-10 sm:px-6">{children}</div>
    </div>
  );
}

export function FocusHeader({
  kicker,
  title,
  subtitle,
  onBack,
  backLabel = "Back",
}: {
  kicker: string;
  title: ReactNode;
  subtitle?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
}) {
  return (
    <header>
      <div className="flex items-start gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="mt-2 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-white"
          >
            <BackIcon className="h-4 w-4" />
          </button>
        ) : null}
        <div>
          <p className="font-heading text-meta tracking-wide text-white/75 uppercase">{kicker}</p>
          <h1 className="mt-1 font-display text-title font-extrabold text-white sm:text-display">{title}</h1>
        </div>
      </div>
      {subtitle ? <p className="mt-3 font-heading text-body text-white/75">{subtitle}</p> : null}
    </header>
  );
}

export function Glass({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("rounded-[26px] border border-white/10 bg-white/[0.07] p-4", className)}>{children}</section>;
}

export function GlassLabel({ children }: { children: ReactNode }) {
  return <p className="mb-2 font-heading text-meta tracking-wide text-white/70 uppercase">{children}</p>;
}

type Tone = "primary" | "light" | "ghost";

export function FocusButton({ tone = "primary", className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return (
    <button
      type="button"
      className={cn(
        "w-full rounded-full py-4 font-heading text-body font-bold transition active:translate-y-0.5 disabled:opacity-60",
        tone === "primary" && "bg-[linear-gradient(180deg,#9b7be8,#6b46c9)] text-white shadow-[0_6px_0_#4c319b,0_14px_30px_rgba(20,10,60,.45)]",
        tone === "light" && "bg-[linear-gradient(180deg,#ffffff,#e9e1fb)] text-[#3b2a78] shadow-[0_5px_0_#c9bbf3,0_14px_30px_rgba(20,10,60,.35)]",
        tone === "ghost" && "border border-white/10 bg-white/[0.08] text-white/85",
        className,
      )}
      {...rest}
    />
  );
}

/** Cream card with Ari standing on the right. */
export function AriCard({ label, title, body, art }: { label: string; title: string; body: string; art: StaticImageData }) {
  return (
    <section className="flex items-stretch overflow-hidden rounded-[26px] bg-[#f8f0e2] text-text shadow-floating">
      <div className="flex flex-1 flex-col justify-center p-5">
        <p className="font-heading text-meta tracking-wide text-accent-strong uppercase">{label}</p>
        <p className="mt-2 font-display text-heading font-extrabold">{title}</p>
        <p className="mt-2 font-heading text-label text-text-muted">{body}</p>
      </div>
      <div className="relative w-[96px] shrink-0 bg-[#f1e8da] sm:w-[120px]">
        <Image src={art} alt="Ari" fill sizes="120px" className="object-contain object-bottom" />
      </div>
    </section>
  );
}

export function StatTile({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center rounded-[22px] border px-2 py-4 text-center",
        highlight ? "border-[#f3c879]/60 bg-[#f3c879]/15" : "border-white/10 bg-white/[0.07]",
      )}
    >
      <span className={cn("font-display text-title font-extrabold", highlight ? "text-[#ffd98a]" : "text-white")}>{value}</span>
      <span className="font-heading text-meta text-white/70">{label}</span>
    </div>
  );
}

export function WarnCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section role="status" className="rounded-[22px] border border-[#f0a85f]/25 bg-[#7a4a4a]/40 p-4">
      <p className="font-heading text-body font-bold text-[#f0b26b]">{title}</p>
      <p className="mt-1 font-heading text-label text-white/90">{children}</p>
    </section>
  );
}

export function DarkPill({ selected, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "rounded-full px-4 py-2.5 font-heading text-label font-bold transition",
        selected ? "bg-[linear-gradient(180deg,#9b7be8,#6b46c9)] text-white shadow-[0_4px_0_#4c319b]" : "border border-white/15 bg-white/[0.08] text-white/85",
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/** The big ring: remaining time in the middle, progress around it. */
export function FocusRing({ progress, children }: { progress: number; children: ReactNode }) {
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[290px]">
      <svg viewBox="0 0 280 280" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="140" cy="140" r={radius} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="18" />
        <circle
          cx="140"
          cy="140"
          r={radius}
          fill="none"
          stroke="url(#focus-ring)"
          strokeWidth="18"
          strokeLinecap="butt"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, progress)))}
          className="transition-[stroke-dashoffset] duration-500 ease-linear"
        />
        <defs>
          <linearGradient id="focus-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d9ccfb" />
            <stop offset="100%" stopColor="#8f6be0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-[13%] flex flex-col items-center justify-center rounded-full bg-[radial-gradient(circle_at_50%_35%,#5a3bb0,#2c1b63)] shadow-[inset_0_8px_24px_rgba(0,0,0,.35)]">
        {children}
      </div>
    </div>
  );
}

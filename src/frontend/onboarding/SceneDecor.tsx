import { cn } from "../lib/cn";

/** Soft clay cloud made of overlapping rounded blobs. Decorative only. */
export function Cloud({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("animate-cloud-drift pointer-events-none absolute block h-12 w-24", className)}>
      <span className="absolute bottom-0 left-0 h-9 w-24 rounded-full bg-white shadow-[0_10px_20px_rgba(76,49,155,.14),inset_0_-4px_0_rgba(214,204,240,.7)]" />
      <span className="absolute bottom-3 left-4 h-10 w-10 rounded-full bg-white" />
      <span className="absolute bottom-2 left-11 h-12 w-12 rounded-full bg-white shadow-[inset_0_-3px_0_rgba(214,204,240,.5)]" />
    </span>
  );
}

/** Clay potted plant (left side of the auth scenes). */
export function PottedPlant({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 120 180" className={cn("pointer-events-none absolute", className)}>
      <defs>
        <linearGradient id="leaf-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a7c584" />
          <stop offset="1" stopColor="#6f9a52" />
        </linearGradient>
        <linearGradient id="pot-a" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e9d3b8" />
          <stop offset=".55" stopColor="#f6e6d1" />
          <stop offset="1" stopColor="#d7bb98" />
        </linearGradient>
      </defs>
      <g className="animate-plant-sway">
        <path d="M60 118 C40 96 22 86 12 58 C34 62 52 80 60 118Z" fill="url(#leaf-a)" />
        <path d="M60 118 C52 84 46 52 58 18 C72 46 70 84 60 118Z" fill="url(#leaf-a)" />
        <path d="M60 118 C78 92 96 80 110 50 C86 56 68 80 60 118Z" fill="url(#leaf-a)" />
        <path d="M60 118 C44 104 28 102 8 92 C26 84 48 92 60 118Z" fill="#88ad69" />
        <path d="M60 118 C78 104 96 104 114 96 C96 86 72 94 60 118Z" fill="#88ad69" />
      </g>
      <path d="M28 116 H92 L84 172 Q83 178 76 178 H44 Q37 178 36 172Z" fill="url(#pot-a)" />
      <rect x="24" y="110" width="72" height="14" rx="7" fill="#f3e2cc" />
    </svg>
  );
}

/** Clay flower pot (right side of the auth scenes). */
export function FlowerPot({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 100 160" className={cn("pointer-events-none absolute", className)}>
      <defs>
        <linearGradient id="pot-b" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ec9f9c" />
          <stop offset=".5" stopColor="#f6b9b4" />
          <stop offset="1" stopColor="#df8a87" />
        </linearGradient>
        <radialGradient id="petal" cx=".4" cy=".35" r=".8">
          <stop offset="0" stopColor="#ffd3dc" />
          <stop offset="1" stopColor="#f39bb0" />
        </radialGradient>
      </defs>
      <g className="animate-plant-sway">
        <path d="M50 108 C50 84 48 66 50 46" stroke="#7ea35f" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M50 92 C36 88 28 78 26 66 C40 68 48 78 50 92Z" fill="#8db36c" />
        <path d="M50 84 C64 80 72 70 74 60 C60 62 52 72 50 84Z" fill="#8db36c" />
        {[0, 72, 144, 216, 288].map((angle) => (
          <ellipse key={angle} cx="50" cy="28" rx="9" ry="14" fill="url(#petal)" transform={`rotate(${angle} 50 40)`} />
        ))}
        <circle cx="50" cy="40" r="8" fill="#f7c948" />
      </g>
      <path d="M24 106 H76 L70 152 Q69 158 62 158 H38 Q31 158 30 152Z" fill="url(#pot-b)" />
      <rect x="20" y="100" width="60" height="12" rx="6" fill="#f4b0ab" />
    </svg>
  );
}

/** Small gold "sparkle dash" marks either side of a heading. */
export function SparkleDashes({ side, className }: { side: "left" | "right"; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 30" className={cn("h-7 w-6 shrink-0", side === "right" && "-scale-x-100", className)}>
      <g stroke="#f4b740" strokeWidth="3.2" strokeLinecap="round">
        <path d="M4 6 L14 9" />
        <path d="M2 15 H14" />
        <path d="M4 24 L14 21" />
      </g>
    </svg>
  );
}

/** Four-point twinkle star. */
export function Twinkle({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={cn("animate-sparkle pointer-events-none absolute h-5 w-5", className)}>
      <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="#fff6d6" />
    </svg>
  );
}

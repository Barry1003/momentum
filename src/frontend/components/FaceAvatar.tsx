import Image, { type StaticImageData } from "next/image";
import { cn } from "../lib/cn";

export interface FaceAvatarProps {
  name: string;
  src?: StaticImageData | string;
  size?: number;
  className?: string;
}

export function FaceAvatar({ name, src, size = 44, className }: FaceAvatarProps) {
  const dimension = { width: size, height: size };

  return (
    <span
      role="img"
      aria-label={name}
      className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-tint shadow-raised ring-[3px] ring-white", className)}
      style={dimension}
    >
      {src ? (
        <Image src={src} alt="" width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden className="font-heading text-label font-bold text-accent-strong">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}

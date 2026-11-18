import Image from "next/image";
import ariAdult from "../assets/companion/ari-adult.png";
import ariAdultFace from "../assets/companion/ari-adult-face.png";
import ariChild from "../assets/companion/ari-child.png";
import ariChildFace from "../assets/companion/ari-child-face.png";
import ariPreteen from "../assets/companion/ari-preteen.png";
import ariPreteenFace from "../assets/companion/ari-preteen-face.png";
import ariTeen from "../assets/companion/ari-teen.png";
import ariTeenFace from "../assets/companion/ari-teen-face.png";
import ariYoungAdult from "../assets/companion/ari-youngAdult.png";
import ariYoungAdultFace from "../assets/companion/ari-youngAdult-face.png";
import { cn } from "../lib/cn";
import type { CompanionLook, CompanionReaction, CompanionSize, GrowthStage } from "./types";

export interface CompanionRendererProps {
  stage: GrowthStage;
  reaction: CompanionReaction;
  look: CompanionLook;
  size: CompanionSize;
  reduceMotion: boolean;
  onReactionEnd?: () => void;
}

const STAGE_ART: Record<GrowthStage, { full: typeof ariChild; face: typeof ariChildFace }> = {
  child: { full: ariChild, face: ariChildFace },
  preteen: { full: ariPreteen, face: ariPreteenFace },
  teen: { full: ariTeen, face: ariTeenFace },
  youngAdult: { full: ariYoungAdult, face: ariYoungAdultFace },
  adult: { full: ariAdult, face: ariAdultFace },
};

// Only "original" exists today; future outfits add entries here without
// touching any screen that renders <Companion />.
const SUPPORTED_OUTFITS: CompanionLook["outfit"][] = ["original"];

/**
 * Temporary reaction → motion. The growth stage (permanent) only chooses the
 * art; reactions only choose motion. Keep these two concerns separate.
 */
const REACTION_MOTION: Record<CompanionReaction, string> = {
  idle: "animate-companion-idle",
  quietDay: "animate-companion-idle",
  hello: "animate-companion-hello",
  taskDone: "animate-companion-hello",
  milestone: "animate-companion-celebrate",
  focus: "",
};

const ONE_SHOT_REACTIONS: ReadonlySet<CompanionReaction> = new Set(["hello", "taskDone", "milestone"]);

const IMAGE_CLASS: Record<Exclude<CompanionSize, "face">, string> = {
  hero: "h-[220px] w-auto",
  card: "h-[120px] w-auto",
  // Tall image inside a short clipping box: only head and shoulders show.
  bust: "h-[500px] w-auto max-w-none",
};

/**
 * Static-PNG companion art, cropped from the Figma source sheet
 * (page "02 — Character Source Art"), brought to life with motion:
 * breathing + sway when idle, a hop-and-tilt "hello", a celebration jump,
 * and a ground shadow that breathes with the body.
 *
 * Real blinking, smiling and an arm wave need new layered art frames
 * (or a Rive/Live2D rig). When those exist, swap the renderer in
 * activeRenderer.ts — no screen needs to change.
 */
export function PngCompanionRenderer({ stage, reaction, look, size, reduceMotion, onReactionEnd }: CompanionRendererProps) {
  const outfit = SUPPORTED_OUTFITS.includes(look.outfit) ? look.outfit : "original";
  void outfit; // only one outfit exists today; kept for the future art swap

  const art = STAGE_ART[stage];

  if (size === "face") {
    return <Image src={art.face} alt="" draggable={false} className="h-12 w-12 select-none rounded-full object-cover" />;
  }

  const motionClass = reduceMotion ? "" : REACTION_MOTION[reaction];
  const isOneShot = ONE_SHOT_REACTIONS.has(reaction);
  const handleAnimationEnd = !reduceMotion && isOneShot ? onReactionEnd : undefined;

  return (
    <span
      className={cn(
        "relative inline-flex flex-col items-center",
        size === "bust" ? "h-[190px] items-start overflow-hidden" : "",
      )}
    >
      <span
        className={cn("companion-body", motionClass)}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) handleAnimationEnd?.();
        }}
      >
        <Image
          src={art.full}
          alt=""
          draggable={false}
          className={cn("select-none", IMAGE_CLASS[size])}
          priority={size !== "card"}
        />
      </span>
      {size === "bust" ? null : (
        <span aria-hidden className={cn("companion-shadow", reduceMotion ? "" : "animate-companion-shadow")} />
      )}
    </span>
  );
}

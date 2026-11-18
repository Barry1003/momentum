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

const REACTION_ANIMATION_CLASS: Record<CompanionReaction, string> = {
  idle: "animate-companion-breathe",
  quietDay: "animate-companion-breathe",
  hello: "animate-companion-bounce-sm",
  taskDone: "animate-companion-bounce-sm",
  milestone: "animate-companion-bounce-lg",
  focus: "",
};

const ONE_SHOT_REACTIONS: ReadonlySet<CompanionReaction> = new Set(["hello", "taskDone", "milestone"]);

const SIZE_CLASS: Record<CompanionSize, string> = {
  hero: "h-[220px] w-auto",
  card: "h-[120px] w-auto",
  face: "h-12 w-12 rounded-full object-cover",
};

/**
 * Static-PNG companion art, cropped from the Figma source sheet
 * (page "02 — Character Source Art", node 1:2). Swap this renderer for a
 * future Rive/Live2D one by changing the export in companion/index.ts.
 */
export function PngCompanionRenderer({ stage, reaction, look, size, reduceMotion, onReactionEnd }: CompanionRendererProps) {
  const outfit = SUPPORTED_OUTFITS.includes(look.outfit) ? look.outfit : "original";
  void outfit; // only one outfit exists today; kept for the future art swap

  const art = STAGE_ART[stage];
  const image = size === "face" ? art.face : art.full;
  const animationClass = reduceMotion ? "" : REACTION_ANIMATION_CLASS[reaction];
  const isOneShot = ONE_SHOT_REACTIONS.has(reaction);

  return (
    <Image
      src={image}
      alt=""
      className={cn("select-none", SIZE_CLASS[size], animationClass)}
      onAnimationEnd={!reduceMotion && isOneShot ? onReactionEnd : undefined}
      priority={size === "hero"}
    />
  );
}

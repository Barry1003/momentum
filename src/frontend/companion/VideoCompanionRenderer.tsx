"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "../lib/cn";
import { PngCompanionRenderer, type CompanionRendererProps } from "./CompanionRenderer";
import { LOOPING_CLIPS, REACTION_CLIP, STAGE_CLIPS, supportsAlphaWebm, type ClipName, type StageClips } from "./clips";

const CLIP_NAMES: ClipName[] = ["idle", "hello", "celebrate"];

let cachedSupport: boolean | null = null;

function subscribeNever() {
  return () => {};
}

function getSupport(): boolean {
  if (cachedSupport === null) cachedSupport = supportsAlphaWebm();
  return cachedSupport;
}

/** True only in the browser, and only where transparent WebM works. */
function useAlphaVideoSupport(): boolean {
  return useSyncExternalStore(subscribeNever, getSupport, () => false);
}

/**
 * Animated companion: real clips (blink, wave with a smile, celebrate) made
 * with Google Flow, lined up exactly over the still PNG art. The PNG stays as
 * the layout box and as the fallback: while clips load, on Safari, with
 * reduced motion, for the face size, and for stages without clips yet.
 */
export function VideoCompanionRenderer(props: CompanionRendererProps) {
  const { stage, size, reduceMotion } = props;
  const canPlayAlpha = useAlphaVideoSupport();
  const clips = STAGE_CLIPS[stage];

  if (!clips || !canPlayAlpha || reduceMotion || size === "face") {
    return <PngCompanionRenderer {...props} />;
  }

  return <AnimatedCompanion {...props} clips={clips} />;
}

function AnimatedCompanion({ clips, reaction, onReactionEnd, ...rest }: CompanionRendererProps & { clips: StageClips }) {
  const videoRefs = useRef<Partial<Record<ClipName, HTMLVideoElement | null>>>({});
  const [readyClips, setReadyClips] = useState<ReadonlySet<ClipName>>(() => new Set());
  const requested = REACTION_CLIP[reaction];
  // Play the requested clip once buffered; until then fall back to idle, then to the still art.
  const active: ClipName | null =
    requested && readyClips.has(requested) ? requested : readyClips.has("idle") ? "idle" : null;
  const isAnimating = active !== null;

  useEffect(() => {
    for (const name of CLIP_NAMES) {
      const video = videoRefs.current[name];
      if (!video) continue;
      if (name === active && requested !== null) {
        if (!LOOPING_CLIPS.has(name)) video.currentTime = 0;
        void video.play().catch(() => {
          // Autoplay can be refused (e.g. data saver); the paused pose stays visible.
        });
      } else {
        video.pause();
        if (!LOOPING_CLIPS.has(name)) video.currentTime = 0;
      }
    }
  }, [active, requested, reaction]);

  const { body } = clips;
  const frameStyle = {
    left: `${(-body.left / body.width) * 100}%`,
    top: `${(-body.top / body.height) * 100}%`,
    width: `${100 / body.width}%`,
    height: `${100 / body.height}%`,
  };

  const overlay = (
    <span aria-hidden className="pointer-events-none absolute block" style={frameStyle}>
      {CLIP_NAMES.map((name) => (
        <video
          key={name}
          ref={(element) => {
            videoRefs.current[name] = element;
          }}
          src={clips.src[name]}
          muted
          playsInline
          preload="auto"
          loop={LOOPING_CLIPS.has(name)}
          width={clips.video.width}
          height={clips.video.height}
          onCanPlayThrough={() =>
            setReadyClips((previous) => (previous.has(name) ? previous : new Set(previous).add(name)))
          }
          onEnded={() => {
            if (!LOOPING_CLIPS.has(name)) onReactionEnd?.();
          }}
          className={cn("absolute inset-0 h-full w-full", name === active ? "visible" : "invisible")}
        />
      ))}
    </span>
  );

  return (
    <PngCompanionRenderer
      {...rest}
      // While a clip plays, the clip is the motion: no extra CSS bounce.
      reaction={isAnimating ? "focus" : reaction}
      onReactionEnd={isAnimating ? undefined : onReactionEnd}
      overlay={overlay}
      hideArt={isAnimating}
    />
  );
}

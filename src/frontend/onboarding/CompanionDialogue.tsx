"use client";

import { useEffect, useState } from "react";
import { AriBubble } from "@/frontend/components/AriBubble";
import { Companion } from "@/frontend/companion";
import { usePrefersReducedMotion } from "@/frontend/lib/usePrefersReducedMotion";

interface CompanionDialogueProps {
  messages: readonly string[];
  name?: string;
}

/** Short, sequential companion dialogue with a skippable typewriter reveal. */
export function CompanionDialogue({ messages, name = "Ari" }: CompanionDialogueProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(reduceMotion ? messages[0]?.length ?? 0 : 0);
  const current = messages[index] ?? "";
  const finished = reduceMotion || visible >= current.length;

  useEffect(() => {
    if (reduceMotion || visible >= current.length) return;
    const timer = window.setTimeout(() => setVisible((value) => Math.min(current.length, value + 2)), 32);
    return () => window.clearTimeout(timer);
  }, [current.length, reduceMotion, visible]);

  const advance = () => {
    if (!finished) {
      setVisible(current.length);
    } else if (index < messages.length - 1) {
      setIndex((value) => value + 1);
      setVisible(0);
    } else {
      setIndex(0);
      setVisible(0);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <AriBubble name={name} avatar={<Companion stage="child" reaction="idle" look={{ room: "lavender", outfit: "original" }} size="face" />}>
        <span aria-live="off" aria-hidden="true">{current.slice(0, reduceMotion ? current.length : visible)}{!finished ? <span className="animate-pulse">|</span> : null}</span>
        <span className="sr-only">{current}</span>
      </AriBubble>
      <button type="button" onClick={advance} className="self-end rounded-button px-4 py-2 font-heading text-meta font-bold text-accent-strong focus-visible:outline-2">
        {!finished ? "Show full message" : index < messages.length - 1 ? "Next message" : "Replay"}
        <span className="ml-2" aria-hidden="true">→</span>
      </button>
    </div>
  );
}

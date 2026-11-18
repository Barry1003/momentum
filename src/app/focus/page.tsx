"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// The timer reads the clock and this device's saved session, so it renders in the browser only.
const FocusScreen = dynamic(() => import("@/frontend/focus/FocusScreen").then((mod) => mod.FocusScreen), {
  ssr: false,
  loading: () => <div className="min-h-dvh bg-[#2f1d66]" />,
});

export default function FocusPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#2f1d66]" />}>
      <FocusScreen />
    </Suspense>
  );
}

"use client";

/* Tap counting. Every pointerdown on an interactive control counts, including
   the ones that turn out to be mistakes — because the claim being tested is
   "fewer taps to finish the job", not "fewer taps on the happy path". */

let taps = 0;
let started = 0;
let armed = false;

export function armTapCounter() {
  if (armed || typeof window === "undefined") return;
  armed = true;
  started = performance.now();
  window.addEventListener(
    "pointerdown",
    (e) => {
      const el = (e.target as HTMLElement | null)?.closest(
        "button,[role='button'],a[href],input,select,summary",
      );
      if (el) taps += 1;
    },
    { capture: true },
  );
}

export function tapMark() {
  return { taps, ms: performance.now() - started };
}

export function tapDelta(from: { taps: number; ms: number }) {
  return {
    taps: taps - from.taps,
    seconds: Math.max(1, Math.round((performance.now() - started - from.ms) / 1000)),
  };
}

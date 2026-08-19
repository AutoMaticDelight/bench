"use client";

import { useRef, useState } from "react";
import { IconLock } from "./Icon";

/* Friction belongs on the irreversible action, never on the safety action.
   Raising a non-conformance is one tap. Signing the permanent build record
   is a deliberate 1.2s hold — gloved hands brush screens. */
export function HoldToCommit({
  label,
  sub,
  onCommit,
  ms = 1200,
}: {
  label: string;
  sub?: string;
  onCommit: () => void;
  ms?: number;
}) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    setHolding(true);
    timer.current = setTimeout(() => {
      setHolding(false);
      onCommit();
    }, ms);
  };
  const stop = () => {
    setHolding(false);
    if (timer.current) clearTimeout(timer.current);
  };

  return (
    <button
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      className="btn btn-go btn-xl relative w-full overflow-hidden"
    >
      <span
        aria-hidden
        className="absolute inset-0 origin-left"
        style={{
          background: "var(--press)",
          transform: "scaleX(0)",
          animation: holding ? `holdfill ${ms}ms linear forwards` : "none",
        }}
      />
      <span className="relative flex items-center gap-3">
        <IconLock size={24} />
        <span className="flex flex-col items-start leading-tight">
          <span>{label}</span>
          {sub && <span className="t-caption" style={{ color: "inherit", opacity: 0.75 }}>{holding ? "Keep holding…" : sub}</span>}
        </span>
      </span>
    </button>
  );
}

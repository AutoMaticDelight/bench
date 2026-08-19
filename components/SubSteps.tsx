"use client";

import { useState } from "react";
import { IconCheck } from "./Icon";
import { AssemblyDiagram } from "./art/Assembly";

/* Order is enforced, one item at a time. Completed work collapses to a row of
   ticks, the current item is the only thing rendered at full size, and what is
   coming stays visible as one-liners. A flat list of seven equal checkboxes is
   what a paper traveler is — and why stack-up defects survive to buy-off. */
export function SubSteps({
  items,
  onDone,
}: {
  items: { text: string; caution?: string }[];
  onDone: () => void;
}) {
  const [at, setAt] = useState(0);
  const [nudge, setNudge] = useState<number | null>(null);
  const complete = at >= items.length;

  function tick(i: number) {
    if (i !== at) {
      setNudge(i);
      setTimeout(() => setNudge(null), 1100);
      return;
    }
    const n = at + 1;
    setAt(n);
    if (n >= items.length) onDone();
  }

  return (
    <div className="flex flex-col" style={{ gap: "var(--gap)" }}>
      <figure className="panel" style={{ padding: "var(--pad)" }}>
        <div className="mb-1 flex items-center justify-between">
          <p className="t-label">Stack-up — outboard to inboard</p>
          <span className={complete ? "chip chip-go" : "chip chip-mute"}>
            {Math.min(at, items.length)} of {items.length}
          </span>
        </div>
        <AssemblyDiagram done={at} current={complete ? -1 : at} />
      </figure>

      {/* done — collapsed to ticks */}
      {at > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {items.slice(0, at).map((it, i) => (
            <span key={it.text} title={it.text}
              className="grid place-items-center rounded-full"
              style={{ width: "1.75rem", height: "1.75rem", background: "var(--color-go)", color: "var(--on-go)" }}>
              <IconCheck size={16} />
            </span>
          ))}
          <span className="t-caption">{at} done, in order</span>
        </div>
      )}

      {/* current — the only thing at full size */}
      {!complete && (
        <button
          onClick={() => tick(at)}
          className="panel flex w-full items-start gap-3 text-left"
          style={{ padding: "var(--pad)", borderColor: "var(--fg)", borderWidth: "2px" }}
        >
          <span className="grid shrink-0 place-items-center rounded-full"
            style={{ width: "2.25rem", height: "2.25rem", background: "var(--fg)", color: "var(--bg)" }}>
            <span className="t-id">{at + 1}</span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="t-head block">{items[at].text}</span>
            {items[at].caution && <span className="t-caption fg-hold mt-1 block">{items[at].caution}</span>}
            <span className="t-caption mt-1 block">Tap when done</span>
          </span>
        </button>
      )}

      {/* upcoming — one line each, still tappable so the order rule is felt */}
      {items.slice(at + 1).map((it, k) => {
        const i = at + 1 + k;
        const scolded = nudge === i;
        return (
          <button key={it.text} onClick={() => tick(i)}
            className="flex w-full items-center gap-3 rounded-token text-left"
            style={{
              padding: "0.5rem var(--pad)",
              opacity: scolded ? 1 : 0.5,
              background: scolded ? "var(--stop-soft)" : "transparent",
            }}>
            <span className="t-id shrink-0" style={{ color: scolded ? "var(--color-stop)" : "var(--fg-mute)" }}>
              {i + 1}
            </span>
            <span className="t-sub truncate" style={{ color: scolded ? "var(--color-stop)" : "var(--fg-dim)" }}>
              {scolded ? `Out of order — finish ${at + 1} first.` : it.text}
            </span>
          </button>
        );
      })}

      {complete && (
        <p className="t-caption fg-go">Stack-up recorded in order, each item timestamped.</p>
      )}
    </div>
  );
}

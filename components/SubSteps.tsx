"use client";

import { useState } from "react";
import { IconCheck } from "./Icon";
import { AssemblyDiagram } from "./art/Assembly";

/* Order is enforced, one item at a time. The list does not present itself as
   seven equal checkboxes a technician can tick in any order at the end of the
   task — which is what a paper traveler is, and why stack-up defects survive
   to buy-off. */
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
        <div className="mb-2 flex items-center justify-between">
          <p className="t-label">Stack-up — outboard to inboard</p>
          <span className={complete ? "chip chip-go" : "chip chip-mute"}>
            {Math.min(at, items.length)} of {items.length}
          </span>
        </div>
        <AssemblyDiagram done={at} current={complete ? -1 : at} />
        <figcaption className="t-caption mt-1">
          {complete
            ? "Stack-up complete, in order, each item timestamped."
            : "White and pulsing is the part in your hand right now. Green is placed."}
        </figcaption>
      </figure>

      <ol className="flex flex-col" style={{ gap: "calc(var(--gap) * 0.6)" }}>
        {items.map((it, i) => {
          const done = i < at;
          const current = i === at;
          const scolded = nudge === i;
          return (
            <li key={it.text}>
              <button
                onClick={() => tick(i)}
                disabled={done}
                className="panel flex w-full items-start gap-3 text-left"
                style={{
                  padding: "var(--pad)",
                  opacity: done ? 0.55 : current ? 1 : 0.62,
                  borderColor: scolded
                    ? "var(--color-stop)"
                    : current
                      ? "var(--fg)"
                      : done
                        ? "color-mix(in srgb, var(--color-go) 40%, transparent)"
                        : "var(--line)",
                  background: done ? "var(--go-soft)" : scolded ? "var(--stop-soft)" : "var(--panel)",
                  cursor: done ? "default" : "pointer",
                }}
              >
                <span
                  className="grid shrink-0 place-items-center rounded-full"
                  style={{
                    width: "2.25rem",
                    height: "2.25rem",
                    background: done ? "var(--color-go)" : current ? "var(--fg)" : "var(--panel-2)",
                    color: done ? "var(--on-go)" : current ? "var(--bg)" : "var(--fg-mute)",
                  }}
                >
                  {done ? <IconCheck size={20} /> : <span className="t-id">{i + 1}</span>}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="t-sub block">{it.text}</span>
                  {it.caution && !done && (
                    <span className="t-caption fg-hold mt-1 block">{it.caution}</span>
                  )}
                  {scolded && (
                    <span className="t-caption fg-stop mt-1 block">
                      Out of order — finish {at + 1} first.
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {complete && (
        <p className="t-caption fg-go">
          Stack-up recorded in order, with a timestamp on each item.
        </p>
      )}
    </div>
  );
}

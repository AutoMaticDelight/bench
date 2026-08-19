"use client";

import { useState } from "react";
import { IconCheck } from "./Icon";
import { FlangeArt } from "./art/Parts";

const ORDER = [1, 5, 3, 7, 2, 6, 4, 8];
const PASSES = [
  { label: "Pass 1 — 50%", target: "22 in-lbf" },
  { label: "Pass 2 — final", target: "45 in-lbf ±3" },
];

function pos(n: number) {
  const a = (-90 + (n - 1) * 45) * (Math.PI / 180);
  return { x: 50 + 34 * Math.cos(a), y: 50 + 34 * Math.sin(a) };
}

export function TorqueSequence({ onDone }: { onDone: () => void }) {
  const [toolOk, setToolOk] = useState(false);
  const [pass, setPass] = useState(0);
  const [idx, setIdx] = useState(0);
  const [err, setErr] = useState<number | null>(null);

  const next = ORDER[idx];
  const doneThisPass = ORDER.slice(0, idx);

  function tap(n: number) {
    if (!toolOk) return;
    if (n !== next) {
      setErr(n);
      setTimeout(() => setErr(null), 900);
      return;
    }
    const i = idx + 1;
    if (i < ORDER.length) return setIdx(i);
    if (pass === 0) {
      setPass(1);
      setIdx(0);
      return;
    }
    setIdx(i);
    onDone();
  }

  if (!toolOk) {
    return (
      <div className="panel" style={{ padding: "var(--pad)" }}>
        <p className="t-label mb-2">Before the first pull</p>
        <p className="t-body mb-4">
          Scan the torque wrench. The build record needs the tool serial, and an out-of-cal
          tool has to stop the step — not get caught at buy-off.
        </p>
        <button className="btn btn-primary btn-xl w-full" onClick={() => setToolOk(true)}>
          Scan torque wrench
        </button>
      </div>
    );
  }

  const complete = pass === 1 && idx >= ORDER.length;

  return (
    <div className="flex flex-col" style={{ gap: "var(--gap)" }}>
      <div
        className="panel flex items-center justify-between"
        style={{ padding: "var(--pad)", background: "var(--go-soft)", borderColor: "transparent" }}
      >
        <div>
          <p className="t-label fg-go">Tool verified</p>
          <p className="t-id mt-1">TRQ-118 · cal due 2026-11-04</p>
        </div>
        <IconCheck size={26} className="fg-go" />
      </div>

      <div className="panel" style={{ padding: "var(--pad)" }}>
        <div className="flex items-baseline justify-between">
          <p className="t-label">{PASSES[pass].label}</p>
          <p className="t-caption">{doneThisPass.length} of 8</p>
        </div>
        <p className="t-mega mt-1">{PASSES[pass].target}</p>

        <div className="mt-4 flex items-center gap-5">
          <svg viewBox="0 0 100 100" className="w-[46%] max-w-[220px] shrink-0" role="img" aria-label="Fastener pattern">
            <FlangeArt />
            {ORDER.map((n, i) => {
              if (i === 0 || i > doneThisPass.length - 1) return null;
              const a = pos(ORDER[i - 1]);
              const b = pos(n);
              return (
                <line key={`l${n}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke="var(--color-go)" strokeWidth="1.5" strokeDasharray="3 2" opacity={0.7} />
              );
            })}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
              const { x, y } = pos(n);
              const done = doneThisPass.includes(n);
              const isNext = n === next;
              const isErr = err === n;
              return (
                <g key={n} onClick={() => tap(n)} style={{ cursor: "pointer" }}>
                  <circle cx={x} cy={y} r="11" fill="transparent" />
                  <circle
                    cx={x} cy={y} r="8.5"
                    fill={isErr ? "var(--color-stop)" : done ? "var(--color-go)" : isNext ? "var(--fg)" : "var(--panel-2)"}
                    stroke={isNext && !done ? "var(--fg)" : "var(--line)"}
                    strokeWidth={isNext ? 2 : 1}
                  />
                  <text
                    x={x} y={y + 2.8} textAnchor="middle"
                    style={{ fontSize: 8, fontWeight: 700, fontFamily: "var(--font-mono)" }}
                    fill={isErr ? "var(--on-stop)" : done ? "var(--on-go)" : isNext ? "var(--bg)" : "var(--fg-mute)"}
                  >
                    {n}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="min-w-0 flex-1">
            {complete ? (
              <p className="t-title fg-go">Both passes complete</p>
            ) : err !== null ? (
              <>
                <p className="t-title fg-stop">Out of sequence</p>
                <p className="t-body mt-1">Position {err} is not next. Go to {next}.</p>
              </>
            ) : (
              <>
                <p className="t-label">Next position</p>
                <p className="t-num mt-1">{next}</p>
                <p className="t-caption mt-1">Tap the position as you pull it.</p>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="t-caption">
        Sequence is enforced, not printed. The traveler already told them the order — the
        difference is that a wrong pull is caught at the wrench instead of at buy-off.
      </p>
    </div>
  );
}

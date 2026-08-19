"use client";

import { useEffect, useRef, useState } from "react";
import { IconCheck } from "./Icon";
import type { SetRail } from "@/lib/rail";

const ORDER = [1, 5, 3, 7, 2, 6, 4, 8];
const PASSES = [
  { label: "Pass 1 — snug", target: "22 in-lbf", value: 22 },
  { label: "Pass 2 — final", target: "45 in-lbf ±3", value: 45 },
];
const FULL = 45;

function pos(n: number) {
  const a = (-90 + (n - 1) * 45) * (Math.PI / 180);
  return { x: 50 + 34 * Math.cos(a), y: 50 + 34 * Math.sin(a) };
}

/* A bolt head, not a dot. Dim outline = untouched, amber = snugged on
   pass 1, green = at final torque. The pattern itself is the progress bar. */
function Bolt({ n, level, next, err }: { n: number; level: number; next: boolean; err: boolean }) {
  const { x, y } = pos(n);
  const face =
    err ? "var(--color-stop)"
      : level === 2 ? "var(--color-go)"
      : level === 1 ? "var(--color-hold)"
      : next ? "var(--fg)"
      : "var(--panel-2)";
  const ink =
    err || level === 2 ? "var(--on-stop)"
      : level === 1 ? "var(--on-go)"
      : next ? "var(--bg)"
      : "var(--fg-mute)";
  const hex = 4.6;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = ((i * 60 - 30) * Math.PI) / 180;
    return `${x + hex * Math.cos(a)},${y + hex * Math.sin(a)}`;
  }).join(" ");

  return (
    <g style={{ transition: "opacity 240ms ease" }}>
      {next && (
        <circle cx={x} cy={y} r="12.5" fill="none" stroke="var(--fg)" strokeWidth="1.2"
          opacity={0.9} className="animate-flash" />
      )}
      <circle cx={x} cy={y} r="9" fill={face} stroke={err ? "var(--color-stop)" : "var(--line)"}
        strokeWidth={next ? 1.6 : 1} style={{ transition: "fill 260ms ease" }} />
      {/* hex socket */}
      <polygon points={pts} fill="none" stroke={ink} strokeWidth="1.1" opacity={0.85}
        style={{ transition: "stroke 260ms ease" }} />
      <text x={x} y={y - 12.5} textAnchor="middle" stroke="none"
        fill={level === 2 ? "var(--color-go)" : level === 1 ? "var(--color-hold)" : "var(--fg-mute)"}
        style={{ fontSize: 7.5, fontFamily: "var(--font-mono)", fontWeight: 700, transition: "fill 260ms ease" }}>
        {n}
      </text>
    </g>
  );
}

/* Arc gauge — sweeps to the value on every pull, then releases. Gives the
   pull a physical acknowledgement instead of a number silently incrementing. */
function Gauge({ value, target }: { value: number; target: number }) {
  const R = 34;
  const LEN = Math.PI * R; // half circle
  const frac = Math.min(1, value / FULL);
  const tgt = target / FULL;
  return (
    <svg viewBox="0 0 100 62" className="w-full" role="img" aria-label={`${value} inch-pounds`}>
      <path d="M16 50a34 34 0 0 1 68 0" fill="none" stroke="var(--line)" strokeWidth="7" strokeLinecap="round" />
      {/* target tick */}
      <g transform={`rotate(${-180 + tgt * 180} 50 50)`}>
        <path d="M11 50h10" stroke="var(--fg-dim)" strokeWidth="1.6" />
      </g>
      <path d="M16 50a34 34 0 0 1 68 0" fill="none"
        stroke={value >= target ? "var(--color-go)" : "var(--color-hold)"}
        strokeWidth="7" strokeLinecap="round"
        strokeDasharray={LEN} strokeDashoffset={LEN * (1 - frac)}
        style={{ transition: "stroke-dashoffset 420ms cubic-bezier(.2,.8,.2,1), stroke 240ms ease" }} />
      <text x="50" y="44" textAnchor="middle" stroke="none" fill="var(--fg)"
        style={{ fontSize: 17, fontFamily: "var(--font-mono)", fontWeight: 700 }}>
        {value}
      </text>
      <text x="50" y="55" textAnchor="middle" stroke="none" fill="var(--fg-mute)"
        style={{ fontSize: 7, fontFamily: "var(--font-mono)" }}>
        in-lbf
      </text>
      <text x="16" y="60" textAnchor="middle" stroke="none" fill="var(--fg-mute)"
        style={{ fontSize: 6, fontFamily: "var(--font-mono)" }}>0</text>
      <text x="84" y="60" textAnchor="middle" stroke="none" fill="var(--fg-mute)"
        style={{ fontSize: 6, fontFamily: "var(--font-mono)" }}>{FULL}</text>
    </svg>
  );
}

export function TorqueSequence({ onDone, setRail }: { onDone: () => void; setRail: SetRail }) {
  const [toolOk, setToolOk] = useState(false);
  const [pass, setPass] = useState(0);
  const [idx, setIdx] = useState(0);
  const [err, setErr] = useState<number | null>(null);
  const [levels, setLevels] = useState<Record<number, number>>({});
  const [gauge, setGauge] = useState(0);
  const relax = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (relax.current) clearTimeout(relax.current); }, []);

  useEffect(() => {
    setRail(toolOk ? null : { label: "Scan torque wrench", run: () => setToolOk(true) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolOk]);

  const next = ORDER[idx];
  const complete = pass === 1 && idx >= ORDER.length;
  const path = ORDER.slice(0, idx).map((n) => `${pos(n).x},${pos(n).y}`).join(" ");

  function tap(n: number) {
    if (!toolOk || complete) return;
    if (n !== next) {
      setErr(n);
      setTimeout(() => setErr(null), 900);
      return;
    }
    setLevels((l) => ({ ...l, [n]: pass + 1 }));
    /* Drop to zero then sweep back up, so every pull reads as its own event —
       and hold the value afterwards. A gauge that rests at 0 looks broken. */
    setGauge(0);
    if (relax.current) clearTimeout(relax.current);
    relax.current = setTimeout(() => setGauge(PASSES[pass].value), 40);

    const i = idx + 1;
    if (i < ORDER.length) return setIdx(i);
    if (pass === 0) { setPass(1); setIdx(0); return; }
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
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ gap: "var(--gap)" }}>
      <div className="panel flex items-center justify-between"
        style={{ padding: "var(--pad)", background: "var(--go-soft)", borderColor: "transparent" }}>
        <div>
          <p className="t-label fg-go">Tool verified</p>
          <p className="t-id mt-1">TRQ-118 · cal due 2026-11-04</p>
        </div>
        <IconCheck size={26} className="fg-go" />
      </div>

      <div className="panel" style={{ padding: "var(--pad)" }}>
        <div className="flex items-baseline justify-between">
          <p className="t-label" style={{ color: complete ? "var(--color-go)" : "var(--fg)" }}>
            {complete ? "Both passes complete" : PASSES[pass].label}
          </p>
          <span className={complete ? "chip chip-go" : pass === 1 ? "chip chip-hold" : "chip chip-mute"}>
            {idx} of 8
          </span>
        </div>

        <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <svg viewBox="-9 -9 118 118" className="w-3/5 max-w-64 shrink-0 sm:w-1/2" role="img"
            aria-label="Bolt pattern and torque sequence">
            {/* flange */}
            <circle cx="50" cy="50" r="43" fill="none" stroke="var(--fg-mute)" strokeWidth="1.2" opacity={0.7} />
            <circle cx="50" cy="50" r="34" fill="none" stroke="var(--fg-mute)" strokeWidth="0.7"
              strokeDasharray="4 3" opacity={0.5} />
            <circle cx="50" cy="50" r="14" fill="none" stroke="var(--fg-mute)" strokeWidth="1.2" opacity={0.7} />
            <path d="M50 4v92M4 50h92" stroke="var(--fg-mute)" strokeWidth="0.6"
              strokeDasharray="9 3 2 3" opacity={0.35} fill="none" />

            {/* the star path, drawn as it is pulled */}
            {idx > 1 && (
              <polyline points={path} fill="none"
                stroke={pass === 1 ? "var(--color-go)" : "var(--color-hold)"}
                strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />
            )}
            {/* the leg you are about to pull */}
            {idx > 0 && !complete && (
              <line x1={pos(ORDER[idx - 1]).x} y1={pos(ORDER[idx - 1]).y}
                x2={pos(next).x} y2={pos(next).y}
                stroke="var(--fg)" strokeWidth="1.2" strokeDasharray="3 3" opacity={0.6} />
            )}

            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <g key={n} onClick={() => tap(n)} style={{ cursor: complete ? "default" : "pointer" }}>
                <circle cx={pos(n).x} cy={pos(n).y} r="13" fill="transparent" />
                <Bolt n={n} level={levels[n] ?? 0} next={n === next && !complete} err={err === n} />
              </g>
            ))}
          </svg>

          <div className="w-full min-w-0 flex-1">
            <div className="mx-auto" style={{ maxWidth: "11rem" }}>
              <Gauge value={gauge} target={PASSES[pass].value} />
            </div>
            {complete ? (
              <p className="t-sub fg-go mt-1 text-center">All eight at final torque</p>
            ) : err !== null ? (
              <p className="t-sub fg-stop mt-1 text-center">Position {err} is not next — go to {next}</p>
            ) : (
              <p className="t-caption mt-1 text-center">
                Tap position <span className="t-id">{next}</span> as you pull it
              </p>
            )}
          </div>
        </div>

        <div className="rule mt-3 flex items-center justify-between pt-3">
          <span className="chip chip-hold">snug</span>
          <span className="t-caption">amber = pass 1 · green = final</span>
          <span className="chip chip-go">final</span>
        </div>
      </div>

      <p className="t-caption">
        Sequence is enforced, not printed. The traveler already told them the order — the
        difference is that a wrong pull is caught at the wrench instead of at buy-off.
      </p>
    </div>
  );
}

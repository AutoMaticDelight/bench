"use client";

import { useState } from "react";

/* Steps completed per hour against plan. One measure, one axis — the dip is
   the story, so the bars that missed plan carry a status colour and a direct
   label, and the ones that met it stay quiet. */

const PLAN = 12;
const HOURS: [string, number][] = [
  ["06", 13], ["07", 14], ["08", 12], ["09", 7],
  ["10", 6],  ["11", 9],  ["12", 13], ["13", 12],
];

const W = 640, H = 190, PAD_L = 30, PAD_R = 10, PAD_T = 24, PAD_B = 26;
const MAX = 16;
const plotW = W - PAD_L - PAD_R;
const plotH = H - PAD_T - PAD_B;
const slot = plotW / HOURS.length;
const BAR = slot - 8;              // 8px of surface between bars
const y = (v: number) => PAD_T + plotH - (v / MAX) * plotH;

/** rounded data-end, square at the baseline */
function barPath(x: number, v: number) {
  const top = y(v), bottom = PAD_T + plotH, r = Math.min(4, (bottom - top) / 2);
  return `M${x} ${bottom} L${x} ${top + r} Q${x} ${top} ${x + r} ${top}
          L${x + BAR - r} ${top} Q${x + BAR} ${top} ${x + BAR} ${top + r}
          L${x + BAR} ${bottom} Z`;
}

export function Throughput() {
  const [hover, setHover] = useState<number | null>(null);
  const total = HOURS.reduce((a, [, v]) => a + v, 0);
  const missed = HOURS.filter(([, v]) => v < PLAN).length;

  return (
    <figure>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="t-head">Steps completed per hour</span>
        <span className="t-caption">
          {total} this shift · {missed} hours below plan
        </span>
      </figcaption>

      <div className="relative mt-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
          aria-label={`Steps completed per hour against a plan of ${PLAN}. ${total} steps this shift, ${missed} hours below plan.`}>
          {/* recessive grid */}
          {[0, 4, 8, 12, 16].map((v) => (
            <g key={v}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y(v)} y2={y(v)}
                stroke="var(--line-soft)" strokeWidth="1" />
              <text x={PAD_L - 7} y={y(v) + 3.5} textAnchor="end"
                style={{ fontSize: 10, fontFamily: "var(--font-mono)" }} fill="var(--fg-mute)">{v}</text>
            </g>
          ))}

          {/* plan reference */}
          <line x1={PAD_L} x2={W - PAD_R} y1={y(PLAN)} y2={y(PLAN)}
            stroke="var(--fg-dim)" strokeWidth="1.5" strokeDasharray="5 4" />
          <text x={W - PAD_R} y={y(PLAN) - 6} textAnchor="end"
            style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 600 }}
            fill="var(--fg-dim)">plan {PLAN}</text>

          {HOURS.map(([h, v], i) => {
            const x = PAD_L + i * slot + 4;
            const behind = v < PLAN;
            const on = hover === i;
            return (
              <g key={h} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <rect x={PAD_L + i * slot} y={PAD_T} width={slot} height={plotH} fill="transparent" />
                <path d={barPath(x, v)}
                  fill={behind ? "var(--data-behind)" : "var(--data-on)"}
                  opacity={hover === null || on ? 1 : 0.55}
                  style={{ transition: "opacity 140ms ease" }} />
                {(behind || v === MAX - 2) && (
                  <text x={x + BAR / 2} y={y(v) - 6} textAnchor="middle"
                    style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700 }}
                    fill={behind ? "var(--data-behind)" : "var(--fg-dim)"}>{v}</text>
                )}
                <text x={x + BAR / 2} y={H - 8} textAnchor="middle"
                  style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                  fill={on ? "var(--fg)" : "var(--fg-mute)"}>{h}</text>
              </g>
            );
          })}
        </svg>

        {hover !== null && (
          <div className="panel pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2"
            style={{ padding: "0.5rem 0.75rem" }}>
            <span className="t-id">{HOURS[hover][0]}:00 — {HOURS[hover][1]} steps</span>
            <span className="t-caption">
              {" "}{HOURS[hover][1] < PLAN ? `${PLAN - HOURS[hover][1]} below plan` : "on plan"}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-4">
        <span className="flex items-center gap-2">
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--data-on)" }} />
          <span className="t-caption">Met plan</span>
        </span>
        <span className="flex items-center gap-2">
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--data-behind)" }} />
          <span className="t-caption">Below plan</span>
        </span>
        <span className="t-caption">
          The 09:00–11:00 dip is WO-2288 sitting on NCR-0447 awaiting MRB.
        </span>
      </div>
    </figure>
  );
}

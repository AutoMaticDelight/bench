"use client";

import { useEffect, useRef, useState } from "react";
import { IconCheck } from "./Icon";
import type { SetRail } from "@/lib/rail";

import { BoltPattern, Gauge, ORDER } from "./art/Torque";

const PASSES = [
  { label: "Pass 1 — snug", target: "22 in-lbf", value: 22 },
  { label: "Pass 2 — final", target: "45 in-lbf ±3", value: 45 },
];

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
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="t-label" style={{ color: complete ? "var(--color-go)" : "var(--fg)" }}>
              {complete ? "Both passes complete" : PASSES[pass].label}
            </p>
            <p className="t-id-lg mt-0.5">{complete ? "45 in-lbf ±3" : PASSES[pass].target}</p>
          </div>
          <span className={complete ? "chip chip-go" : pass === 1 ? "chip chip-hold" : "chip chip-mute"}>
            {idx} of 8
          </span>
        </div>

        <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <BoltPattern
            levels={levels}
            next={complete ? null : next}
            err={err}
            idx={idx}
            pass={pass}
            onTap={tap}
            className="w-3/5 max-w-64 shrink-0 sm:w-1/2"
          />

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

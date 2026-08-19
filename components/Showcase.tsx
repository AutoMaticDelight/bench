"use client";

import { useEffect, useRef, useState } from "react";
import { BoltPattern, Gauge, ORDER } from "./art/Torque";
import { Fixture3D } from "./Fixture3D";
import { AssemblyDiagram } from "./art/Assembly";
import { PartArt } from "./art/Parts";
import { IconX } from "./Icon";

/* Not a screenshot — the same components the technician surface renders,
   dropped into the desk page and re-resolving their tokens against the floor
   surface. If the product changes, this changes with it. */

const PASSES = [
  { label: "Pass 1 — snug", target: "22 in-lbf", value: 22 },
  { label: "Pass 2 — final", target: "45 in-lbf ±3", value: 45 },
];

/* Runs the actual star sequence on a loop — same component the technician
   screen uses, driven by a timer instead of a thumb. */
function AnimatedTorque() {
  const [levels, setLevels] = useState<Record<number, number>>({});
  const [idx, setIdx] = useState(0);
  const [pass, setPass] = useState(0);
  const [gauge, setGauge] = useState(0);
  const [done, setDone] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLevels(Object.fromEntries(ORDER.map((n) => [n, 2])));
      setIdx(8); setPass(1); setGauge(45); setDone(true);
      return;
    }

    let raf = 0, timer: ReturnType<typeof setTimeout>, alive = true, visible = true;
    let lv: Record<number, number> = {}, i = 0, p = 0;

    const io = new IntersectionObserver(
      (es) => es.forEach((e) => (visible = e.isIntersecting)), { threshold: 0.15 });
    if (box.current) io.observe(box.current);

    const ramp = (to: number, ms: number, cb: () => void) => {
      let t0: number | null = null;
      const step = (t: number) => {
        if (!alive) return;
        if (t0 === null) t0 = t;
        const k = Math.min(1, (t - t0) / ms);
        setGauge(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) raf = requestAnimationFrame(step); else cb();
      };
      raf = requestAnimationFrame(step);
    };

    const pull = () => {
      if (!alive) return;
      if (!visible) { timer = setTimeout(pull, 400); return; }
      const n = ORDER[i];
      ramp(PASSES[p].value, 620, () => {
        lv = { ...lv, [n]: p + 1 };
        setLevels(lv);
        setIdx(i + 1);
        timer = setTimeout(() => {
          i += 1;
          if (i < 8) return pull();
          if (p === 0) { p = 1; i = 0; setPass(1); setIdx(0); timer = setTimeout(pull, 700); return; }
          setDone(true);
          timer = setTimeout(() => {
            lv = {}; i = 0; p = 0;
            setLevels({}); setIdx(0); setPass(0); setGauge(0); setDone(false);
            timer = setTimeout(pull, 600);
          }, 2600);
        }, 260);
      });
    };
    timer = setTimeout(pull, 500);

    return () => { alive = false; cancelAnimationFrame(raf); clearTimeout(timer); io.disconnect(); };
  }, []);

  const next = done ? null : ORDER[idx];

  return (
    <div ref={box}>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="t-label" style={{ color: done ? "var(--color-go)" : "var(--fg)" }}>
            {done ? "Both passes complete" : PASSES[pass].label}
          </p>
          <p className="t-id-lg mt-0.5">{done ? "45 in-lbf ±3" : PASSES[pass].target}</p>
        </div>
        <span className={done ? "chip chip-go" : pass === 1 ? "chip chip-hold" : "chip chip-mute"}>
          {idx} of 8
        </span>
      </div>

      <div className="mt-2 flex items-center gap-4">
        <BoltPattern levels={levels} next={next} idx={idx} pass={pass}
          className="w-1/2 max-w-56 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="mx-auto" style={{ maxWidth: "10rem" }}>
            <Gauge value={Math.round(gauge)} target={PASSES[pass].value} />
          </div>
          <p className="t-caption mt-1 text-center">
            {done ? "All eight at final torque"
                  : <>Pulling position <span className="t-id">{next}</span></>}
          </p>
        </div>
      </div>

      <div className="rule mt-3 flex items-center justify-between pt-3">
        <span className="chip chip-hold">snug</span>
        <span className="t-caption">amber = pass 1 · green = final</span>
        <span className="chip chip-go">final</span>
      </div>

      <Fixture3D />
    </div>
  );
}

export function Showcase() {
  return (
    <div className="flex flex-col gap-3">
      {/* the torque step, as it actually renders */}
      <div data-surface="floor" className="panel overflow-hidden" style={{ borderRadius: "0.875rem" }}>
        <div className="flex items-center justify-between border-b border-line"
          style={{ padding: "0.75rem 1rem" }}>
          <div className="flex items-baseline gap-2">
            <span className="t-id whitespace-nowrap" style={{ fontWeight: 700 }}>WO-2291</span>
            <span className="chip chip-info">BUS-104</span>
          </div>
          <span className="t-caption whitespace-nowrap">
            Step 3 of 5<span className="hidden sm:inline"> · Integration Bay 2</span>
          </span>
        </div>

        <div style={{ padding: "1rem" }}>
          <AnimatedTorque />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* the catch */}
        <div data-surface="floor" className="panel overflow-hidden" style={{ borderRadius: "0.875rem" }}>
          <div style={{ padding: "1rem" }}>
            <div className="panel flex items-start gap-3"
              style={{ padding: "0.875rem", background: "var(--stop-soft)", borderColor: "var(--color-stop)" }}>
              <span className="grid shrink-0 place-items-center rounded-full"
                style={{ width: "2rem", height: "2rem", background: "var(--color-stop)", color: "var(--on-stop)" }}>
                <IconX size={20} />
              </span>
              <div className="min-w-0">
                <p className="t-id" style={{ fontWeight: 700 }}>NAS1149D0463K</p>
                <p className="t-caption fg-stop mt-1">Wrong part in bin K-2291-B</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-4">
              <figure className="fg-go text-center">
                <PartArt pn="NAS1149D0463K" size={72} />
                <figcaption className="t-caption fg-go">spec · .063</figcaption>
              </figure>
              <span className="t-label">vs</span>
              <figure className="fg-stop text-center">
                <PartArt pn="NAS1149D0332K" size={72} />
                <figcaption className="t-caption fg-stop">in bin · .032</figcaption>
              </figure>
            </div>
          </div>
        </div>

        {/* the stack-up */}
        <div data-surface="floor" className="panel overflow-hidden" style={{ borderRadius: "0.875rem" }}>
          <div style={{ padding: "1rem" }}>
            <div className="flex items-center justify-between">
              <p className="t-label">Stack-up</p>
              <span className="chip chip-mute">4 of 7</span>
            </div>
            <AssemblyDiagram done={4} current={4} />
          </div>
        </div>
      </div>

      <Fixture3D />
    </div>
  );
}

"use client";

import { BoltPattern, Gauge } from "./art/Torque";
import { AssemblyDiagram } from "./art/Assembly";
import { PartArt } from "./art/Parts";
import { IconX } from "./Icon";

/* Not a screenshot — the same components the technician surface renders,
   dropped into the desk page and re-resolving their tokens against the floor
   surface. If the product changes, this changes with it. */

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
          <div className="flex items-baseline justify-between">
            <div>
              <p className="t-label">Pass 2 — final</p>
              <p className="t-id-lg mt-0.5">45 in-lbf ±3</p>
            </div>
            <span className="chip chip-hold">4 of 8</span>
          </div>

          <div className="mt-2 flex items-center gap-4">
            <BoltPattern
              levels={{ 1: 2, 5: 2, 3: 2, 7: 2, 2: 1, 6: 1, 4: 1, 8: 1 }}
              next={2}
              idx={4}
              pass={1}
              className="w-1/2 max-w-56 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="mx-auto" style={{ maxWidth: "10rem" }}>
                <Gauge value={45} target={45} />
              </div>
              <p className="t-caption mt-1 text-center">
                Tap position <span className="t-id">2</span> as you pull it
              </p>
            </div>
          </div>

          <div className="rule mt-3 flex items-center justify-between pt-3">
            <span className="chip chip-hold">snug</span>
            <span className="t-caption">amber = pass 1 · green = final</span>
            <span className="chip chip-go">final</span>
          </div>
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
    </div>
  );
}

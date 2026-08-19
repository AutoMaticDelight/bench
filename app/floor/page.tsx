"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { WO } from "@/lib/data";
import type { RailAction } from "@/lib/rail";
import { actions, useBench } from "@/lib/store";
import { armTapCounter, tapDelta, tapMark } from "@/lib/taps";
import { KitCheck } from "@/components/KitCheck";
import { TorqueSequence } from "@/components/TorqueSequence";
import { HoldToCommit } from "@/components/HoldToCommit";
import { NcrSheet } from "@/components/NcrSheet";
import { IconArrow, IconCamera, IconCheck, IconFlag } from "@/components/Icon";
import { BracketArt } from "@/components/art/Parts";
import { SubSteps } from "@/components/SubSteps";

export default function Floor() {
  const [i, setI] = useState(0);
  const [ready, setReady] = useState(false);
  const [ncrOpen, setNcrOpen] = useState(false);
  const [shot, setShot] = useState(false);
  const [mark, setMark] = useState({ taps: 0, ms: 0 });
  const [rail, setRail] = useState<RailAction | null>(null);
  const bench = useBench();
  const step = WO.steps[i];
  const done = i >= WO.steps.length;

  useEffect(() => {
    armTapCounter();
    setMark(tapMark());
  }, []);

  const onResolved = useCallback((ok: boolean) => setReady(ok), []);

  function advance() {
    const d = tapDelta(mark);
    actions.completeStep({ stepId: step.id, seconds: d.seconds, taps: d.taps, at: Date.now() });
    setI(i + 1);
    setReady(false);
    setShot(false);
    setRail(null);
    setMark(tapMark());
  }

  if (done) return <Summary />;

  return (
    <div data-surface="floor" className="flex h-dvh flex-col bg-bg">
      {/* ---- status rail: who, what, where. Never scrolls away. ---- */}
      <header className="shrink-0 border-b border-line" style={{ padding: "var(--pad)" }}>
        <div className="mx-auto w-full max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="flex items-baseline gap-2.5">
            <span className="t-id-lg">{WO.id}</span>
            <span className="chip chip-info">{WO.serial}</span>
          </div>
          <span className="t-caption">{WO.station}</span>
        </div>
        <p className="t-sub mt-1 truncate" style={{ color: "var(--fg-dim)" }}>{WO.title}</p>

        <div className="mt-3 flex items-center gap-3">
          <span className="t-label" style={{ color: "var(--fg)" }}>Step {step.seq} of {WO.steps.length}</span>
          <div className="flex flex-1 gap-1.5">
            {WO.steps.map((s, n) => (
              <span
                key={s.id}
                className="h-1.5 flex-1 rounded-full"
                style={{ background: n < i ? "var(--color-go)" : n === i ? "var(--fg)" : "var(--line)" }}
              />
            ))}
          </div>
        </div>
        </div>
      </header>

      {/* ---- the step. One task, one screen. ---- */}
      <main className="min-h-0 flex-1 overflow-y-auto" style={{ padding: "var(--pad)" }}>
        <div className="mx-auto w-full max-w-3xl">
        <h1 className="t-title">{step.title}</h1>
        <p className="t-sub mt-1" style={{ color: "var(--fg-dim)" }}>{step.instruction}</p>

        <div className="mt-4">
          {step.substeps && (
            <div>
              <SubSteps items={step.substeps} onDone={() => setReady(true)} />
            </div>
          )}

          {step.kind === "kit" && (
            <KitCheck
              fasteners={step.fasteners!}
              wo={WO.id}
              serial={WO.serial}
              station={WO.station}
              onResolved={onResolved}
              setRail={setRail}
            />
          )}

          {step.kind === "torque" && <TorqueSequence onDone={() => setReady(true)} setRail={setRail} />}

          {step.kind === "inspect" &&
            (shot ? (
              <div
                className="panel flex items-center gap-4"
                style={{ padding: "var(--pad)", background: "var(--go-soft)", borderColor: "transparent" }}
              >
                <IconCheck size={28} className="fg-go" />
                <div>
                  <p className="t-head">Witness photo attached</p>
                  <p className="t-caption">Filed to {WO.serial} step 4. Retrievable by serial, not by folder.</p>
                </div>
              </div>
            ) : (
              <div className="panel" style={{ padding: "var(--pad)" }}>
                <div className="flex items-start gap-3">
                  <IconCamera size={26} className="mt-0.5 shrink-0" />
                  <p className="t-sub">
                    Frame all eight fastener heads and the bracket face in one shot. The
                    witness line has to be continuous in the photo, not just on the part.
                  </p>
                </div>
              </div>
            ))}

          {step.kind === "buyoff" && (
            <div className="panel" style={{ padding: "var(--pad)" }}>
              <p className="t-label mb-3">This step writes to the permanent record</p>
              <ul className="flex flex-col gap-2">
                {[
                  "Torque sequence recorded, both passes",
                  "Tool TRQ-118 in calibration at time of pull",
                  "Witness photo on file",
                  bench.shortages.length ? "Kit shortage resolved before install" : "Kit verified at the bench",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <IconCheck size={20} className="mt-0.5 shrink-0 fg-go" />
                    <span className="t-sub">{t}</span>
                  </li>
                ))}
              </ul>
              <p className="t-caption mt-4">
                The inspector is confirming a record the system already assembled — not
                re-walking the traveler to rebuild it.
              </p>
            </div>
          )}
        </div>

        {(step.spec || step.kind === "work") && (
          <section className="mt-6">
            <div className="rule flex items-center gap-3 pt-4">
              <span className="t-label">Reference</span>
              <span className="h-px flex-1" style={{ background: "var(--line-soft)" }} />
            </div>
        {step.spec && (
          <dl className="mt-3 flex flex-wrap" style={{ gap: "var(--gap)" }}>
            {step.spec.map((sp) =>
              sp.big ? (
                <div key={sp.label} className="panel w-full" style={{ padding: "var(--pad)" }}>
                  <dt className="t-label">{sp.label}</dt>
                  <dd className="t-mega mt-1">{sp.value}</dd>
                </div>
              ) : (
                <div key={sp.label} className="panel flex-1" style={{ padding: "calc(var(--pad) * 0.7)", minWidth: "11rem" }}>
                  <dt className="t-label">{sp.label}</dt>
                  <dd className={sp.mono ? "t-id mt-0.5" : "t-sub mt-0.5"}>{sp.value}</dd>
                </div>
              ),
            )}
          </dl>
        )}

          {step.kind === "work" && (
            <figure className="panel flex items-center gap-4" style={{ padding: "var(--pad)" }}>
              <div className="shrink-0" style={{ width: "13rem" }}><BracketArt /></div>
              <figcaption className="t-caption">
                100-4412-01 seated on the −Y panel rail. Datum A up, alignment pin through the
                lug bore until the washer stack goes on.
              </figcaption>
            </figure>
          )}

          </section>
        )}
        </div>
      </main>

      {/* ---- commit rail: the action is always where the thumb already is ---- */}
      <footer
        className="shrink-0 border-t border-line"
        style={{ padding: "var(--pad)", paddingBottom: "calc(var(--pad) + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto w-full max-w-3xl">
        {step.kind === "buyoff" ? (
          <HoldToCommit label="Hold to sign buy-off" sub="1.2 seconds · badge 4471" onCommit={advance} />
        ) : rail ? (
          <button
            disabled={rail.disabled}
            onClick={rail.run}
            className={`btn btn-xl w-full ${rail.variant ?? "btn-primary"}`}
          >
            {rail.label}
          </button>
        ) : step.kind === "inspect" && !shot ? (
          <button
            onClick={() => { setShot(true); setReady(true); }}
            className="btn btn-primary btn-xl w-full"
          >
            <IconCamera size={26} /> Capture witness photo
          </button>
        ) : (
          <button
            disabled={!ready}
            onClick={advance}
            className="btn btn-primary btn-xl w-full"
          >
            {step.kind === "kit" ? "Kit complete — start install" : step.kind === "work" ? "All eight hand-tight" : "Continue"}
            <IconArrow size={26} />
          </button>
        )}

        <div className="mt-3 flex items-center justify-between">
          <button className="btn btn-ghost" onClick={() => setNcrOpen(true)}>
            <IconFlag size={22} /> Flag an issue
          </button>
          <span className="t-caption">{WO.operator.name} · {WO.operator.badge}</span>
        </div>
        </div>
      </footer>

      {ncrOpen && (
        <NcrSheet
          step={step.seq}
          onClose={() => setNcrOpen(false)}
          onSubmit={(reason, note) =>
            actions.raiseNcr({ wo: WO.id, serial: WO.serial, step: step.seq, reason, note })
          }
        />
      )}
    </div>
  );
}

/* -------- the payoff screen: measured, not asserted -------- */
function Summary() {
  const bench = useBench();
  const measured = useMemo(() => {
    const secs = bench.completed.reduce((a, c) => a + c.seconds, 0);
    const taps = bench.completed.reduce((a, c) => a + c.taps, 0);
    return { secs, taps };
  }, [bench.completed]);

  const legacy = WO.steps.reduce(
    (a, s) => ({ secs: a.secs + s.legacy.seconds, screens: a.screens + s.legacy.screens }),
    { secs: 0, screens: 0 },
  );

  return (
    <div data-surface="floor" className="min-h-dvh bg-bg" style={{ padding: "var(--pad)" }}>
      <div className="mx-auto max-w-2xl py-8">
        <span className="chip chip-go">Step 5 of 5 complete</span>
        <h1 className="t-hero mt-4">{WO.id} closed on {WO.serial}</h1>
        <p className="t-body mt-2" style={{ color: "var(--fg-dim)" }}>
          Here is what this run actually cost, measured live — not a claim in a case study.
        </p>

        <div className="mt-6 grid grid-cols-2" style={{ gap: "var(--gap)" }}>
          <div className="panel" style={{ padding: "var(--pad)" }}>
            <p className="t-label">This run</p>
            <p className="t-mega mt-1">{Math.max(1, Math.round(measured.secs / 60))}<span className="t-head"> min</span></p>
            <p className="t-sub mt-1">{measured.taps} taps · 1 screen</p>
          </div>
          <div className="panel" style={{ padding: "var(--pad)", opacity: 0.72 }}>
            <p className="t-label">Paper traveler + ERP terminal</p>
            <p className="t-mega mt-1">{Math.round(legacy.secs / 60)}<span className="t-head"> min</span></p>
            <p className="t-sub mt-1">{legacy.screens} screens · 2 walks off station</p>
          </div>
        </div>

        <div className="panel mt-4" style={{ padding: "var(--pad)" }}>
          <p className="t-label mb-3">Where the time went, per step</p>
          <table className="w-full">
            <tbody>
              {WO.steps.map((s) => {
                const rec = bench.completed.find((c) => c.stepId === s.id);
                return (
                  <tr key={s.id} className="align-top">
                    <td className="py-2 pr-3"><span className="t-id">{s.seq}</span></td>
                    <td className="py-2 pr-3">
                      <p className="t-sub">{s.title}</p>
                      <p className="t-caption mt-0.5">{s.legacy.note}</p>
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <p className="t-id">{rec ? `${rec.seconds}s` : "—"}</p>
                      <p className="t-caption">was ~{Math.round(s.legacy.seconds / 60)}m</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="t-caption mt-4">
          The comparison baseline is illustrative — I don&apos;t have your floor data. The point
          is the instrumentation: task time, tap count and error rate are captured by the
          product itself, so a design change can be argued with a number instead of a taste.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn btn-outline" onClick={() => { actions.reset(); location.href = "/floor"; }}>
            Run it again
          </button>
          <Link href="/plan" className="btn btn-primary">Open the planner board <IconArrow size={22} /></Link>
          <Link href="/" className="btn btn-ghost">Back to notes</Link>
        </div>
      </div>
    </div>
  );
}

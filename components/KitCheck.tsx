"use client";

import { useEffect, useState } from "react";
import type { Fastener } from "@/lib/data";
import type { SetRail } from "@/lib/rail";
import { actions, useBench } from "@/lib/store";
import { IconAlert, IconCamera, IconCheck, IconRunner, IconX } from "./Icon";
import { PartArt } from "./art/Parts";

type Phase = "idle" | "capturing" | "result";

export type KitVerdict = "clean" | "short" | "wrong" | "both";

function verdictOf(f: Fastener) {
  if (f.wrongPn) return "wrong" as const;
  if (f.found < f.qty) return "short" as const;
  return "ok" as const;
}

export function KitCheck({
  fasteners,
  wo,
  serial,
  station,
  onResolved,
  setRail,
}: {
  fasteners: Fastener[];
  wo: string;
  serial: string;
  station: string;
  onResolved: (ok: boolean) => void;
  setRail: SetRail;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const bench = useBench();
  const problems = fasteners.filter((f) => verdictOf(f) !== "ok");
  const raised = bench.shortages.filter((s) => s.wo === wo);
  const delivered = raised.length > 0 && raised.every((s) => s.status === "delivered");

  useEffect(() => {
    if (phase !== "capturing") return;
    const t = setTimeout(() => setPhase("result"), 1700);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (delivered) onResolved(true);
  }, [delivered, onResolved]);

  const nProblems = problems.length;
  const nRaised = raised.length;
  useEffect(() => {
    if (phase === "idle") {
      setRail({ label: "Capture kit tray", run: () => setPhase("capturing") });
    } else if (phase === "capturing") {
      setRail({ label: "Reading kit tray…", disabled: true });
    } else if (nProblems === 0) {
      setRail(null);
    } else if (nRaised === 0) {
      setRail({ label: `Page supply — ${nProblems} lines`, run: pageSupply });
    } else if (!delivered) {
      setRail({ label: "Waiting on supply", disabled: true });
    } else {
      setRail(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, nProblems, nRaised, delivered]);

  function pageSupply() {
    const made = actions.raiseShortage(
      problems.map((f) => ({
        pn: f.pn,
        nomenclature: f.nomenclature,
        need: f.qty,
        found: f.wrongPn ? 0 : f.found,
        wrongPn: f.wrongPn,
        bin: f.bin,
        wo,
        serial,
        station,
      })),
    );
    // Simulated runner so a single-tab viewer isn't stranded. With the planner
    // board open in a second tab, these same transitions appear there live.
    made.forEach((m, i) => {
      setTimeout(() => actions.advanceShortage(m.id), 2200 + i * 400);
      setTimeout(() => actions.advanceShortage(m.id), 6200 + i * 400);
    });
  }

  if (phase === "idle") {
    return (
      <div className="flex flex-col" style={{ gap: "var(--gap)" }}>
        <div className="panel" style={{ padding: "var(--pad)" }}>
          <div className="flex items-center justify-between">
            <p className="t-label">Expected in kit K-2291</p>
            <span className="chip chip-mute">{fasteners.length} lines</span>
          </div>
          <ul className="mt-3 flex flex-col gap-3">
            {fasteners.map((f) => (
              <li key={f.pn} className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <PartArt pn={f.pn} size={68} />
                  <div className="min-w-0">
                    <p className="t-id">{f.pn}</p>
                    <p className="t-caption truncate">{f.nomenclature}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="t-num leading-none">{f.qty}</p>
                  <p className="t-label">req</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="t-caption">
          Counting by eye against a printed list is where this goes wrong today — the
          wrong washer series looks identical at arm&apos;s length.
        </p>
      </div>
    );
  }

  if (phase === "capturing") {
    return (
      <div className="panel relative overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
        <div className="absolute inset-0 bg-panel-2" />
        {/* stand-in for the camera feed */}
        <div className="absolute inset-0 grid grid-cols-4 gap-px opacity-40">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-ink-800" />
          ))}
        </div>
        <div className="absolute inset-x-0 top-0 h-24 animate-scan bg-gradient-to-b from-transparent via-[color-mix(in_srgb,var(--color-info)_28%,transparent)] to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <IconCamera size={40} className="text-fg-dim" />
          <p className="t-head animate-flash">Reading kit tray…</p>
          <p className="t-caption">Hold steady · 3 line items expected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ gap: "var(--gap)" }}>
      {fasteners.map((f) => {
        const v = verdictOf(f);
        return (
          <div
            key={f.pn}
            className="panel flex items-start gap-4"
            style={{
              padding: "var(--pad)",
              borderColor:
                v === "ok"
                  ? "color-mix(in srgb, var(--color-go) 40%, transparent)"
                  : "color-mix(in srgb, var(--color-stop) 55%, transparent)",
              background: v === "ok" ? "var(--go-soft)" : "var(--stop-soft)",
            }}
          >
            <div
              className="grid shrink-0 place-items-center rounded-full"
              style={{
                width: "2.75rem",
                height: "2.75rem",
                background: v === "ok" ? "var(--color-go)" : "var(--color-stop)",
                color: v === "ok" ? "var(--on-go)" : "var(--on-stop)",
              }}
            >
              {v === "ok" ? <IconCheck size={26} /> : <IconX size={26} />}
            </div>

            <div className="min-w-0 flex-1">
              <p className="t-id-lg whitespace-nowrap">{f.pn}</p>
              <p className="t-caption truncate">{f.nomenclature}</p>

              {v === "ok" && <p className="t-sub mt-2 fg-go">Verified · bin {f.bin}</p>}
              {v === "short" && (
                <p className="t-sub mt-2 fg-stop">Short {f.qty - f.found} · bin {f.bin}</p>
              )}
              {v === "wrong" && (
                <div className="mt-2">
                  <div className="flex items-center gap-3">
                    <p className="t-num fg-stop leading-none">
                      0<span className="t-head" style={{ opacity: 0.55 }}>/{f.qty}</span>
                    </p>
                    <p className="t-sub fg-stop">Wrong part in bin {f.bin}</p>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
                    <figure className="fg-go flex items-center gap-3 sm:flex-col sm:gap-0 sm:text-center">
                      <PartArt pn={f.pn} size={104} />
                      <div>
                        <figcaption className="t-id fg-go">{f.pn}</figcaption>
                        <figcaption className="t-caption fg-go">spec · .063 thick</figcaption>
                      </div>
                    </figure>
                    <span className="t-label">vs</span>
                    <figure className="fg-stop flex items-center gap-3 sm:flex-col sm:gap-0 sm:text-center">
                      <PartArt pn={f.wrongPn!} size={104} />
                      <div>
                        <figcaption className="t-id fg-stop">{f.wrongPn}</figcaption>
                        <figcaption className="t-caption fg-stop">in bin · .032 thick</figcaption>
                      </div>
                    </figure>
                  </div>
                  <p className="t-caption mt-1">
                    Same diameter, same finish, thinner stack. Indistinguishable in a gloved
                    hand at arm&apos;s length.
                  </p>
                </div>
              )}
            </div>

            {v !== "wrong" && (
              <div className="flex shrink-0 items-center gap-3 self-center">
                <PartArt pn={f.pn} size={60} />
                <p className={v === "ok" ? "t-num fg-go leading-none" : "t-num fg-stop leading-none"}>
                  {f.found}
                  <span className="t-head" style={{ opacity: 0.55 }}>/{f.qty}</span>
                </p>
              </div>
            )}
          </div>
        );
      })}

      {problems.length > 0 && raised.length === 0 && (
        <div className="mt-1">
          <div
            className="panel flex items-start gap-3"
            style={{ padding: "var(--pad)", background: "var(--hold-soft)", borderColor: "transparent" }}
          >
            <IconAlert size={22} className="shrink-0 fg-hold" />
            <p className="t-sub">
              Do not begin installation. Two lines are not right at the bench.
            </p>
          </div>
        </div>
      )}

      {raised.length > 0 && (
        <div className="panel" style={{ padding: "var(--pad)" }}>
          <p className="t-label mb-3">Supply request {raised.map((r) => r.id).join(" · ")}</p>
          <ol className="flex flex-col gap-3">
            {(["open", "ack", "delivered"] as const).map((s, i) => {
              const reached = raised.some(
                (r) => ["open", "ack", "delivered"].indexOf(r.status) >= i,
              );
              const label =
                s === "open" ? "Sent to Bay 2 supply" : s === "ack" ? "Runner acknowledged" : "Delivered to bench";
              return (
                <li key={s} className="flex items-center gap-3">
                  <span
                    className="grid place-items-center rounded-full"
                    style={{
                      width: "1.75rem",
                      height: "1.75rem",
                      background: reached ? "var(--color-go)" : "var(--panel-2)",
                      color: reached ? "var(--on-go)" : "var(--fg-mute)",
                    }}
                  >
                    {reached ? <IconCheck size={16} /> : <span className="t-caption">{i + 1}</span>}
                  </span>
                  <span className="t-sub" style={{ color: reached ? "var(--fg)" : "var(--fg-mute)" }}>
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="t-caption mt-3">
            Runner is simulated for the demo. Open the planner board in a second tab to watch
            this land there live.
          </p>
        </div>
      )}

    </div>
  );
}

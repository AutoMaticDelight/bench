"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NCRS, WIP } from "@/lib/data";
import { actions, useBench } from "@/lib/store";
import { IconAlert, IconArrow, IconBox, IconRunner } from "@/components/Icon";
import { Throughput } from "@/components/Throughput";

function ago(ms: number, now: number) {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

const STATUS: Record<string, string> = {
  running: "chip chip-go",
  blocked: "chip chip-stop",
  queued: "chip chip-hold",
  done: "chip chip-mute",
};

export default function Plan() {
  const bench = useBench();
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const openShortages = bench.shortages.filter((s) => s.status !== "delivered");
  const openShort = openShortages.length;
  const mrb = NCRS.filter((n) => n.disposition === "awaiting MRB").length + bench.ncrs.length;
  const atRisk = WIP.filter((w) => w.status === "blocked" || w.status === "queued").length;

  return (
    <div data-surface="desk" className="min-h-dvh bg-bg">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4" style={{ padding: "var(--pad)" }}>
          <div className="flex items-baseline gap-3">
            <span className="t-title">Floor board</span>
            <span className="t-caption">Shift A · Integration · 18 Aug</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/floor" className="btn btn-outline">Technician view</Link>
            <Link href="/" className="btn btn-ghost">Notes</Link>
          </div>
        </div>
      </header>

      {/* ---- the board proper: state first, then the numbers behind it ---- */}
      <section className="mx-auto max-w-[1400px]" style={{ padding: "var(--pad)", paddingBottom: 0 }}>
        <div className="panel" style={{ padding: "var(--pad)" }}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="t-label">Integration · Shift A</p>
              <div className="mt-1 flex items-center gap-3">
                <span className="animate-flash shrink-0 rounded-full"
                  style={{ width: "0.875rem", height: "0.875rem", background: atRisk ? "var(--color-stop)" : "var(--color-go)" }} />
                <h1 className="t-display">{atRisk ? `${atRisk} stations at risk` : "All stations running"}</h1>
              </div>
              <p className="t-sub mt-1" style={{ color: "var(--fg-dim)" }}>
                WO-2288 held 3h 32m on NCR-0447 · kit K-2295 incomplete
                {openShort > 0 && ` · ${openShort} line${openShort > 1 ? "s" : ""} short at the bench`}
              </p>
            </div>
            <span className={openShort > 0 ? "chip chip-stop" : "chip chip-go"}>
              {openShort > 0 ? "supply outstanding" : "supply clear"}
            </span>
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              ["Units in build", "3", "BUS-103 · 104 · 105"],
              ["Steps this shift", "86", "plan 96"],
              ["Stations on plan", "3 of 5", "2 holding"],
              ["Open shortages", String(openShort), openShort ? "runner dispatched" : "none outstanding"],
              ["Awaiting MRB", String(mrb), "oldest 3h 32m"],
            ].map(([label, value, sub]) => (
              <div key={label} className="panel" style={{ padding: "var(--pad)", background: "var(--panel-2)" }}>
                <dt className="t-label">{label}</dt>
                <dd className="t-mega mt-1 leading-none">{value}</dd>
                <dd className="t-caption mt-1">{sub}</dd>
              </div>
            ))}
          </dl>

          <div className="rule mt-5 pt-5"><Throughput /></div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1400px] gap-4 lg:grid-cols-[1fr_360px]" style={{ padding: "var(--pad)" }}>
        {/* ---------------- WIP ---------------- */}
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line" style={{ padding: "var(--pad)" }}>
            <h2 className="t-head">Work in process</h2>
            <span className="t-caption">{WIP.filter((w) => w.status !== "done").length} active · 2 stations at risk</span>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "44rem" }}>
            <thead>
              <tr className="border-b border-line-soft">
                {["WO", "Serial", "Operation", "Station", "Step", "On step", "Status"].map((h) => (
                  <th key={h} className="t-label px-3 py-2 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WIP.map((w) => {
                const over = w.minutesOnStep > w.plannedMinutes;
                return (
                  <tr key={w.wo} className="border-b border-line-soft last:border-0 hover:bg-panel-2">
                    <td className="px-3 py-2"><span className="t-id">{w.wo}</span></td>
                    <td className="px-3 py-2"><span className="t-id">{w.serial}</span></td>
                    <td className="px-3 py-2">
                      <p className="t-sub">{w.title}</p>
                      <p className="t-caption">{w.operator}</p>
                    </td>
                    <td className="px-3 py-2"><span className="t-caption">{w.station}</span></td>
                    <td className="px-3 py-2"><span className="t-id">{w.step}</span></td>
                    <td className="px-3 py-2">
                      <span className="t-id" style={{ color: over ? "var(--color-stop)" : "var(--fg-dim)" }}>
                        {w.minutesOnStep}m
                      </span>
                      <span className="t-caption"> / {w.plannedMinutes}m</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={STATUS[w.status]}>{w.status}</span>
                      {w.blockedBy && <p className="t-caption mt-1">{w.blockedBy}</p>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          <p className="t-caption border-t border-line-soft" style={{ padding: "var(--pad)" }}>
            Same design system as the technician screen — same tokens, same components. Only
            the density and contrast tokens change. A planner is reading twenty rows with a
            cursor; a technician is reading one line with gloves on.
          </p>
        </section>

        {/* ---------------- right rail ---------------- */}
        <div className="flex flex-col gap-4">
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-line" style={{ padding: "var(--pad)" }}>
              <h2 className="t-head">Kit shortages</h2>
              {openShortages.length > 0 && <span className="chip chip-stop">{openShortages.length} open</span>}
            </div>

            {bench.shortages.length === 0 ? (
              <div style={{ padding: "var(--pad)" }}>
                <div className="flex items-start gap-2.5">
                  <IconBox size={20} className="mt-0.5 shrink-0 text-fg-mute" />
                  <p className="t-caption">
                    Nothing outstanding. Run the kit check on the{" "}
                    <Link href="/floor" className="underline">technician view</Link> and it lands
                    here the moment the tech raises it — this tab, live.
                  </p>
                </div>
              </div>
            ) : (
              <ul>
                {bench.shortages.map((s) => (
                  <li key={s.id} className="border-b border-line-soft last:border-0" style={{ padding: "var(--pad)" }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="t-id">{s.id}</span>
                      <span className={s.status === "delivered" ? "chip chip-go" : s.status === "ack" ? "chip chip-hold" : "chip chip-stop"}>
                        {s.status === "ack" ? "runner assigned" : s.status}
                      </span>
                    </div>
                    <p className="t-id mt-2" style={{ fontWeight: 700 }}>{s.pn}</p>
                    <p className="t-caption">{s.nomenclature}</p>
                    <p className="t-sub mt-2 fg-stop">
                      {s.wrongPn ? `Wrong part in bin — found ${s.wrongPn}` : `Short ${s.need - s.found} of ${s.need}`}
                    </p>
                    <p className="t-caption mt-1">
                      {s.station} · {s.wo} · bin {s.bin} · raised {now ? ago(s.raisedAtMs, now) : "—"} ago
                    </p>
                    {s.status !== "delivered" && (
                      <button className="btn btn-outline mt-2 w-full" onClick={() => actions.advanceShortage(s.id)}>
                        <IconRunner size={18} />
                        {s.status === "open" ? "Assign runner" : "Mark delivered"}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-line" style={{ padding: "var(--pad)" }}>
              <h2 className="t-head">MRB queue</h2>
              <span className="chip chip-hold">{NCRS.filter((n) => n.disposition === "awaiting MRB").length + bench.ncrs.length} awaiting</span>
            </div>
            <ul>
              {bench.ncrs.map((n) => (
                <li key={n.id} className="border-b border-line-soft" style={{ padding: "var(--pad)", background: "var(--hold-soft)" }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="t-id">{n.id}</span>
                    <span className="chip chip-hold">awaiting MRB</span>
                  </div>
                  <p className="t-sub mt-1">{n.reason}</p>
                  {n.note && <p className="t-caption mt-1">“{n.note}”</p>}
                  <p className="t-caption mt-1">
                    {n.serial} · {n.wo} step {n.step} · raised {now ? ago(n.raisedAtMs, now) : "—"} ago
                  </p>
                </li>
              ))}
              {NCRS.map((n) => (
                <li key={n.id} className="border-b border-line-soft last:border-0" style={{ padding: "var(--pad)" }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="t-id">{n.id}</span>
                    <span className={n.disposition === "awaiting MRB" ? "chip chip-hold" : "chip chip-mute"}>
                      {n.disposition}
                    </span>
                  </div>
                  <p className="t-sub mt-1">{n.summary}</p>
                  <p className="t-caption mt-1">
                    {n.serial} · {n.raisedBy} · {n.raisedAgo} ago
                    {n.holdsWo && <span className="fg-stop"> · holding {n.holdsWo}</span>}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel" style={{ padding: "var(--pad)" }}>
            <div className="flex items-start gap-2.5">
              <IconAlert size={20} className="mt-0.5 shrink-0 fg-hold" />
              <p className="t-caption">
                <strong className="t-sub">The loop is the point.</strong> A shortage found at the
                bench is a supply-chain event, an NCR is a quality event, and both start as one
                tap from a person wearing gloves. Software that makes the tech walk to a terminal
                to report either one will simply not be told.
              </p>
            </div>
            <Link href="/floor" className="btn btn-primary mt-3 w-full">
              Go raise one <IconArrow size={18} />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

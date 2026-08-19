"use client";

import { useSyncExternalStore } from "react";

/* A deliberately small store. The point of the prototype is the interaction,
   not the backend — but floor→desk has to be genuinely live, because the
   whole argument is that the shop floor and supply chain are one loop.
   localStorage + BroadcastChannel gives real cross-tab sync with no server:
   open the floor on a tablet-sized window and the desk beside it. */

export type Shortage = {
  id: string;
  pn: string;
  nomenclature: string;
  need: number;
  found: number;
  wrongPn?: string;
  bin: string;
  wo: string;
  serial: string;
  station: string;
  raisedAtMs: number;
  status: "open" | "ack" | "delivered";
};

export type FloorNcr = {
  id: string;
  wo: string;
  serial: string;
  step: number;
  reason: string;
  note: string;
  raisedAtMs: number;
};

export type StepRecord = {
  stepId: string;
  seconds: number;
  taps: number;
  at: number;
};

export type BenchState = {
  shortages: Shortage[];
  ncrs: FloorNcr[];
  completed: StepRecord[];
  kitVerified: boolean;
  seq: number;
};

const KEY = "bench.v1";
const EMPTY: BenchState = { shortages: [], ncrs: [], completed: [], kitVerified: false, seq: 1 };

let state: BenchState = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();
let channel: BroadcastChannel | null = null;

function emit() {
  for (const l of listeners) l();
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    channel?.postMessage(state);
  } catch {
    /* private mode — the prototype still works, it just won't survive reload */
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as BenchState) };
  } catch {}
  channel = new BroadcastChannel(KEY);
  channel.onmessage = (e) => {
    state = e.data as BenchState;
    emit();
  };
  window.addEventListener("storage", (e) => {
    if (e.key === KEY && e.newValue) {
      state = JSON.parse(e.newValue) as BenchState;
      emit();
    }
  });
}

function set(next: Partial<BenchState>) {
  state = { ...state, ...next };
  persist();
  emit();
}

export function subscribe(fn: () => void) {
  hydrate();
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function snapshot() {
  return state;
}

export function useBench(): BenchState {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

/* ----------------------------- actions ----------------------------- */

export const actions = {
  raiseShortage(items: Omit<Shortage, "id" | "raisedAtMs" | "status">[]) {
    const now = Date.now();
    const made = items.map((it, i) => ({
      ...it,
      id: `SHT-${String(state.seq + i).padStart(4, "0")}`,
      raisedAtMs: now,
      status: "open" as const,
    }));
    set({ shortages: [...made, ...state.shortages], seq: state.seq + made.length });
    return made;
  },
  advanceShortage(id: string) {
    set({
      shortages: state.shortages.map((s) =>
        s.id === id ? { ...s, status: s.status === "open" ? "ack" : "delivered" } : s,
      ),
    });
  },
  markKitVerified() {
    set({ kitVerified: true });
  },
  completeStep(rec: StepRecord) {
    if (state.completed.some((c) => c.stepId === rec.stepId)) return;
    set({ completed: [...state.completed, rec] });
  },
  raiseNcr(n: Omit<FloorNcr, "id" | "raisedAtMs">) {
    const id = `NCR-${String(448 + state.ncrs.length).padStart(4, "0")}`;
    set({ ncrs: [{ ...n, id, raisedAtMs: Date.now() }, ...state.ncrs] });
    return id;
  },
  reset() {
    set({ ...EMPTY });
  },
};

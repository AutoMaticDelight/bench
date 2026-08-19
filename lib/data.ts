/**
 * Demo build record. Values are representative, not drawn from any real
 * program — plausible enough that a manufacturing engineer reads it without
 * wincing, generic enough that it belongs to no one.
 */

export type StepKind = "kit" | "work" | "torque" | "inspect" | "buyoff";

export type Fastener = {
  pn: string;
  nomenclature: string;
  qty: number;
  /** what the kit-check camera actually found */
  found: number;
  /** a different PN sitting in the bin where this one should be */
  wrongPn?: string;
  bin: string;
};

export type Step = {
  id: string;
  seq: number;
  kind: StepKind;
  title: string;
  instruction: string;
  /** spec callouts rendered as a labelled grid */
  spec?: { label: string; value: string; mono?: boolean; big?: boolean }[];
  fasteners?: Fastener[];
  /** ordered, enforced — sequence-critical work */
  substeps?: { text: string; caution?: string }[];
  /** what this step costs on the paper traveler + ERP terminal today */
  legacy: { taps: number; screens: number; seconds: number; note: string };
  requiresSecondCheck?: boolean;
};

export type WorkOrder = {
  id: string;
  serial: string;
  program: string;
  title: string;
  station: string;
  operator: { name: string; badge: string };
  steps: Step[];
};

export const WO: WorkOrder = {
  id: "WO-2291",
  serial: "BUS-104",
  program: "Bus 100 Series",
  title: "+Y Solar Array Hinge Bracket Installation",
  station: "Integration Bay 2 · ISO 8",
  operator: { name: "T. Okafor", badge: "4471" },
  steps: [
    {
      id: "s1",
      seq: 1,
      kind: "kit",
      title: "Verify hardware kit at the bench",
      instruction:
        "Lay the kit out on the mat. Capture the full tray in frame. Do not begin installation until every line reads VERIFIED.",
      fasteners: [
        {
          pn: "NAS1351N4-16",
          nomenclature: "Screw, socket head cap, .250-28 × 1.00, A286",
          qty: 8,
          found: 8,
          bin: "K-2291-A",
        },
        {
          pn: "NAS1149D0463K",
          nomenclature: "Washer, flat, .250, CRES",
          qty: 8,
          found: 8,
          wrongPn: "NAS1149D0332K",
          bin: "K-2291-B",
        },
        {
          pn: "MS21042L4",
          nomenclature: "Nut, self-locking, reduced hex, .250-28",
          qty: 8,
          found: 6,
          bin: "K-2291-C",
        },
      ],
      legacy: {
        taps: 0,
        screens: 4,
        seconds: 480,
        note: "Today: read paper BOM, count by hand, walk to the ERP terminal to confirm the PN, radio supply, wait.",
      },
    },
    {
      id: "s2",
      seq: 2,
      kind: "work",
      title: "Position bracket, install fasteners hand-tight",
      instruction:
        "Seat P/N 100-4412-01 against the −Y face of the panel rail. Install all eight fasteners hand-tight. Do not seat the washer stack until alignment pin is removed.",
      spec: [
        { label: "Bracket", value: "100-4412-01", mono: true },
        { label: "Orientation", value: "Datum A up" },
        { label: "Alignment pin", value: "TOOL-0392", mono: true },
      ],
      substeps: [
        { text: "Seat the fitting on the −Y panel rail, Datum A up." },
        { text: "Insert alignment pin TOOL-0392 through the lug bore.", caution: "Pin stays in until every fastener is started." },
        { text: "Start all eight screws from outboard, washer under the head." },
        { text: "Fit the inboard washer before the locknut, both faces flat.", caution: "A washer on the wrong side of the joint is rework, not a touch-up." },
        { text: "Run locknuts on with the nylon insert facing away from the joint." },
        { text: "Bring all eight hand-tight. Do not seat the stack." },
        { text: "Remove alignment pin TOOL-0392 and set it back on the shadow board." },
      ],
      legacy: { taps: 0, screens: 2, seconds: 240, note: "Today: paper traveler plus a flip to the drawing sheet; stack-up order is prose in a paragraph." },
    },
    {
      id: "s3",
      seq: 3,
      kind: "torque",
      title: "Torque to spec — two passes, star sequence",
      instruction:
        "Pass 1 at 50%. Pass 2 at 100%. Follow the sequence exactly. Record the tool serial before the first pull.",
      spec: [
        { label: "Final torque", value: "45 in-lbf ±3", big: true },
        { label: "Pass 1", value: "22 in-lbf", mono: true },
        { label: "Sequence", value: "1 · 5 · 3 · 7 · 2 · 6 · 4 · 8", mono: true },
        { label: "Tool", value: "TRQ-118 (cal due 2026-11-04)", mono: true },
      ],
      legacy: { taps: 0, screens: 3, seconds: 150, note: "Today: torque value lives on a separate spec sheet; cal date is a third lookup." },
    },
    {
      id: "s4",
      seq: 4,
      kind: "inspect",
      title: "Apply torque stripe and inspect",
      instruction:
        "Apply orange torque seal across each fastener head onto the bracket face. Confirm continuous witness line on all eight.",
      spec: [
        { label: "Material", value: "TS-44 orange", mono: true },
        { label: "Coverage", value: "Head → bracket face, unbroken" },
      ],
      legacy: { taps: 0, screens: 1, seconds: 60, note: "Today: same, but the photo goes on a shared drive nobody indexes." },
    },
    {
      id: "s5",
      seq: 5,
      kind: "buyoff",
      title: "Quality buy-off",
      instruction:
        "Second set of eyes. Confirm sequence recorded, stripe continuous, no FOD in the joint. This writes to the permanent build record.",
      requiresSecondCheck: true,
      legacy: { taps: 0, screens: 5, seconds: 900, note: "Today: find a QA inspector, they re-walk the traveler, wet signature, scan the page." },
    },
  ],
};

/* -------------------- planner-side fixtures -------------------- */

export type Wip = {
  wo: string;
  serial: string;
  title: string;
  station: string;
  step: string;
  status: "running" | "blocked" | "queued" | "done";
  blockedBy?: string;
  operator: string;
  minutesOnStep: number;
  plannedMinutes: number;
};

export const WIP: Wip[] = [
  { wo: "WO-2291", serial: "BUS-104", title: "+Y array hinge bracket", station: "Integration Bay 2", step: "1 of 5", status: "running", operator: "T. Okafor", minutesOnStep: 4, plannedMinutes: 14 },
  { wo: "WO-2288", serial: "BUS-104", title: "Harness routing, deck 2", station: "Integration Bay 2", step: "7 of 9", status: "blocked", blockedBy: "NCR-0447 awaiting MRB", operator: "R. Delgado", minutesOnStep: 212, plannedMinutes: 45 },
  { wo: "WO-2274", serial: "BUS-103", title: "Propulsion module close-out", station: "Integration Bay 1", step: "12 of 12", status: "running", operator: "M. Chen", minutesOnStep: 31, plannedMinutes: 60 },
  { wo: "WO-2301", serial: "BUS-105", title: "Panel bond, −Z", station: "Bond Room", step: "2 of 6", status: "running", operator: "A. Whitfield", minutesOnStep: 18, plannedMinutes: 25 },
  { wo: "WO-2295", serial: "BUS-105", title: "Avionics tray install", station: "Integration Bay 3", step: "—", status: "queued", blockedBy: "Kit K-2295 incomplete", operator: "—", minutesOnStep: 0, plannedMinutes: 90 },
  { wo: "WO-2260", serial: "BUS-102", title: "Thermal blanket install", station: "Integration Bay 1", step: "9 of 9", status: "done", operator: "J. Barros", minutesOnStep: 0, plannedMinutes: 120 },
];

export type Ncr = {
  id: string;
  serial: string;
  raisedBy: string;
  raisedAgo: string;
  summary: string;
  disposition: "awaiting MRB" | "use-as-is" | "rework" | "scrap";
  holdsWo?: string;
};

export const NCRS: Ncr[] = [
  { id: "NCR-0447", serial: "BUS-104", raisedBy: "R. Delgado", raisedAgo: "3h 32m", summary: "Connector backshell thread damage, J14", disposition: "awaiting MRB", holdsWo: "WO-2288" },
  { id: "NCR-0446", serial: "BUS-103", raisedBy: "M. Chen", raisedAgo: "1d 2h", summary: "Sealant fillet under minimum at rib 4", disposition: "rework" },
  { id: "NCR-0441", serial: "BUS-102", raisedBy: "J. Barros", raisedAgo: "3d", summary: "Blanket standoff witness mark", disposition: "use-as-is" },
];

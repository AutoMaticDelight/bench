"use client";

/* The stack-up diagram is the instruction, not decoration beside it.
   Each part carries one of three states and reads at a glance from a metre
   away: dim outline = not yet, white + pulsing = do this now, green fill =
   placed. Order stops being a paragraph you skim and becomes a picture that
   is visibly incomplete until you finish it. */

export type PartKey = "screw" | "washer1" | "bracket" | "rail" | "washer2" | "nut" | "pin";

const PLACED_AT: Record<PartKey, number> = {
  bracket: 1,
  rail: 1,
  pin: 2,
  screw: 3,
  washer1: 3,
  washer2: 4,
  nut: 5,
};
/* which sub-step is actively working this part */
const ACTIVE_AT: Record<PartKey, number[]> = {
  bracket: [0],
  rail: [0],
  pin: [1, 6],
  screw: [2],
  washer1: [2],
  washer2: [3],
  nut: [4],
};

function stateOf(key: PartKey, done: number, current: number) {
  if (key === "pin" && done >= 7) return "removed" as const;
  if (ACTIVE_AT[key].includes(current)) return "active" as const;
  return done >= PLACED_AT[key] ? ("placed" as const) : ("pending" as const);
}

function paint(state: "placed" | "active" | "pending" | "removed") {
  switch (state) {
    case "placed":
      return { stroke: "var(--color-go)", fill: "var(--go-soft)", opacity: 1 };
    case "active":
      return { stroke: "var(--fg)", fill: "var(--panel-2)", opacity: 1 };
    case "removed":
      return { stroke: "var(--fg-mute)", fill: "none", opacity: 0.18 };
    default:
      return { stroke: "var(--fg-mute)", fill: "none", opacity: 0.42 };
  }
}

const MARKS: [PartKey, number, number, string][] = [
  ["screw", 60, 1, "SCREW"],
  ["washer1", 116, 2, "WASHER"],
  ["bracket", 149, 3, "BRACKET"],
  ["rail", 184, 4, "RAIL"],
  ["washer2", 214, 5, "WASHER"],
  ["nut", 250, 6, "NUT"],
];

export function AssemblyDiagram({ done, current }: { done: number; current: number }) {
  const P = (k: PartKey) => {
    const st = stateOf(k, done, current);
    const c = paint(st);
    return {
      stroke: c.stroke,
      fill: c.fill,
      opacity: c.opacity,
      strokeWidth: st === "active" ? 2.2 : 1.4,
      strokeLinejoin: "round" as const,
      strokeLinecap: "round" as const,
      style: { transition: "stroke 320ms ease, fill 320ms ease, opacity 320ms ease, stroke-width 320ms ease" },
      className: st === "active" ? "animate-flash" : undefined,
    };
  };

  return (
    <svg viewBox="0 0 300 108" className="mx-auto block w-full" style={{ maxWidth: "26rem" }} role="img"
      aria-label="Fastener stack-up, coloured by assembly progress">
      {/* joint centreline */}
      <path d="M6 52h288" stroke="var(--fg-mute)" strokeWidth={0.6} strokeDasharray="9 3 2 3" opacity={0.4} fill="none" />

      {/* screw */}
      <g {...P("screw")}>
        <path d="M10 40h14v24H10z" />
        <path d="M24 46h76v12H24z" />
      </g>
      <g {...P("screw")} fill="none" strokeWidth={0.7}>
        {[33, 42, 51, 60, 69, 78, 87, 96].map((x) => <path key={x} d={`M${x} 46v12`} />)}
      </g>

      {/* washers */}
      <g {...P("washer1")}><ellipse cx="116" cy="52" rx="3.6" ry="15" /></g>
      <g {...P("washer2")}><ellipse cx="214" cy="52" rx="3.6" ry="15" /></g>

      {/* bracket flange + panel rail */}
      <g {...P("bracket")}><path d="M140 30h18v44h-18z" /></g>
      <g {...P("rail")}>
        <path d="M174 24h20v56h-20z" />
      </g>

      {/* locknut, nylon band shown */}
      <g {...P("nut")}>
        <path d="M237 44l13-8 13 8v16l-13 8-13-8z" />
      </g>
      <g {...P("nut")} fill="none" strokeWidth={0.9}>
        <path d="M237 50h26" strokeDasharray="2 2" />
      </g>

      {/* alignment pin — appears, then is removed */}
      <g {...P("pin")} fill="none">
        <path d="M166 26v16" strokeDasharray="3 2" />
        <path d="M162 38l4 4 4-4" />
      </g>

      {/* order markers + labels */}
      {MARKS.map(([k, x, n, t]) => {
        const st = stateOf(k, done, current);
        const on = st === "placed";
        const act = st === "active";
        return (
          <g key={t + n} style={{ transition: "opacity 320ms ease" }}>
            <circle cx={x} cy="12" r="7.5" strokeWidth={1}
              fill={on ? "var(--color-go)" : act ? "var(--fg)" : "none"}
              stroke={on ? "var(--color-go)" : act ? "var(--fg)" : "var(--fg-mute)"}
              opacity={on || act ? 1 : 0.42}
              style={{ transition: "all 320ms ease" }} />
            <text x={x} y="15.2" textAnchor="middle" stroke="none"
              fill={on ? "var(--on-go)" : act ? "var(--bg)" : "var(--fg-mute)"}
              opacity={on || act ? 1 : 0.6}
              style={{ fontSize: 8, fontFamily: "var(--font-mono)", fontWeight: 700, transition: "fill 320ms ease" }}>
              {n}
            </text>
            <text x={x} y="94" textAnchor="middle" stroke="none"
              fill={on ? "var(--color-go)" : act ? "var(--fg)" : "var(--fg-mute)"}
              opacity={on || act ? 1 : 0.45}
              style={{ fontSize: 7, fontFamily: "var(--font-mono)", transition: "fill 320ms ease, opacity 320ms ease" }}>
              {t}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

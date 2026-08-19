/* Hardware drawn as line art rather than photographed.
   A photo of a washer at thumbnail size tells you nothing — a sectioned
   profile tells you the one thing that matters, which is how thick it is. */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function ScrewArt({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden role="img" className="fg-dim">
      <g {...stroke}>
        {/* head, three-quarter */}
        <ellipse cx="24" cy="11" rx="10" ry="3.6" />
        <path d="M14 11v6.5M34 11v6.5" />
        <path d="M14 17.5a10 3.6 0 0 0 20 0" />
        {/* hex socket */}
        <path d="M20.4 10.1 22.8 8.8h2.4l2.4 1.3v2l-2.4 1.3h-2.4l-2.4-1.3Z" strokeWidth={1.1} />
        {/* threaded shank */}
        <path d="M19 18.5v20M29 18.5v20" />
        <path d="M19 22.5h10M19 26h10M19 29.5h10M19 33h10M19 36.5h10" strokeWidth={1} />
        <path d="M19 38.5h10" />
      </g>
    </svg>
  );
}

export function WasherArt({ thin = false, size = 56 }: { thin?: boolean; size?: number }) {
  const t = thin ? 2.6 : 8;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden role="img" className="fg-dim">
      <g {...stroke}>
        <ellipse cx="24" cy="20" rx="14" ry="5" />
        <ellipse cx="24" cy="20" rx="5.5" ry="2" />
        <path d={`M10 20v${t}M38 20v${t}`} />
        <path d={`M10 ${20 + t}a14 5 0 0 0 28 0`} />
        {/* thickness call-out — the whole point of this drawing */}
        <path d={`M43 20v${t}`} strokeWidth={1} />
        <path d={`M41.5 20h3M41.5 ${20 + t}h3`} strokeWidth={1} />
      </g>
    </svg>
  );
}

export function NutArt({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden role="img" className="fg-dim">
      <g {...stroke}>
        {/* hex top face, foreshortened */}
        <path d="M11 18.5 18 13h12l7 5.5-7 5.5H18Z" />
        <ellipse cx="24" cy="18.5" rx="5.4" ry="2.8" />
        {/* body */}
        <path d="M11 18.5v9l7 5.5h12l7-5.5v-9" />
        <path d="M18 24v9M30 24v9" strokeWidth={0.9} />
        {/* nylon insert band */}
        <path d="M11 22.5h26" strokeDasharray="2 2" strokeWidth={1} opacity={0.8} />
      </g>
    </svg>
  );
}

/** Top view of the interface flange — the physical layout the torque
 *  sequence actually runs on. Bolt circle matches the numbered positions. */
export function FlangeArt() {
  return (
    <g {...stroke} className="fg-mute" opacity={0.85}>
      <circle cx="50" cy="50" r="43" />
      <circle cx="50" cy="50" r="34" strokeDasharray="4 3" strokeWidth={0.8} />
      <circle cx="50" cy="50" r="14" />
      <circle cx="50" cy="50" r="11" strokeWidth={0.8} />
      {/* centre lines, long-dash-dot */}
      <path d="M50 2v96M2 50h96" strokeWidth={0.6} strokeDasharray="9 3 2 3" opacity={0.55} />
    </g>
  );
}

/** Side elevation of the hinge fitting for the placement step. */
export function BracketArt() {
  return (
    <svg viewBox="0 0 220 132" className="mx-auto block w-full fg-dim" style={{ maxWidth: "22rem" }} aria-label="Hinge fitting, side elevation" role="img">
      <g {...stroke}>
        {/* panel rail it seats against */}
        <path d="M14 96h192" strokeWidth={2} />
        <path d="M14 101h192M14 106h192" strokeWidth={0.7} opacity={0.5} />
        {/* base flange */}
        <path d="M56 96V80h108v16" />
        <path d="M56 80h108" />
        {/* fastener holes in the flange, edge on */}
        {[70, 86, 102, 118, 134, 150].map((x) => (
          <path key={x} d={`M${x} 80v16`} strokeWidth={0.8} strokeDasharray="2 2" />
        ))}
        {/* clevis lug */}
        <path d="M92 80V44a18 18 0 0 1 36 0v36" />
        <circle cx="110" cy="46" r="11" />
        <circle cx="110" cy="46" r="5.5" strokeWidth={0.9} />
        {/* datum A, called out clear of the part */}
        <path d="M44 126v-22M40 108l4-4 4 4" strokeWidth={0.9} />
        <text x="54" y="127" style={{ fontSize: 9, fontFamily: "var(--font-mono)" }} fill="currentColor" stroke="none">
          DATUM A
        </text>
        {/* orientation note */}
        <path d="M190 60v-18M186 46l4-4 4 4" strokeWidth={0.9} />
        <text x="198" y="50" style={{ fontSize: 9, fontFamily: "var(--font-mono)" }} fill="currentColor" stroke="none">
          UP
        </text>
      </g>
    </svg>
  );
}

/** Exploded stack-up, left to right in assembly order.
 *  Getting the washer on the wrong side of the joint is a rework event that
 *  a printed instruction has never once prevented. */
export function StackUpArt() {
  const marks: [number, number, string][] = [
    [60, 1, "SCREW"],
    [116, 2, "WASHER"],
    [149, 3, "BRACKET"],
    [184, 4, "RAIL"],
    [214, 5, "WASHER"],
    [250, 6, "NUT"],
  ];
  return (
    <svg viewBox="0 0 300 104" className="w-full fg-dim" role="img"
      aria-label="Exploded fastener stack-up in assembly order">
      <g {...stroke}>
        <path d="M6 52h288" strokeWidth={0.6} strokeDasharray="9 3 2 3" opacity={0.45} />
        {/* screw */}
        <path d="M10 40h14v24H10z" />
        <path d="M24 46h76v12H24z" />
        {[33, 42, 51, 60, 69, 78, 87, 96].map((x) => (
          <path key={x} d={`M${x} 46v12`} strokeWidth={0.7} />
        ))}
        {/* washers */}
        <ellipse cx="116" cy="52" rx="3.6" ry="15" />
        <ellipse cx="214" cy="52" rx="3.6" ry="15" />
        {/* bracket flange + panel rail */}
        <path d="M140 30h18v44h-18z" />
        <path d="M174 24h20v56h-20z" />
        <path d="M174 30h20M174 74h20" strokeWidth={0.6} opacity={0.5} />
        {/* locknut */}
        <path d="M237 44l13-8 13 8v16l-13 8-13-8z" />
        <path d="M237 50h26" strokeWidth={0.8} strokeDasharray="2 2" />
        {marks.map(([x, n, t]) => (
          <g key={n}>
            <circle cx={x} cy="12" r="7.5" strokeWidth={1} />
            <text x={x} y="15.2" textAnchor="middle" stroke="none" fill="currentColor"
              style={{ fontSize: 8, fontFamily: "var(--font-mono)", fontWeight: 700 }}>{n}</text>
            <text x={x} y="92" textAnchor="middle" stroke="none" fill="currentColor"
              style={{ fontSize: 7, fontFamily: "var(--font-mono)" }}>{t}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Route a part number to its drawing. */
export function PartArt({ pn, size = 56 }: { pn: string; size?: number }) {
  if (pn.startsWith("NAS1351")) return <ScrewArt size={size} />;
  if (pn.startsWith("NAS1149")) return <WasherArt size={size} thin={pn.includes("0332")} />;
  if (pn.startsWith("MS21042")) return <NutArt size={size} />;
  return null;
}

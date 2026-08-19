"use client";

/* Bolt pattern + gauge, extracted so the landing page can show the real thing
   rather than a screenshot of it. Presentational only — state lives upstream. */

export const ORDER = [1, 5, 3, 7, 2, 6, 4, 8];
export const FULL = 45;

export function pos(n: number) {
  const a = (-90 + (n - 1) * 45) * (Math.PI / 180);
  return { x: 50 + 34 * Math.cos(a), y: 50 + 34 * Math.sin(a) };
}

export function Bolt({ n, level, next, err }: { n: number; level: number; next: boolean; err: boolean }) {
  const { x, y } = pos(n);
  const face =
    err ? "var(--color-stop)"
      : level === 2 ? "var(--color-go)"
      : level === 1 ? "var(--color-hold)"
      : next ? "var(--fg)"
      : "var(--panel-2)";
  const ink =
    err || level === 2 ? "var(--on-stop)"
      : level === 1 ? "var(--on-go)"
      : next ? "var(--bg)"
      : "var(--fg-mute)";
  const hex = 4.6;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = ((i * 60 - 30) * Math.PI) / 180;
    return `${x + hex * Math.cos(a)},${y + hex * Math.sin(a)}`;
  }).join(" ");

  return (
    <g>
      {next && (
        <circle cx={x} cy={y} r="12.5" fill="none" stroke="var(--fg)" strokeWidth="1.2"
          opacity={0.9} className="animate-flash" />
      )}
      <circle cx={x} cy={y} r="9" fill={face} stroke={err ? "var(--color-stop)" : "var(--line)"}
        strokeWidth={next ? 1.6 : 1} style={{ transition: "fill 260ms ease" }} />
      <polygon points={pts} fill="none" stroke={ink} strokeWidth="1.1" opacity={0.85}
        style={{ transition: "stroke 260ms ease" }} />
      <text x={x} y={y - 12.5} textAnchor="middle" stroke="none"
        fill={level === 2 ? "var(--color-go)" : level === 1 ? "var(--color-hold)" : "var(--fg-mute)"}
        style={{ fontSize: 7.5, fontFamily: "var(--font-mono)", fontWeight: 700, transition: "fill 260ms ease" }}>
        {n}
      </text>
    </g>
  );
}

export function BoltPattern({
  levels, next, err, idx, pass, onTap, className,
}: {
  levels: Record<number, number>;
  next: number | null;
  err?: number | null;
  idx: number;
  pass: number;
  onTap?: (n: number) => void;
  className?: string;
}) {
  const path = ORDER.slice(0, idx).map((n) => `${pos(n).x},${pos(n).y}`).join(" ");
  return (
    <svg viewBox="-9 -9 118 118" className={className} role="img" aria-label="Bolt pattern and torque sequence">
      <circle cx="50" cy="50" r="43" fill="none" stroke="var(--fg-mute)" strokeWidth="1.2" opacity={0.7} />
      <circle cx="50" cy="50" r="34" fill="none" stroke="var(--fg-mute)" strokeWidth="0.7" strokeDasharray="4 3" opacity={0.5} />
      <circle cx="50" cy="50" r="14" fill="none" stroke="var(--fg-mute)" strokeWidth="1.2" opacity={0.7} />
      <path d="M50 4v92M4 50h92" stroke="var(--fg-mute)" strokeWidth="0.6" strokeDasharray="9 3 2 3" opacity={0.35} fill="none" />
      {idx > 1 && (
        <polyline points={path} fill="none"
          stroke={pass === 1 ? "var(--color-go)" : "var(--color-hold)"}
          strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />
      )}
      {idx > 0 && next && (
        <line x1={pos(ORDER[idx - 1]).x} y1={pos(ORDER[idx - 1]).y} x2={pos(next).x} y2={pos(next).y}
          stroke="var(--fg)" strokeWidth="1.2" strokeDasharray="3 3" opacity={0.6} />
      )}
      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
        <g key={n} onClick={() => onTap?.(n)} style={{ cursor: onTap ? "pointer" : "default" }}>
          <circle cx={pos(n).x} cy={pos(n).y} r="13" fill="transparent" />
          <Bolt n={n} level={levels[n] ?? 0} next={n === next} err={err === n} />
        </g>
      ))}
    </svg>
  );
}

export function Gauge({ value, target }: { value: number; target: number }) {
  const R = 34;
  const LEN = Math.PI * R;
  const frac = Math.min(1, value / FULL);
  const tgt = target / FULL;
  return (
    <svg viewBox="0 0 100 62" className="w-full" role="img" aria-label={`${value} inch-pounds`}>
      <path d="M16 50a34 34 0 0 1 68 0" fill="none" stroke="var(--line)" strokeWidth="7" strokeLinecap="round" />
      <g transform={`rotate(${-180 + tgt * 180} 50 50)`}>
        <path d="M11 50h10" stroke="var(--fg-dim)" strokeWidth="1.6" />
      </g>
      <path d="M16 50a34 34 0 0 1 68 0" fill="none"
        stroke={value >= target ? "var(--color-go)" : "var(--color-hold)"}
        strokeWidth="7" strokeLinecap="round"
        strokeDasharray={LEN} strokeDashoffset={LEN * (1 - frac)}
        style={{ transition: "stroke-dashoffset 420ms cubic-bezier(.2,.8,.2,1), stroke 240ms ease" }} />
      <text x="50" y="44" textAnchor="middle" stroke="none" fill="var(--fg)"
        style={{ fontSize: 17, fontFamily: "var(--font-mono)", fontWeight: 700 }}>{value}</text>
      <text x="50" y="55" textAnchor="middle" stroke="none" fill="var(--fg-mute)"
        style={{ fontSize: 7, fontFamily: "var(--font-mono)" }}>in-lbf</text>
      <text x="16" y="60" textAnchor="middle" stroke="none" fill="var(--fg-mute)"
        style={{ fontSize: 6, fontFamily: "var(--font-mono)" }}>0</text>
      <text x="84" y="60" textAnchor="middle" stroke="none" fill="var(--fg-mute)"
        style={{ fontSize: 6, fontFamily: "var(--font-mono)" }}>{FULL}</text>
    </svg>
  );
}

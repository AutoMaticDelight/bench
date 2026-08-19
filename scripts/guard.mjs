#!/usr/bin/env node
/*
 * Design-system guard.
 *   (default)  precommit: block NEW arbitrary Tailwind values + raw hex.
 *              Ratchet — inspects only lines ADDED in the staged diff, so
 *              existing debt doesn't block commits but new debt can't enter.
 *   --audit    whole-repo report: count current sprawl (no failure).
 *
 * Bypass a genuine one-off:  git commit --no-verify
 */
import { execSync } from "node:child_process";

// Files where raw hex / token values legitimately live (your source of truth).
const TOKEN_FILES = [/tokens?\.css$/, /globals\.css$/, /-system\.css$/, /tailwind\.config\./, /theme\.(css|ts|js)$/];
const CODE = /\.(tsx|jsx|ts|js|css|html|vue|svelte)$/;

const RULES = [
  { re: /\btext-\[[0-9.]+(px|rem|em)\]/, msg: "arbitrary font-size — use a named text-* token" },
  { re: /\btracking-\[[^\]]+\]/,         msg: "arbitrary letter-spacing — use a tracking-* token" },
  { re: /\bleading-\[[0-9.]+\]/,         msg: "arbitrary line-height — use a leading-* token" },
  { re: /#[0-9a-fA-F]{3,8}\b/,           msg: "raw hex — use a color token", hex: true },
];

function check(file, code) {
  if (!CODE.test(file)) return [];
  const isToken = TOKEN_FILES.some((r) => r.test(file));
  const hits = [];
  for (const rule of RULES) {
    if (rule.hex && isToken) continue; // hex belongs in token files
    if (rule.re.test(code)) hits.push(rule.msg);
  }
  return hits;
}

if (process.argv.includes("--audit")) {
  const files = execSync(`git ls-files`, { encoding: "utf8" }).trim().split("\n").filter((f) => CODE.test(f));
  const tally = {};
  for (const f of files) {
    let body; try { body = execSync(`git show ${JSON.stringify(":" + f)} 2>/dev/null || cat ${JSON.stringify(f)}`, { encoding: "utf8" }); } catch { continue; }
    for (const line of body.split("\n")) for (const m of check(f, line)) tally[m] = (tally[m] || 0) + 1;
  }
  console.log("Design-system audit (whole repo):");
  for (const [m, n] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)}  ${m}`);
  if (!Object.keys(tally).length) console.log("  clean — no arbitrary values found.");
  process.exit(0);
}

// precommit: flag NET-new violations only. A flagged line that was also removed
// elsewhere in the diff (a move/reformat) isn't new debt — skip it.
let diff;
try { diff = execSync("git diff --cached -U0 --no-color", { encoding: "utf8" }); } catch { process.exit(0); }

// Pass 1: multiset of removed lines (trimmed content).
const removed = new Map();
for (const line of diff.split("\n")) {
  if (line.startsWith("-") && !line.startsWith("---")) {
    const c = line.slice(1).trim();
    removed.set(c, (removed.get(c) || 0) + 1);
  }
}

// Pass 2: added lines. If an added line equals a removed one, it's a move → consume + skip.
const offenders = [];
let file = null, lineNo = 0;
for (const line of diff.split("\n")) {
  const mF = line.match(/^\+\+\+ b\/(.+)$/); if (mF) { file = mF[1]; continue; }
  const mH = line.match(/^@@ .*\+(\d+)/);     if (mH) { lineNo = parseInt(mH[1], 10); continue; }
  if (!line.startsWith("+") || line.startsWith("+++")) continue;
  const code = line.slice(1);
  const trimmed = code.trim();
  if (removed.get(trimmed)) { removed.set(trimmed, removed.get(trimmed) - 1); lineNo++; continue; } // moved, not new
  for (const msg of check(file || "", code)) offenders.push(`  ${file}:${lineNo}  ${msg}\n      ${code.trim().slice(0, 110)}`);
  lineNo++;
}
if (offenders.length) {
  console.error("\n✖ Design-system guard blocked this commit — new arbitrary values:\n");
  console.error(offenders.join("\n"));
  console.error(`\n${offenders.length} violation(s). Use a token. Genuine one-off? git commit --no-verify\n`);
  process.exit(1);
}
process.exit(0);

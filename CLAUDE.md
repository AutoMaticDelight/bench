# Bench — concept study, build execution software

An unsolicited prototype: one work-order traveler, executed on two surfaces.
Not affiliated with any company. Every part number, torque value, work order
and serial in it is invented.

## What it is
- `/` — the argument. Six design decisions and why.
- `/floor` — technician. Tablet, gloved, cleanroom. One step per screen.
- `/plan` — planner. Desk, cursor, dense. Live shortage + MRB queues.

Floor and desk share state through `localStorage` + `BroadcastChannel`
(`lib/store.ts`), so a shortage raised at the bench appears on the planner
board in another tab with no server.

## Design system — non-negotiable (guarded)
- **One token source**: `app/globals.css`. `:root`/`[data-surface="floor"]`
  and `[data-surface="desk"]` define the same semantic variables at different
  densities and contrasts. Components never branch on surface — they read tokens.
- **A surface must set `color` explicitly.** `body { color: var(--fg) }`
  resolves once; children inherit the computed value, so a token swap deeper in
  the tree silently does nothing without `[data-surface] { color: var(--fg) }`.
- **No arbitrary typography or color** in components — no `text-[Npx]`,
  `tracking-[…]`, `leading-[…]`, raw hex, or inline `fontSize`. Use the named
  scale (`.t-mega/.t-display/.t-hero/.t-title/.t-head/.t-body/.t-sub/.t-lead/
  .t-label/.t-caption/.t-id/.t-id-lg/.t-num/.t-code`).
- **Status is a reserved vocabulary.** `--color-go/hold/stop` mean go, hold and
  stop. Nothing decorative may borrow them. The action color is deliberately
  neutral (`--action`) so it never competes with status.
- **One button system**: `.btn` + `.btn-xl`/`.btn-icon` + one variant
  (`-primary/-go/-stop/-outline/-ghost`). Never hand-roll from utilities.
  Disabled changes *state*, not just alpha — a dimmed fill still reads tappable.
- **Rule of three**: the third occurrence of a utility cluster becomes an
  `@utility` in `globals.css`.

Enforced at precommit by `scripts/guard.mjs` — a ratchet that inspects only
lines ADDED in the staged diff, so existing debt never blocks a commit but new
debt cannot enter. `npm run guard:audit` reports whole-repo sprawl.
`git commit --no-verify` is the escape hatch for a genuine one-off.

## Interaction rules the prototype is arguing for
- Friction goes on the irreversible action (hold to sign), never on the safety
  action (one tap to raise an NCR).
- Sequence-critical work is enforced, not printed — torque star pattern and
  fastener stack-up both refuse out-of-order input.
- The commit rail never moves. The body does the work; the rail advances.
- Identifiers are always mono + tabular. They get read aloud and transcribed.

## Stack
Next 16 (App Router) · React 19 · Tailwind v4 · no component library.
Hardware is drawn as SVG line art in `components/art/Parts.tsx` — a photo of a
washer at thumbnail size tells you nothing; a sectioned profile shows thickness,
which is the whole difference between `NAS1149D0463K` and `NAS1149D0332K`.

## Done means
Verified in the browser at tablet **and** desktop width before shipping.

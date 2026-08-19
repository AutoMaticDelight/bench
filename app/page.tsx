import Link from "next/link";
import { IconArrow } from "@/components/Icon";
import { Showcase } from "@/components/Showcase";

const DECISIONS: { h: string; p: string }[] = [
  {
    h: "Status is a reserved vocabulary",
    p: "Green, amber and red mean go, hold and stop — and nothing else. No brand accent, no decorative highlight, no chart series may borrow them. The moment a color means two things on a factory floor, it means nothing.",
  },
  {
    h: "Friction belongs on the irreversible action",
    p: "Raising a non-conformance is one tap with a reason code and optional prose. Signing a buy-off into the permanent build record is a deliberate 1.2-second hold. If reporting a problem is harder than ignoring one, you get clean data and bad hardware.",
  },
  {
    h: "Identifiers are always mono, always tabular",
    p: "Part numbers and serials get read aloud, transcribed onto a card, and typed into a different system. NAS1149D0463K versus NAS1149D0332K is a scrap event. Proportional type makes that comparison harder for no reason.",
  },
  {
    h: "The commit action never moves",
    p: "One step per screen, fixed status rail at the top, fixed commit rail at the bottom. A technician at a mounted tablet should never scroll to find out how to proceed, and should never lose their place to report something.",
  },
  {
    h: "Catch the error at the wrench, not at buy-off",
    p: "The traveler has always printed the torque sequence. Enforcing it is different work: a wrong pull is caught in the second it happens instead of during a QA re-walk two hours later, when the fix is rework instead of a tap.",
  },
  {
    h: "One design system, two densities",
    p: "The technician and planner screens share every token and component. Only the density and contrast variables change. That is the whole mechanism for staying coherent as modules multiply — not a rule in a doc, a variable in a file.",
  },
];

export default function Home() {
  return (
    <div data-surface="desk" className="min-h-dvh bg-bg">
      <div className="mx-auto max-w-[860px] px-6 py-14 sm:px-8">
        <p className="t-label">Concept study · build execution software</p>
        <h1 className="t-display mt-3">
          One traveler, two surfaces.
        </h1>
        <p className="t-lead mt-4 max-w-[62ch]">
          A working prototype of the workflow that internal manufacturing software lives or dies
          on: a technician executing one step of a build against a hardware kit, and the planner
          who has to know the second that step goes sideways. Built as an argument, not a mockup —
          it runs, it measures itself, and the two surfaces talk to each other.
        </p>

        <div className="mt-8">
          <Showcase />
          <p className="t-caption mt-2">
            Live components, not screenshots — the same code the technician surface renders,
            re-resolving its tokens against the floor palette inside this page.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link href="/floor" className="panel group block transition-colors hover:border-ink-400" style={{ padding: "1.25rem" }}>
            <span className="chip chip-info">Tablet · gloved · cleanroom</span>
            <h2 className="t-title mt-3">Technician</h2>
            <p className="t-caption mt-1.5">
              Five steps of a hinge-bracket install. Photograph the kit tray, get told two lines
              are wrong before you start, page a runner, torque in enforced sequence, sign off.
            </p>
            <span className="t-sub mt-3 inline-flex items-center gap-1.5">
              Start the traveler <IconArrow size={18} />
            </span>
          </Link>

          <Link href="/plan" className="panel group block transition-colors hover:border-ink-400" style={{ padding: "1.25rem" }}>
            <span className="chip chip-mute">Desk · cursor · many rows</span>
            <h2 className="t-title mt-3">Planner</h2>
            <p className="t-caption mt-1.5">
              WIP by station, what is over plan, the MRB queue, and the shortage the technician
              just raised — arriving live, in the same tokens at four times the density.
            </p>
            <span className="t-sub mt-3 inline-flex items-center gap-1.5">
              Open the board <IconArrow size={18} />
            </span>
          </Link>
        </div>

        <div className="panel mt-3" style={{ padding: "1.25rem", background: "var(--info-soft)", borderColor: "transparent" }}>
          <p className="t-sub">Best viewed as two windows side by side.</p>
          <p className="t-caption mt-1">
            Put the technician view in a narrow window and the planner board beside it. Run the
            kit check and watch the shortage appear on the board while you are still standing at
            the bench. That loop — floor to supply chain and back — is the thing worth arguing about.
          </p>
        </div>

        <div className="panel mt-3 flex flex-wrap items-center justify-between gap-3"
          style={{ padding: "1.25rem" }}>
          <div>
            <p className="t-head">Want the reasoning, not just the screens?</p>
            <p className="t-caption mt-1">
              Research approach, the six decisions in full, what I&apos;d measure, and what this
              prototype does not prove — on automaticdelight.com.
            </p>
          </div>
          <a href="https://automaticdelight.com/bench" className="btn btn-primary">Read the case study <IconArrow size={18} /></a>
        </div>

        <hr className="rule my-12" />

        <h2 className="t-title">Six decisions, and why</h2>
        <p className="t-caption mt-1">The rationale is the deliverable. The screens are evidence.</p>
        <div className="mt-6 flex flex-col gap-6">
          {DECISIONS.map((d, i) => (
            <div key={d.h} className="grid gap-2 sm:grid-cols-[2rem_1fr]">
              <span className="t-id" style={{ color: "var(--fg-mute)" }}>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="t-head">{d.h}</h3>
                <p className="t-body mt-1" style={{ color: "var(--fg-dim)" }}>{d.p}</p>
              </div>
            </div>
          ))}
        </div>

        <hr className="rule my-12" />

        <h2 className="t-title">Standards with teeth</h2>
        <p className="t-body mt-3" style={{ color: "var(--fg-dim)" }}>
          Everything here is drawn from one token file. There is no arbitrary type size and no raw
          hex anywhere in a component — and that is enforced, not requested: a precommit guard
          reads the staged diff and rejects new arbitrary values, while a ratchet lets existing
          debt pay itself down instead of blocking a shipping team. A design system that only
          lives in a library file is a suggestion. This one fails the commit.
        </p>
        <pre
          className="panel t-code mt-4 overflow-x-auto"
          style={{ padding: "1rem", background: "var(--panel-2)" }}
        >{`$ npm run guard

  components/StepView.tsx
    ✕ arbitrary font-size — use a named text-* token
    ✕ raw hex — use a color token

  2 new violations. Commit blocked.`}</pre>

        <hr className="rule my-12" />

        <h2 className="t-title">What this is</h2>
        <p className="t-body mt-3" style={{ color: "var(--fg-dim)" }}>
          An unsolicited concept study by <strong style={{ color: "var(--fg)" }}>Bryan Holland</strong>,
          built to think through shop-floor build execution properly rather than describe it in a deck.
          It is not affiliated with, endorsed by, or built from the internal software of any company,
          and contains no proprietary information — every part number, torque value and work order in
          it is invented. The measured comparison on the summary screen uses an illustrative baseline
          for the paper-traveler flow; the real number would come from your floor, which is exactly
          the point of instrumenting it.
        </p>

        <p className="t-caption mt-10">
          Next 16 · React 19 · Tailwind v4 · no component library · roughly a day of work.
        </p>
      </div>
    </div>
  );
}

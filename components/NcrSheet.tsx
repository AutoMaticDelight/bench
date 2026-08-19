"use client";

import { useState } from "react";
import { IconFlag, IconX } from "./Icon";

const REASONS = [
  "Damaged threads",
  "Surface finish",
  "Dimensional",
  "FOD present",
  "Missing hardware",
  "Fit / alignment",
  "Contamination",
  "Other",
];

export function NcrSheet({
  step,
  onClose,
  onSubmit,
}: {
  step: number;
  onClose: () => void;
  onSubmit: (reason: string, note: string) => string;
}) {
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [raised, setRaised] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "var(--scrim)" }}>
      <button aria-label="Close" className="flex-1" onClick={onClose} />
      <div
        className="panel rounded-b-none"
        style={{ padding: "var(--pad)", paddingBottom: "calc(var(--pad) * 1.5)", maxHeight: "88vh", overflowY: "auto" }}
      >
        {raised ? (
          <div className="py-6 text-center">
            <p className="t-hero fg-hold">{raised} raised</p>
            <p className="t-body mt-2">
              Step {step} is on hold. Your planner and the MRB queue have it. Nothing you did is lost.
            </p>
            <button className="btn btn-primary btn-xl mt-6 w-full" onClick={onClose}>
              Back to step {step}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="t-label">Flag a non-conformance</p>
                <p className="t-title mt-1">What did you find?</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Cancel">
                <IconX size={24} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className="btn btn-outline"
                  style={
                    reason === r
                      ? { borderColor: "var(--color-hold)", background: "var(--hold-soft)", color: "var(--color-hold)" }
                      : undefined
                  }
                >
                  {r}
                </button>
              ))}
            </div>

            <label className="field mt-4">
              <span className="t-label">Note (optional)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Typing with gloves on is a tax. Reason code is required, prose is not."
                className="panel w-full resize-none"
                style={{ padding: "0.75rem", fontSize: "var(--fs-sub)", background: "var(--panel-2)", color: "var(--fg)" }}
              />
            </label>

            <button
              disabled={!reason}
              onClick={() => setRaised(onSubmit(reason!, note))}
              className="btn btn-stop btn-xl mt-4 w-full"
            >
              <IconFlag size={24} /> Raise non-conformance
            </button>
            <p className="t-caption mt-3">
              One tap, no countersign, no hunting for a supervisor. If reporting a problem is
              harder than ignoring one, the data goes bad and so does the hardware.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

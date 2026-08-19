"use client";

/* The commit rail is the one place a technician looks for "what now".
   Steps publish their current action into it instead of rendering buttons
   inside scrollable content, where growing the content can push the action
   off screen. */
export type RailAction = {
  label: string;
  run?: () => void;
  variant?: "btn-primary" | "btn-go" | "btn-stop";
  disabled?: boolean;
};
export type SetRail = (a: RailAction | null) => void;

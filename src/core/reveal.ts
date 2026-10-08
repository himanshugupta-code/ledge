export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CursorSample {
  x: number;
  y: number;
  time: number;
}

export type RevealMode = "hidden" | "hover" | "pinned";

export interface RevealState {
  mode: RevealMode;
  edgeSince: number | null;
}

export interface RevealOptions {
  dwellMs: number;
  edgeTolerance: number;
  stripHeight: number;
  exitMargin: number;
}

export const DEFAULT_REVEAL: RevealOptions = {
  dwellMs: 350,
  edgeTolerance: 2,
  stripHeight: 168,
  exitMargin: 24,
};

export const initialReveal: RevealState = { mode: "hidden", edgeSince: null };

function withinX(sample: CursorSample, display: Rect): boolean {
  return sample.x >= display.x && sample.x < display.x + display.width;
}

export function nextReveal(
  state: RevealState,
  sample: CursorSample,
  display: Rect,
  options: RevealOptions = DEFAULT_REVEAL,
): RevealState {
  if (state.mode === "pinned") return state;

  if (state.mode === "hover") {
    const below = sample.y > display.y + options.stripHeight + options.exitMargin;
    return below || !withinX(sample, display) ? initialReveal : state;
  }

  const atEdge = withinX(sample, display) && sample.y <= display.y + options.edgeTolerance;
  if (!atEdge) return initialReveal;

  const since = state.edgeSince ?? sample.time;
  if (sample.time - since >= options.dwellMs) return { mode: "hover", edgeSince: null };
  return { mode: "hidden", edgeSince: since };
}

export function toggle(state: RevealState): RevealState {
  return state.mode === "hidden" ? { mode: "pinned", edgeSince: null } : initialReveal;
}

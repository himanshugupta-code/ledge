import { describe, expect, it } from "vitest";
import { DEFAULT_REVEAL, initialReveal, nextReveal, toggle, type RevealState } from "./reveal";

const display = { x: 0, y: 0, width: 1440, height: 900 };
const sample = (x: number, y: number, time: number) => ({ x, y, time });

function run(samples: Array<[number, number, number]>, start: RevealState = initialReveal) {
  return samples.reduce((state, [x, y, t]) => nextReveal(state, sample(x, y, t), display), start);
}

describe("nextReveal", () => {
  it("stays hidden while the pointer is away from the top edge", () => {
    expect(run([[500, 300, 0], [500, 300, 1000]]).mode).toBe("hidden");
  });

  it("reveals after resting at the top edge for the dwell time", () => {
    const state = run([[500, 0, 0], [500, 1, 200], [500, 0, DEFAULT_REVEAL.dwellMs]]);
    expect(state.mode).toBe("hover");
  });

  it("does not reveal when the pointer only brushes the edge", () => {
    const state = run([[500, 0, 0], [500, 40, 100], [500, 0, 200], [500, 0, 400]]);
    expect(state.mode).toBe("hidden");
  });

  it("stays open while the pointer is over the ledge", () => {
    const open: RevealState = { mode: "hover", edgeSince: null };
    expect(run([[500, 120, 0], [900, 160, 100]], open).mode).toBe("hover");
  });

  it("hides once the pointer moves below the ledge", () => {
    const open: RevealState = { mode: "hover", edgeSince: null };
    const below = DEFAULT_REVEAL.stripHeight + DEFAULT_REVEAL.exitMargin + 1;
    expect(run([[500, below, 0]], open).mode).toBe("hidden");
  });

  it("hides when the pointer leaves the display sideways", () => {
    const open: RevealState = { mode: "hover", edgeSince: null };
    expect(run([[1500, 10, 0]], open).mode).toBe("hidden");
  });

  it("ignores pointer movement while pinned", () => {
    const pinned: RevealState = { mode: "pinned", edgeSince: null };
    expect(run([[500, 800, 0]], pinned).mode).toBe("pinned");
  });

  it("respects the display offset on secondary screens", () => {
    const secondary = { x: 1440, y: -200, width: 1920, height: 1080 };
    let state = nextReveal(initialReveal, sample(2000, -200, 0), secondary);
    state = nextReveal(state, sample(2000, -199, DEFAULT_REVEAL.dwellMs), secondary);
    expect(state.mode).toBe("hover");
  });
});

describe("toggle", () => {
  it("pins a hidden ledge and hides an open one", () => {
    expect(toggle(initialReveal).mode).toBe("pinned");
    expect(toggle({ mode: "pinned", edgeSince: null }).mode).toBe("hidden");
    expect(toggle({ mode: "hover", edgeSince: null }).mode).toBe("hidden");
  });
});

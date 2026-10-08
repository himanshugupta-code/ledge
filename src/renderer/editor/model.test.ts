import { describe, expect, it } from "vitest";
import {
  IDENTITY,
  applyCrop,
  applyMatrix,
  arrowHead,
  commit,
  createDoc,
  filterCss,
  hitTest,
  isDefaultAdjustments,
  isMeaningful,
  normalizeRect,
  orient,
  redo,
  removeShape,
  shapeBounds,
  startHistory,
  translateShape,
  undo,
  viewRect,
  type EditorDoc,
  type Shape,
} from "./model";

const line = (id: string, x1: number, y1: number, x2: number, y2: number): Shape => ({
  id,
  kind: "line",
  color: "#f00",
  width: 4,
  from: { x: x1, y: y1 },
  to: { x: x2, y: y2 },
});

const box = (id: string, kind: "rect" | "ellipse", x: number, y: number, w: number, h: number, filled = false): Shape => ({
  id,
  kind,
  color: "#f00",
  width: 4,
  filled,
  rect: { x, y, width: w, height: h },
});

describe("orient", () => {
  it("swaps dimensions and maps the image corners when rotating clockwise", () => {
    const doc = orient(createDoc(400, 200), "rotate-cw");
    expect([doc.width, doc.height]).toEqual([200, 400]);
    expect(applyMatrix(doc.transform, { x: 0, y: 0 })).toEqual({ x: 200, y: 0 });
    expect(applyMatrix(doc.transform, { x: 400, y: 200 })).toEqual({ x: 0, y: 400 });
  });

  it("returns to the original after four clockwise rotations", () => {
    let doc: EditorDoc = { ...createDoc(400, 200), shapes: [line("a", 10, 20, 110, 40)] };
    for (let i = 0; i < 4; i += 1) doc = orient(doc, "rotate-cw");
    expect(doc.transform).toEqual(IDENTITY);
    expect([doc.width, doc.height]).toEqual([400, 200]);
    expect(doc.shapes[0]).toMatchObject({ from: { x: 10, y: 20 }, to: { x: 110, y: 40 } });
  });

  it("undoes a clockwise rotation with a counter-clockwise one", () => {
    const doc = orient(orient(createDoc(300, 100), "rotate-cw"), "rotate-ccw");
    expect(doc.transform).toEqual(IDENTITY);
    expect([doc.width, doc.height]).toEqual([300, 100]);
  });

  it("moves shapes and the crop with the image", () => {
    const start: EditorDoc = {
      ...createDoc(400, 200),
      crop: { x: 0, y: 0, width: 100, height: 50 },
      shapes: [box("r", "rect", 0, 0, 100, 50)],
    };
    const rotated = orient(start, "rotate-cw");
    expect(rotated.crop).toEqual({ x: 150, y: 0, width: 50, height: 100 });
    expect(rotated.shapes[0]).toMatchObject({ rect: { x: 150, y: 0, width: 50, height: 100 } });
  });

  it("mirrors horizontally and returns after flipping twice", () => {
    const start: EditorDoc = { ...createDoc(400, 200), shapes: [line("a", 10, 20, 50, 20)] };
    const flipped = orient(start, "flip-x");
    expect(flipped.shapes[0]).toMatchObject({ from: { x: 390, y: 20 }, to: { x: 350, y: 20 } });
    const back = orient(flipped, "flip-x");
    expect(back.transform).toEqual(IDENTITY);
    expect(back.shapes[0]).toMatchObject({ from: { x: 10, y: 20 } });
  });

  it("mirrors vertically", () => {
    const flipped = orient({ ...createDoc(400, 200), shapes: [line("a", 0, 10, 0, 30)] }, "flip-y");
    expect(flipped.shapes[0]).toMatchObject({ from: { x: 0, y: 190 }, to: { x: 0, y: 170 } });
  });
});

describe("applyCrop", () => {
  it("clamps to the image and rounds", () => {
    const doc = applyCrop(createDoc(400, 200), { x: -10, y: 20.4, width: 200, height: 500 });
    expect(doc.crop).toEqual({ x: 0, y: 20, width: 190, height: 180 });
    expect(viewRect(doc)).toEqual(doc.crop);
  });

  it("ignores tiny crops and clears a full-size crop", () => {
    const doc = createDoc(400, 200);
    expect(applyCrop(doc, { x: 10, y: 10, width: 3, height: 50 })).toBe(doc);
    expect(applyCrop({ ...doc, crop: { x: 1, y: 1, width: 10, height: 10 } }, { x: 0, y: 0, width: 400, height: 200 }).crop).toBeNull();
  });
});

describe("hitTest", () => {
  const shapes = [box("outline", "rect", 100, 100, 100, 100), line("ln", 0, 0, 100, 0), box("disc", "ellipse", 300, 0, 100, 100, true)];

  it("hits the outline of an unfilled rectangle but not its middle", () => {
    expect(hitTest(shapes, { x: 101, y: 150 }, 3)).toBe("outline");
    expect(hitTest(shapes, { x: 150, y: 150 }, 3)).toBeNull();
  });

  it("hits near a line and inside a filled ellipse", () => {
    expect(hitTest(shapes, { x: 50, y: 4 }, 3)).toBe("ln");
    expect(hitTest(shapes, { x: 350, y: 50 }, 3)).toBe("disc");
  });

  it("prefers the topmost shape", () => {
    const stacked = [box("bottom", "rect", 0, 0, 50, 50, true), box("top", "rect", 0, 0, 50, 50, true)];
    expect(hitTest(stacked, { x: 25, y: 25 }, 2)).toBe("top");
  });

  it("hits text by its bounding box", () => {
    const text: Shape = { id: "t", kind: "text", color: "#000", width: 0, at: { x: 10, y: 10 }, text: "Hello", size: 20 };
    expect(hitTest([text], { x: 30, y: 20 }, 2)).toBe("t");
    expect(hitTest([text], { x: 300, y: 20 }, 2)).toBeNull();
  });
});

describe("shape helpers", () => {
  it("normalizes rectangles drawn in any direction", () => {
    expect(normalizeRect({ x: 50, y: 40 }, { x: 10, y: 0 })).toEqual({ x: 10, y: 0, width: 40, height: 40 });
  });

  it("translates shapes", () => {
    expect(translateShape(line("a", 0, 0, 10, 10), 5, -5)).toMatchObject({ from: { x: 5, y: -5 }, to: { x: 15, y: 5 } });
  });

  it("drops accidental clicks and empty text", () => {
    expect(isMeaningful(line("a", 0, 0, 1, 1))).toBe(false);
    expect(isMeaningful(box("b", "rect", 0, 0, 20, 20))).toBe(true);
    expect(isMeaningful({ id: "t", kind: "text", color: "#000", width: 0, at: { x: 0, y: 0 }, text: "  ", size: 20 })).toBe(false);
  });

  it("builds an arrowhead that ends at the target point", () => {
    const [tip, left, right] = arrowHead({ x: 0, y: 0 }, { x: 100, y: 0 }, 4);
    expect(tip).toEqual({ x: 100, y: 0 });
    expect(left.x).toBeLessThan(100);
    expect(left.y).toBeCloseTo(-right.y);
  });

  it("measures shape bounds including stroke width", () => {
    expect(shapeBounds(line("a", 10, 10, 30, 50))).toEqual({ x: 8, y: 8, width: 24, height: 44 });
    const pen: Shape = { id: "p", kind: "pen", color: "#000", width: 2, points: [{ x: 5, y: 9 }, { x: 1, y: 3 }] };
    expect(shapeBounds(pen)).toEqual({ x: 0, y: 2, width: 6, height: 8 });
  });

  it("removes shapes by id", () => {
    const doc = { ...createDoc(10, 10), shapes: [line("a", 0, 0, 5, 5), line("b", 0, 0, 5, 5)] };
    expect(removeShape(doc, "a").shapes.map((s) => s.id)).toEqual(["b"]);
  });
});

describe("history", () => {
  it("undoes and redoes", () => {
    const a = createDoc(10, 10);
    const b = { ...a, shapes: [line("x", 0, 0, 5, 5)] };
    const c = { ...b, shapes: [] };
    let h = commit(commit(startHistory(a), b), c);
    h = undo(h);
    expect(h.present).toBe(b);
    h = undo(h);
    expect(h.present).toBe(a);
    expect(undo(h)).toBe(h);
    h = redo(h);
    expect(h.present).toBe(b);
  });

  it("clears redo after a new change and ignores no-op commits", () => {
    const a = createDoc(10, 10);
    const b = { ...a, crop: { x: 0, y: 0, width: 9, height: 9 } };
    let h = undo(commit(startHistory(a), b));
    h = commit(h, { ...a });
    expect(h.future).toHaveLength(0);
    expect(commit(h, h.present)).toBe(h);
  });
});

describe("adjustments", () => {
  it("builds a CSS filter", () => {
    expect(filterCss({ brightness: 110, contrast: 90, saturation: 0, warmth: 20, grayscale: 100 })).toBe(
      "brightness(110%) contrast(90%) saturate(0%) sepia(20%) grayscale(100%)",
    );
    expect(isDefaultAdjustments(createDoc(1, 1).adjust)).toBe(true);
  });
});

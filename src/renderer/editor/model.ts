export type Tool =
  | "select"
  | "crop"
  | "arrow"
  | "line"
  | "rect"
  | "ellipse"
  | "pen"
  | "highlight"
  | "text"
  | "pixelate";

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ShapeBase {
  id: string;
  color: string;
  width: number;
}

export type SegmentShape = ShapeBase & { kind: "arrow" | "line"; from: Point; to: Point };
export type BoxShape = ShapeBase & { kind: "rect" | "ellipse"; rect: Rect; filled: boolean };
export type StrokeShape = ShapeBase & { kind: "pen" | "highlight"; points: Point[] };
export type TextShape = ShapeBase & { kind: "text"; at: Point; text: string; size: number };
export type PixelateShape = ShapeBase & { kind: "pixelate"; rect: Rect };

export type Shape = SegmentShape | BoxShape | StrokeShape | TextShape | PixelateShape;

export interface Matrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  grayscale: number;
}

export interface EditorDoc {
  width: number;
  height: number;
  transform: Matrix;
  crop: Rect | null;
  adjust: Adjustments;
  shapes: Shape[];
}

export const IDENTITY: Matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  warmth: 0,
  grayscale: 0,
};

export function createDoc(width: number, height: number): EditorDoc {
  return { width, height, transform: IDENTITY, crop: null, adjust: { ...DEFAULT_ADJUSTMENTS }, shapes: [] };
}

export function filterCss(adjust: Adjustments): string {
  return [
    `brightness(${adjust.brightness}%)`,
    `contrast(${adjust.contrast}%)`,
    `saturate(${adjust.saturation}%)`,
    `sepia(${adjust.warmth}%)`,
    `grayscale(${adjust.grayscale}%)`,
  ].join(" ");
}

export function isDefaultAdjustments(adjust: Adjustments): boolean {
  return (Object.keys(DEFAULT_ADJUSTMENTS) as Array<keyof Adjustments>).every(
    (key) => adjust[key] === DEFAULT_ADJUSTMENTS[key],
  );
}

const clean = (value: number) => (value === 0 ? 0 : value);

export function multiply(n: Matrix, m: Matrix): Matrix {
  return {
    a: clean(n.a * m.a + n.c * m.b),
    b: clean(n.b * m.a + n.d * m.b),
    c: clean(n.a * m.c + n.c * m.d),
    d: clean(n.b * m.c + n.d * m.d),
    e: clean(n.a * m.e + n.c * m.f + n.e),
    f: clean(n.b * m.e + n.d * m.f + n.f),
  };
}

export function applyMatrix(m: Matrix, p: Point): Point {
  return { x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f };
}

export function normalizeRect(a: Point, b: Point): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  };
}

function mapRect(m: Matrix, rect: Rect): Rect {
  return normalizeRect(
    applyMatrix(m, { x: rect.x, y: rect.y }),
    applyMatrix(m, { x: rect.x + rect.width, y: rect.y + rect.height }),
  );
}

export function mapShape(m: Matrix, shape: Shape): Shape {
  switch (shape.kind) {
    case "arrow":
    case "line":
      return { ...shape, from: applyMatrix(m, shape.from), to: applyMatrix(m, shape.to) };
    case "rect":
    case "ellipse":
    case "pixelate":
      return { ...shape, rect: mapRect(m, shape.rect) };
    case "pen":
    case "highlight":
      return { ...shape, points: shape.points.map((p) => applyMatrix(m, p)) };
    case "text": {
      const box = mapRect(m, textBounds(shape));
      return { ...shape, at: { x: box.x, y: box.y } };
    }
  }
}

export type Orientation = "rotate-cw" | "rotate-ccw" | "flip-x" | "flip-y";

function orientationMatrix(kind: Orientation, width: number, height: number): Matrix {
  switch (kind) {
    case "rotate-cw":
      return { a: 0, b: 1, c: -1, d: 0, e: height, f: 0 };
    case "rotate-ccw":
      return { a: 0, b: -1, c: 1, d: 0, e: 0, f: width };
    case "flip-x":
      return { a: -1, b: 0, c: 0, d: 1, e: width, f: 0 };
    case "flip-y":
      return { a: 1, b: 0, c: 0, d: -1, e: 0, f: height };
  }
}

export function orient(doc: EditorDoc, kind: Orientation): EditorDoc {
  const step = orientationMatrix(kind, doc.width, doc.height);
  const swaps = kind === "rotate-cw" || kind === "rotate-ccw";
  return {
    ...doc,
    width: swaps ? doc.height : doc.width,
    height: swaps ? doc.width : doc.height,
    transform: multiply(step, doc.transform),
    crop: doc.crop ? mapRect(step, doc.crop) : null,
    shapes: doc.shapes.map((shape) => mapShape(step, shape)),
  };
}

export function clampRect(rect: Rect, width: number, height: number): Rect {
  const x = Math.max(0, Math.min(rect.x, width));
  const y = Math.max(0, Math.min(rect.y, height));
  return {
    x,
    y,
    width: Math.max(0, Math.min(rect.x + rect.width, width) - x),
    height: Math.max(0, Math.min(rect.y + rect.height, height) - y),
  };
}

export const MIN_CROP = 8;

export function applyCrop(doc: EditorDoc, rect: Rect): EditorDoc {
  const clamped = clampRect(rect, doc.width, doc.height);
  if (clamped.width < MIN_CROP || clamped.height < MIN_CROP) return doc;
  const full = clamped.x === 0 && clamped.y === 0 && clamped.width === doc.width && clamped.height === doc.height;
  return { ...doc, crop: full ? null : roundRect(clamped) };
}

function roundRect(rect: Rect): Rect {
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

export function viewRect(doc: EditorDoc): Rect {
  return doc.crop ?? { x: 0, y: 0, width: doc.width, height: doc.height };
}

export function textBounds(shape: TextShape): Rect {
  const lines = shape.text.split("\n");
  const longest = Math.max(1, ...lines.map((line) => line.length));
  return { x: shape.at.x, y: shape.at.y, width: longest * shape.size * 0.6, height: lines.length * shape.size * 1.25 };
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function insideRect(p: Point, rect: Rect, pad = 0): boolean {
  return (
    p.x >= rect.x - pad &&
    p.x <= rect.x + rect.width + pad &&
    p.y >= rect.y - pad &&
    p.y <= rect.y + rect.height + pad
  );
}

export function hitsShape(shape: Shape, p: Point, tolerance: number): boolean {
  const reach = tolerance + shape.width / 2;
  switch (shape.kind) {
    case "arrow":
    case "line":
      return distanceToSegment(p, shape.from, shape.to) <= reach;
    case "pen":
    case "highlight":
      if (shape.points.length === 1) return Math.hypot(p.x - shape.points[0].x, p.y - shape.points[0].y) <= reach;
      return shape.points.some((point, i) => i > 0 && distanceToSegment(p, shape.points[i - 1], point) <= reach);
    case "rect": {
      if (shape.filled) return insideRect(p, shape.rect, reach);
      const { x, y, width, height } = shape.rect;
      const corners = [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height },
      ];
      return corners.some((corner, i) => distanceToSegment(p, corner, corners[(i + 1) % 4]) <= reach);
    }
    case "ellipse": {
      const rx = shape.rect.width / 2;
      const ry = shape.rect.height / 2;
      if (rx === 0 || ry === 0) return false;
      const cx = shape.rect.x + rx;
      const cy = shape.rect.y + ry;
      const r = Math.hypot((p.x - cx) / rx, (p.y - cy) / ry);
      if (shape.filled) return r <= 1 + reach / Math.min(rx, ry);
      return Math.abs(r - 1) * Math.min(rx, ry) <= reach;
    }
    case "text":
      return insideRect(p, textBounds(shape), tolerance);
    case "pixelate":
      return insideRect(p, shape.rect, tolerance);
  }
}

export function hitTest(shapes: readonly Shape[], p: Point, tolerance: number): string | null {
  for (let i = shapes.length - 1; i >= 0; i -= 1) {
    if (hitsShape(shapes[i], p, tolerance)) return shapes[i].id;
  }
  return null;
}

export function translateShape(shape: Shape, dx: number, dy: number): Shape {
  return mapShape({ ...IDENTITY, e: dx, f: dy }, shape);
}

export function isMeaningful(shape: Shape): boolean {
  switch (shape.kind) {
    case "arrow":
    case "line":
      return Math.hypot(shape.to.x - shape.from.x, shape.to.y - shape.from.y) >= 3;
    case "rect":
    case "ellipse":
    case "pixelate":
      return shape.rect.width >= 3 && shape.rect.height >= 3;
    case "pen":
    case "highlight":
      return shape.points.length > 0;
    case "text":
      return shape.text.trim().length > 0;
  }
}

export function arrowHead(from: Point, to: Point, width: number): [Point, Point, Point] {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const length = Math.max(12, width * 4);
  const spread = Math.PI / 7;
  return [
    to,
    { x: to.x - length * Math.cos(angle - spread), y: to.y - length * Math.sin(angle - spread) },
    { x: to.x - length * Math.cos(angle + spread), y: to.y - length * Math.sin(angle + spread) },
  ];
}

export function pixelSize(rect: Rect): number {
  return Math.max(8, Math.round(Math.min(rect.width, rect.height) / 6));
}

export interface History {
  past: EditorDoc[];
  present: EditorDoc;
  future: EditorDoc[];
}

export const HISTORY_LIMIT = 100;

export function startHistory(doc: EditorDoc): History {
  return { past: [], present: doc, future: [] };
}

export function commit(history: History, doc: EditorDoc): History {
  if (doc === history.present) return history;
  return { past: [...history.past, history.present].slice(-HISTORY_LIMIT), present: doc, future: [] };
}

export function undo(history: History): History {
  if (history.past.length === 0) return history;
  return {
    past: history.past.slice(0, -1),
    present: history.past[history.past.length - 1],
    future: [history.present, ...history.future],
  };
}

export function redo(history: History): History {
  if (history.future.length === 0) return history;
  return {
    past: [...history.past, history.present],
    present: history.future[0],
    future: history.future.slice(1),
  };
}

export function updateShape(doc: EditorDoc, id: string, update: (shape: Shape) => Shape): EditorDoc {
  return { ...doc, shapes: doc.shapes.map((shape) => (shape.id === id ? update(shape) : shape)) };
}

export function removeShape(doc: EditorDoc, id: string): EditorDoc {
  return { ...doc, shapes: doc.shapes.filter((shape) => shape.id !== id) };
}

export function shapeBounds(shape: Shape): Rect {
  const pad = shape.width / 2;
  const grow = (rect: Rect): Rect => ({
    x: rect.x - pad,
    y: rect.y - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  });
  switch (shape.kind) {
    case "arrow":
    case "line":
      return grow(normalizeRect(shape.from, shape.to));
    case "rect":
    case "ellipse":
    case "pixelate":
      return grow(shape.rect);
    case "pen":
    case "highlight": {
      const xs = shape.points.map((p) => p.x);
      const ys = shape.points.map((p) => p.y);
      return grow(normalizeRect({ x: Math.min(...xs), y: Math.min(...ys) }, { x: Math.max(...xs), y: Math.max(...ys) }));
    }
    case "text":
      return textBounds(shape);
  }
}

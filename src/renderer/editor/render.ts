import { arrowHead, filterCss, pixelSize, viewRect, type EditorDoc, type Point, type Rect, type Shape } from "./model";

export const TEXT_FONT = "600 {size}px system-ui, -apple-system, 'Segoe UI', sans-serif";
export const TEXT_LINE_HEIGHT = 1.25;

export function textFont(size: number): string {
  return TEXT_FONT.replace("{size}", String(size));
}

function context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not available");
  return ctx;
}

export function renderBase(image: CanvasImageSource, doc: EditorDoc): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = doc.width;
  canvas.height = doc.height;
  const ctx = context(canvas);
  ctx.filter = filterCss(doc.adjust);
  const m = doc.transform;
  ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
  ctx.drawImage(image, 0, 0);
  return canvas;
}

function strokePath(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  if (points.length === 1) {
    ctx.lineTo(points[0].x + 0.01, points[0].y);
  } else {
    for (let i = 1; i < points.length - 1; i += 1) {
      const mid = { x: (points[i].x + points[i + 1].x) / 2, y: (points[i].y + points[i + 1].y) / 2 };
      ctx.quadraticCurveTo(points[i].x, points[i].y, mid.x, mid.y);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
  }
  ctx.stroke();
}

function pixelate(ctx: CanvasRenderingContext2D, base: HTMLCanvasElement, rect: Rect) {
  const x = Math.max(0, Math.floor(rect.x));
  const y = Math.max(0, Math.floor(rect.y));
  const width = Math.min(base.width - x, Math.ceil(rect.width));
  const height = Math.min(base.height - y, Math.ceil(rect.height));
  if (width <= 0 || height <= 0) return;
  const block = pixelSize(rect);
  const targetWidth = Math.max(1, Math.ceil(width / block));
  const targetHeight = Math.max(1, Math.ceil(height / block));
  let small = document.createElement("canvas");
  small.width = width;
  small.height = height;
  context(small).drawImage(base, x, y, width, height, 0, 0, width, height);
  while (small.width > targetWidth || small.height > targetHeight) {
    const next = document.createElement("canvas");
    next.width = Math.max(targetWidth, Math.ceil(small.width / 2));
    next.height = Math.max(targetHeight, Math.ceil(small.height / 2));
    const nextCtx = context(next);
    nextCtx.imageSmoothingQuality = "high";
    nextCtx.drawImage(small, 0, 0, next.width, next.height);
    small = next;
  }
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, small.width, small.height, x, y, width, height);
  ctx.restore();
}

export function drawShape(ctx: CanvasRenderingContext2D, shape: Shape, base: HTMLCanvasElement) {
  ctx.save();
  ctx.strokeStyle = shape.color;
  ctx.fillStyle = shape.color;
  ctx.lineWidth = shape.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (shape.kind) {
    case "line":
      ctx.beginPath();
      ctx.moveTo(shape.from.x, shape.from.y);
      ctx.lineTo(shape.to.x, shape.to.y);
      ctx.stroke();
      break;
    case "arrow": {
      const [tip, left, right] = arrowHead(shape.from, shape.to, shape.width);
      const neck = { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };
      ctx.beginPath();
      ctx.moveTo(shape.from.x, shape.from.y);
      ctx.lineTo(neck.x, neck.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(left.x, left.y);
      ctx.lineTo(right.x, right.y);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = Math.max(1, shape.width / 2);
      ctx.stroke();
      break;
    }
    case "rect":
      if (shape.filled) ctx.fillRect(shape.rect.x, shape.rect.y, shape.rect.width, shape.rect.height);
      else ctx.strokeRect(shape.rect.x, shape.rect.y, shape.rect.width, shape.rect.height);
      break;
    case "ellipse":
      ctx.beginPath();
      ctx.ellipse(
        shape.rect.x + shape.rect.width / 2,
        shape.rect.y + shape.rect.height / 2,
        shape.rect.width / 2,
        shape.rect.height / 2,
        0,
        0,
        Math.PI * 2,
      );
      if (shape.filled) ctx.fill();
      else ctx.stroke();
      break;
    case "pen":
      strokePath(ctx, shape.points);
      break;
    case "highlight":
      ctx.globalAlpha = 0.38;
      ctx.lineCap = "square";
      strokePath(ctx, shape.points);
      break;
    case "text":
      ctx.font = textFont(shape.size);
      ctx.textBaseline = "top";
      shape.text.split("\n").forEach((line, i) => {
        ctx.fillText(line, shape.at.x, shape.at.y + i * shape.size * TEXT_LINE_HEIGHT);
      });
      break;
    case "pixelate":
      pixelate(ctx, base, shape.rect);
      break;
  }
  ctx.restore();
}

export function drawComposite(ctx: CanvasRenderingContext2D, base: HTMLCanvasElement, shapes: readonly Shape[]) {
  ctx.drawImage(base, 0, 0);
  for (const shape of shapes) drawShape(ctx, shape, base);
}

export function exportCanvas(base: HTMLCanvasElement, doc: EditorDoc): HTMLCanvasElement {
  const view = viewRect(doc);
  const canvas = document.createElement("canvas");
  canvas.width = view.width;
  canvas.height = view.height;
  const ctx = context(canvas);
  ctx.translate(-view.x, -view.y);
  drawComposite(ctx, base, doc.shapes);
  return canvas;
}

export async function exportPng(base: HTMLCanvasElement, doc: EditorDoc): Promise<Uint8Array> {
  const canvas = exportCanvas(base, doc);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not encode the image");
  return new Uint8Array(await blob.arrayBuffer());
}

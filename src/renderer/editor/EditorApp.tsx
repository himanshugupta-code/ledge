import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent } from "react";
import type { EditorItem, SaveResult } from "../../shared/api";
import { icons } from "./icons";
import * as M from "./model";
import { TEXT_LINE_HEIGHT, drawComposite, exportPng, renderBase, textFont } from "./render";

const COLORS = ["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#0a84ff", "#bf5af2", "#ffffff", "#1c1c1e"];

const TOOLS: Array<{ tool: M.Tool; label: string; key: string }> = [
  { tool: "select", label: "Select", key: "v" },
  { tool: "crop", label: "Crop", key: "c" },
  { tool: "arrow", label: "Arrow", key: "a" },
  { tool: "line", label: "Line", key: "l" },
  { tool: "rect", label: "Rectangle", key: "r" },
  { tool: "ellipse", label: "Ellipse", key: "o" },
  { tool: "pen", label: "Pen", key: "p" },
  { tool: "highlight", label: "Highlighter", key: "h" },
  { tool: "text", label: "Text", key: "t" },
  { tool: "pixelate", label: "Pixelate", key: "x" },
];

const ADJUSTMENTS: Array<{ key: keyof M.Adjustments; label: string; max: number }> = [
  { key: "brightness", label: "Brightness", max: 200 },
  { key: "contrast", label: "Contrast", max: 200 },
  { key: "saturation", label: "Saturation", max: 200 },
  { key: "warmth", label: "Warmth", max: 100 },
  { key: "grayscale", label: "Black & white", max: 100 },
];

const ZOOM_STEPS = [0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3, 4];
const HIGHLIGHT_FACTOR = 4;

interface Style {
  color: string;
  width: number;
  filled: boolean;
  fontSize: number;
}

type Interaction =
  | { kind: "draw"; shape: M.Shape; origin: M.Point }
  | { kind: "move"; id: string; origin: M.Point; start: M.EditorDoc }
  | { kind: "crop"; origin: M.Point };

interface TextDraft {
  at: M.Point;
  value: string;
  editingId: string | null;
}

const uid = () => crypto.randomUUID();

function snapAngle(origin: M.Point, p: M.Point): M.Point {
  const angle = Math.round(Math.atan2(p.y - origin.y, p.x - origin.x) / (Math.PI / 4)) * (Math.PI / 4);
  const length = Math.hypot(p.x - origin.x, p.y - origin.y);
  return { x: origin.x + Math.cos(angle) * length, y: origin.y + Math.sin(angle) * length };
}

function squareFrom(origin: M.Point, p: M.Point): M.Point {
  const size = Math.max(Math.abs(p.x - origin.x), Math.abs(p.y - origin.y));
  return { x: origin.x + Math.sign(p.x - origin.x || 1) * size, y: origin.y + Math.sign(p.y - origin.y || 1) * size };
}

function newShape(tool: M.Tool, p: M.Point, style: Style): M.Shape | null {
  const base = { id: uid(), color: style.color, width: style.width };
  switch (tool) {
    case "arrow":
    case "line":
      return { ...base, kind: tool, from: p, to: p };
    case "rect":
    case "ellipse":
      return { ...base, kind: tool, rect: { x: p.x, y: p.y, width: 0, height: 0 }, filled: style.filled };
    case "pen":
      return { ...base, kind: "pen", points: [p] };
    case "highlight":
      return { ...base, kind: "highlight", width: Math.max(12, style.width * HIGHLIGHT_FACTOR), points: [p] };
    case "pixelate":
      return { ...base, kind: "pixelate", width: 0, rect: { x: p.x, y: p.y, width: 0, height: 0 } };
    default:
      return null;
  }
}

function extendShape(shape: M.Shape, origin: M.Point, p: M.Point, constrain: boolean, minStep: number): M.Shape {
  switch (shape.kind) {
    case "arrow":
    case "line":
      return { ...shape, to: constrain ? snapAngle(origin, p) : p };
    case "rect":
    case "ellipse":
    case "pixelate":
      return { ...shape, rect: M.normalizeRect(origin, constrain ? squareFrom(origin, p) : p) };
    case "pen":
    case "highlight": {
      const last = shape.points[shape.points.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) < minStep) return shape;
      return { ...shape, points: [...shape.points, p] };
    }
    case "text":
      return shape;
  }
}

function restyle(shape: M.Shape, patch: Partial<Style>): M.Shape {
  let next: M.Shape = shape;
  if (patch.color !== undefined && shape.kind !== "pixelate") next = { ...next, color: patch.color };
  if (patch.width !== undefined) {
    if (shape.kind === "highlight") next = { ...next, width: Math.max(12, patch.width * HIGHLIGHT_FACTOR) };
    else if (shape.kind !== "text" && shape.kind !== "pixelate") next = { ...next, width: patch.width };
  }
  if (patch.filled !== undefined && (next.kind === "rect" || next.kind === "ellipse")) next = { ...next, filled: patch.filled };
  if (patch.fontSize !== undefined && next.kind === "text") next = { ...next, size: patch.fontSize };
  return next;
}

export function EditorApp() {
  const [item, setItem] = useState<EditorItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [history, setHistory] = useState<M.History | null>(null);
  const [preview, setPreview] = useState<M.EditorDoc | null>(null);
  const [tool, setToolState] = useState<M.Tool>("arrow");
  const [style, setStyle] = useState<Style>({ color: COLORS[0], width: 4, filled: false, fontSize: 28 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [cropDraft, setCropDraft] = useState<M.Rect | null>(null);
  const [textDraft, setTextDraft] = useState<TextDraft | null>(null);
  const [zoom, setZoom] = useState<number | "fit">("fit");
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    void window.ledgeEditor.getItem().then((found) => {
      if (!found) {
        setError("This screenshot is no longer on the ledge.");
        return;
      }
      setItem(found);
      document.title = `${found.name} — Ledge`;
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setHistory(M.startHistory(M.createDoc(img.naturalWidth, img.naturalHeight)));
      };
      img.onerror = () => setError("This image format can’t be edited.");
      img.src = found.src;
    });
  }, []);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setStage({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const present = history?.present ?? null;
  const doc = preview ?? present;
  const cropping = tool === "crop";

  const base = useMemo(
    () => (image && doc ? renderBase(image, doc) : null),
    [image, doc?.transform, doc?.width, doc?.height, doc?.adjust],
  );

  const view: M.Rect = doc
    ? cropping
      ? { x: 0, y: 0, width: doc.width, height: doc.height }
      : M.viewRect(doc)
    : { x: 0, y: 0, width: 1, height: 1 };
  const fitScale = Math.max(0.05, Math.min((stage.width - 64) / view.width, (stage.height - 64) / view.height, 1));
  const scale = zoom === "fit" ? fitScale : zoom;

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  };

  const commitDoc = (next: M.EditorDoc) => {
    setHistory((current) => (current ? M.commit(current, next) : current));
    setPreview(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !base || !doc) return;
    const dpr = window.devicePixelRatio || 1;
    const k = scale * dpr;
    canvas.width = Math.max(1, Math.round(view.width * k));
    canvas.height = Math.max(1, Math.round(view.height * k));
    canvas.style.width = `${view.width * scale}px`;
    canvas.style.height = `${view.height * scale}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(k, 0, 0, k, -view.x * k, -view.y * k);
    ctx.clearRect(view.x, view.y, view.width, view.height);

    const editingId = textDraft?.editingId;
    const shapes = doc.shapes.filter((shape) => shape.id !== editingId);
    if (interaction?.kind === "draw") shapes.push(interaction.shape);
    drawComposite(ctx, base, shapes);

    const selected = selectedId && !cropping ? doc.shapes.find((shape) => shape.id === selectedId) : undefined;
    if (selected) {
      const bounds = M.shapeBounds(selected);
      const pad = 4 / scale;
      ctx.save();
      ctx.setLineDash([5 / scale, 4 / scale]);
      ctx.lineWidth = 1.5 / scale;
      ctx.strokeStyle = "#4f7cff";
      ctx.strokeRect(bounds.x - pad, bounds.y - pad, bounds.width + pad * 2, bounds.height + pad * 2);
      ctx.restore();
    }

    if (cropping) {
      const area = cropDraft ?? M.viewRect(doc);
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.beginPath();
      ctx.rect(0, 0, doc.width, doc.height);
      ctx.rect(area.x, area.y, area.width, area.height);
      ctx.fill("evenodd");
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 1.5 / scale;
      ctx.strokeRect(area.x, area.y, area.width, area.height);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1 / scale;
      ctx.beginPath();
      for (const third of [1 / 3, 2 / 3]) {
        ctx.moveTo(area.x + area.width * third, area.y);
        ctx.lineTo(area.x + area.width * third, area.y + area.height);
        ctx.moveTo(area.x, area.y + area.height * third);
        ctx.lineTo(area.x + area.width, area.y + area.height * third);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, [base, doc, interaction, cropDraft, selectedId, scale, view.x, view.y, view.width, view.height, cropping, textDraft]);

  const toDoc = (event: PointerEvent<HTMLCanvasElement>): M.Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / scale + view.x, y: (event.clientY - rect.top) / scale + view.y };
  };

  const commitText = () => {
    if (!textDraft || !present) return;
    const text = textDraft.value.replace(/\s+$/, "");
    let next = present;
    if (textDraft.editingId) {
      next = text
        ? M.updateShape(present, textDraft.editingId, (shape) =>
            shape.kind === "text" ? { ...shape, text, color: style.color, size: style.fontSize } : shape,
          )
        : M.removeShape(present, textDraft.editingId);
    } else if (text) {
      const shape: M.TextShape = { id: uid(), kind: "text", color: style.color, width: 0, at: textDraft.at, text, size: style.fontSize };
      next = { ...present, shapes: [...present.shapes, shape] };
      setSelectedId(shape.id);
    }
    setTextDraft(null);
    commitDoc(next);
  };

  const setTool = (next: M.Tool) => {
    if (textDraft) commitText();
    setInteraction(null);
    if (next === "crop") setCropDraft(present?.crop ?? null);
    else setCropDraft(null);
    if (next !== "select") setSelectedId(null);
    setToolState(next);
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!present || event.button !== 0) return;
    if (textDraft) {
      commitText();
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = toDoc(event);

    if (tool === "select") {
      const id = M.hitTest(present.shapes, p, 6 / scale);
      setSelectedId(id);
      if (id) setInteraction({ kind: "move", id, origin: p, start: present });
      return;
    }
    if (tool === "crop") {
      setInteraction({ kind: "crop", origin: p });
      setCropDraft({ x: p.x, y: p.y, width: 0, height: 0 });
      return;
    }
    if (tool === "text") {
      event.preventDefault();
      const textShapes = present.shapes.filter((shape) => shape.kind === "text");
      const id = M.hitTest(textShapes, p, 4 / scale);
      const existing = textShapes.find((shape) => shape.id === id);
      if (existing && existing.kind === "text") {
        setStyle((current) => ({ ...current, color: existing.color, fontSize: existing.size }));
        setTextDraft({ at: existing.at, value: existing.text, editingId: existing.id });
      } else {
        setTextDraft({ at: p, value: "", editingId: null });
      }
      return;
    }
    const shape = newShape(tool, p, style);
    if (shape) {
      setSelectedId(null);
      setInteraction({ kind: "draw", shape, origin: p });
    }
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!interaction || !present) return;
    const p = toDoc(event);
    if (interaction.kind === "draw") {
      setInteraction({ ...interaction, shape: extendShape(interaction.shape, interaction.origin, p, event.shiftKey, 1 / scale) });
    } else if (interaction.kind === "move") {
      const dx = p.x - interaction.origin.x;
      const dy = p.y - interaction.origin.y;
      setPreview(M.updateShape(interaction.start, interaction.id, (shape) => M.translateShape(shape, dx, dy)));
    } else {
      setCropDraft(M.clampRect(M.normalizeRect(interaction.origin, p), present.width, present.height));
    }
  };

  const onPointerUp = () => {
    if (!interaction || !present) return;
    if (interaction.kind === "draw" && M.isMeaningful(interaction.shape)) {
      commitDoc({ ...present, shapes: [...present.shapes, interaction.shape] });
      setSelectedId(interaction.shape.id);
    } else if (interaction.kind === "move" && preview) {
      commitDoc(preview);
    } else if (interaction.kind === "crop" && cropDraft && (cropDraft.width < M.MIN_CROP || cropDraft.height < M.MIN_CROP)) {
      setCropDraft(present.crop);
    }
    setInteraction(null);
  };

  const applyStyle = (patch: Partial<Style>) => {
    setStyle((current) => ({ ...current, ...patch }));
    if (selectedId && present) commitDoc(M.updateShape(present, selectedId, (shape) => restyle(shape, patch)));
  };

  const previewAdjust = (key: keyof M.Adjustments, value: number) => {
    if (!present) return;
    setPreview({ ...present, adjust: { ...present.adjust, [key]: value } });
  };

  const commitPreview = () => {
    if (preview) commitDoc(preview);
  };

  const orient = (kind: M.Orientation) => {
    if (!present) return;
    setCropDraft(null);
    commitDoc(M.orient(present, kind));
  };

  const applyCropDraft = () => {
    if (!present) return;
    if (cropDraft) commitDoc(M.applyCrop(present, cropDraft));
    setCropDraft(null);
    setToolState("select");
  };

  const deleteSelected = () => {
    if (!present || !selectedId) return;
    commitDoc(M.removeShape(present, selectedId));
    setSelectedId(null);
  };

  const undo = () => {
    setPreview(null);
    setHistory((current) => (current ? M.undo(current) : current));
    setSelectedId(null);
  };

  const redo = () => {
    setPreview(null);
    setHistory((current) => (current ? M.redo(current) : current));
    setSelectedId(null);
  };

  const zoomBy = (direction: 1 | -1) => {
    const next =
      direction > 0
        ? ZOOM_STEPS.find((step) => step > scale + 0.001) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1]
        : [...ZOOM_STEPS].reverse().find((step) => step < scale - 0.001) ?? ZOOM_STEPS[0];
    setZoom(next);
  };

  const run = async (action: "copy" | "save" | "saveAs") => {
    if (!base || !present || busy) return;
    if (textDraft) commitText();
    setBusy(true);
    try {
      const png = await exportPng(renderBase(image!, present), present);
      if (action === "copy") {
        showToast((await window.ledgeEditor.copy(png)) ? "Copied to clipboard" : "Couldn’t copy the image");
        return;
      }
      const result: SaveResult = action === "save" ? await window.ledgeEditor.save(png) : await window.ledgeEditor.saveAs(png);
      if (result.ok) showToast(`Saved “${result.name}”`);
      else if (result.error) showToast(result.error);
    } catch (problem) {
      showToast(problem instanceof Error ? problem.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "TEXTAREA" || (target.tagName === "INPUT" && (target as HTMLInputElement).type !== "range")) return;
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      if (mod && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (mod && key === "y") {
        event.preventDefault();
        redo();
      } else if (mod && key === "c") {
        event.preventDefault();
        void run("copy");
      } else if (mod && key === "s") {
        event.preventDefault();
        void run(event.shiftKey ? "saveAs" : "save");
      } else if (mod && (key === "=" || key === "+")) {
        event.preventDefault();
        zoomBy(1);
      } else if (mod && key === "-") {
        event.preventDefault();
        zoomBy(-1);
      } else if (mod && key === "0") {
        event.preventDefault();
        setZoom("fit");
      } else if (mod) {
        return;
      } else if (key === "delete" || key === "backspace") {
        event.preventDefault();
        deleteSelected();
      } else if (key === "escape") {
        if (interaction) setInteraction(null);
        else if (cropping) setTool("select");
        else setSelectedId(null);
      } else if (key === "enter" && cropping) {
        applyCropDraft();
      } else {
        const match = TOOLS.find((entry) => entry.key === key);
        if (match) setTool(match.tool);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const textOpen = textDraft !== null;
  useEffect(() => {
    if (!textOpen) return;
    const frame = requestAnimationFrame(() => textRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [textOpen]);

  const onTextKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    event.stopPropagation();
    if (event.key === "Escape") setTextDraft(null);
    else if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      commitText();
    }
  };

  const selected = present && selectedId ? present.shapes.find((shape) => shape.id === selectedId) : undefined;
  const showFill = tool === "rect" || tool === "ellipse" || selected?.kind === "rect" || selected?.kind === "ellipse";
  const showFont = tool === "text" || selected?.kind === "text";
  const adjust = doc?.adjust ?? M.DEFAULT_ADJUSTMENTS;

  if (error) {
    return (
      <div className="editor-message">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="editor">
      <header className="topbar">
        <div className="title" title={item?.name}>
          {item?.name ?? "Loading…"}
        </div>
        <div className="group">
          <button type="button" className="icon-button" onClick={undo} disabled={!history?.past.length} title="Undo (⌘Z)" aria-label="Undo">
            {icons.undo}
          </button>
          <button type="button" className="icon-button" onClick={redo} disabled={!history?.future.length} title="Redo (⇧⌘Z)" aria-label="Redo">
            {icons.redo}
          </button>
        </div>
        <div className="group zoom">
          <button type="button" className="icon-button" onClick={() => zoomBy(-1)} aria-label="Zoom out" title="Zoom out (⌘−)">
            −
          </button>
          <button type="button" className="zoom-value" onClick={() => setZoom("fit")} title="Fit to window (⌘0)">
            {Math.round(scale * 100)}%
          </button>
          <button type="button" className="icon-button" onClick={() => zoomBy(1)} aria-label="Zoom in" title="Zoom in (⌘+)">
            +
          </button>
        </div>
        <div className="spacer" />
        <div className="group">
          <button type="button" className="button" onClick={() => void run("copy")} disabled={busy || !base}>
            Copy
          </button>
          <button type="button" className="button" onClick={() => void run("saveAs")} disabled={busy || !base}>
            Save As…
          </button>
          <button type="button" className="button primary" onClick={() => void run("save")} disabled={busy || !base} title="Save a copy next to the original (⌘S)">
            Save
          </button>
        </div>
      </header>

      <nav className="rail" aria-label="Tools">
        {TOOLS.map((entry) => (
          <button
            key={entry.tool}
            type="button"
            className="tool"
            aria-pressed={tool === entry.tool}
            onClick={() => setTool(entry.tool)}
            title={`${entry.label} (${entry.key.toUpperCase()})`}
            aria-label={entry.label}
          >
            {icons[entry.tool]}
          </button>
        ))}
      </nav>

      <main className="stage" ref={stageRef}>
        <div className="stage-inner">
          {doc && (
            <div className="canvas-wrap">
              <canvas
                ref={canvasRef}
                className={`canvas tool-${tool}`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => setInteraction(null)}
              />
              {textDraft && (
                <textarea
                  ref={textRef}
                  className="text-input"
                  value={textDraft.value}
                  placeholder="Type…"
                  onChange={(event) => setTextDraft({ ...textDraft, value: event.target.value })}
                  onBlur={commitText}
                  onKeyDown={onTextKeyDown}
                  rows={Math.max(1, textDraft.value.split("\n").length)}
                  style={{
                    left: (textDraft.at.x - view.x) * scale,
                    top: (textDraft.at.y - view.y) * scale,
                    font: textFont(style.fontSize * scale),
                    lineHeight: TEXT_LINE_HEIGHT,
                    color: style.color,
                  }}
                />
              )}
            </div>
          )}
          {!doc && <p className="loading">Loading…</p>}
        </div>
        {cropping && (
          <div className="crop-bar">
            <span>Drag to choose the area to keep</span>
            <button type="button" className="button" onClick={() => setTool("select")}>
              Cancel
            </button>
            <button type="button" className="button primary" onClick={applyCropDraft}>
              Apply Crop
            </button>
          </div>
        )}
        {toast && (
          <div className="toast" role="status">
            {toast}
          </div>
        )}
      </main>

      <aside className="panel">
        <section>
          <h2>Style</h2>
          <div className="swatches" role="radiogroup" aria-label="Color">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={style.color === color}
                aria-label={color}
                className="swatch"
                style={{ background: color }}
                onClick={() => applyStyle({ color })}
              />
            ))}
            <label className="swatch custom" title="Custom color">
              <input type="color" value={style.color} onChange={(event) => applyStyle({ color: event.target.value })} aria-label="Custom color" />
            </label>
          </div>
          <label className="slider">
            <span>Stroke</span>
            <input type="range" min={1} max={24} value={style.width} onChange={(event) => applyStyle({ width: Number(event.target.value) })} />
            <output>{style.width}</output>
          </label>
          {showFont && (
            <label className="slider">
              <span>Text size</span>
              <input type="range" min={12} max={120} value={style.fontSize} onChange={(event) => applyStyle({ fontSize: Number(event.target.value) })} />
              <output>{style.fontSize}</output>
            </label>
          )}
          {showFill && (
            <label className="check">
              <input type="checkbox" checked={style.filled} onChange={(event) => applyStyle({ filled: event.target.checked })} />
              <span>Fill shape</span>
            </label>
          )}
          {selected && (
            <button type="button" className="button danger wide" onClick={deleteSelected}>
              Delete Shape
            </button>
          )}
        </section>

        <section>
          <h2>Adjust</h2>
          {ADJUSTMENTS.map((entry) => (
            <label className="slider" key={entry.key}>
              <span>{entry.label}</span>
              <input
                type="range"
                min={0}
                max={entry.max}
                value={adjust[entry.key]}
                onChange={(event) => previewAdjust(entry.key, Number(event.target.value))}
                onPointerUp={commitPreview}
                onKeyUp={commitPreview}
                onBlur={commitPreview}
              />
              <output>{adjust[entry.key]}</output>
            </label>
          ))}
          <button
            type="button"
            className="button wide"
            disabled={!present || M.isDefaultAdjustments(present.adjust)}
            onClick={() => present && commitDoc({ ...present, adjust: { ...M.DEFAULT_ADJUSTMENTS } })}
          >
            Reset Adjustments
          </button>
        </section>

        <section>
          <h2>Transform</h2>
          <div className="transform-row">
            <button type="button" className="icon-button" onClick={() => orient("rotate-ccw")} title="Rotate left" aria-label="Rotate left">
              {icons.rotateLeft}
            </button>
            <button type="button" className="icon-button" onClick={() => orient("rotate-cw")} title="Rotate right" aria-label="Rotate right">
              {icons.rotateRight}
            </button>
            <button type="button" className="icon-button" onClick={() => orient("flip-x")} title="Flip horizontal" aria-label="Flip horizontal">
              {icons.flipX}
            </button>
            <button type="button" className="icon-button" onClick={() => orient("flip-y")} title="Flip vertical" aria-label="Flip vertical">
              {icons.flipY}
            </button>
          </div>
          <div className="transform-row">
            <button type="button" className="button grow" onClick={() => setTool("crop")}>
              Crop…
            </button>
            <button type="button" className="button grow" disabled={!present?.crop} onClick={() => present && commitDoc({ ...present, crop: null })}>
              Reset Crop
            </button>
          </div>
          {doc && (
            <p className="meta">
              {M.viewRect(doc).width} × {M.viewRect(doc).height} px
            </p>
          )}
        </section>
      </aside>
    </div>
  );
}

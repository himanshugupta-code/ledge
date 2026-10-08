import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import type { LedgeItem } from "../shared/api";

const FLASH_MS = 1200;

type Flash = "copied" | "failed" | null;

export function Card({ item }: { item: LedgeItem }) {
  const [flash, setFlash] = useState<Flash>(null);
  const flashTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    },
    [],
  );

  const showFlash = (value: Flash) => {
    setFlash(value);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), FLASH_MS);
  };

  const copy = async () => {
    showFlash((await window.ledge.copy(item.id)) ? "copied" : "failed");
  };

  const onDragStart = (event: DragEvent) => {
    event.preventDefault();
    window.ledge.startDrag(item.id);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      window.ledge.edit(item.id);
    } else if (event.key.toLowerCase() === "c") {
      event.preventDefault();
      void copy();
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      window.ledge.remove(item.id);
    }
  };

  return (
    <div className="card" data-flash={flash ?? undefined}>
      <button
        type="button"
        className="thumb"
        draggable
        title={`${item.name}\nClick to edit · Drag to share`}
        aria-label={`${item.name}. Press Enter to edit, C to copy, Delete to remove.`}
        onClick={() => window.ledge.edit(item.id)}
        onDragStart={onDragStart}
        onKeyDown={onKeyDown}
        onContextMenu={(event) => {
          event.preventDefault();
          window.ledge.showInFolder(item.id);
        }}
      >
        <img src={item.src} alt="" draggable={false} />
        <span className="badge" role="status">
          {flash === "copied" ? "Copied" : flash === "failed" ? "Can’t copy this format" : ""}
        </span>
      </button>
      <button
        type="button"
        className="corner remove"
        aria-label={`Remove ${item.name}`}
        title="Let it go"
        onClick={() => window.ledge.remove(item.id)}
      >
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M3 3l6 6M9 3l-6 6" />
        </svg>
      </button>
      <button
        type="button"
        className="corner copy"
        aria-label={`Copy ${item.name}`}
        title="Copy"
        onClick={() => void copy()}
      >
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <rect x="4" y="4" width="6.5" height="6.5" rx="1.2" />
          <path d="M8 4V2.8A1.3 1.3 0 006.7 1.5H2.8A1.3 1.3 0 001.5 2.8v3.9A1.3 1.3 0 002.8 8H4" />
        </svg>
      </button>
    </div>
  );
}

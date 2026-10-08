import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import type { LedgeItem } from "../shared/api";

const DOUBLE_CLICK_MS = 240;
const FLASH_MS = 1200;

type Flash = "copied" | "failed" | null;

export function Card({ item }: { item: LedgeItem }) {
  const [flash, setFlash] = useState<Flash>(null);
  const clickTimer = useRef<number | null>(null);
  const flashTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (clickTimer.current) window.clearTimeout(clickTimer.current);
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

  const onClick = () => {
    if (clickTimer.current) window.clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(() => {
      clickTimer.current = null;
      void copy();
    }, DOUBLE_CLICK_MS);
  };

  const onDoubleClick = () => {
    if (clickTimer.current) window.clearTimeout(clickTimer.current);
    clickTimer.current = null;
    window.ledge.open(item.id);
  };

  const onDragStart = (event: DragEvent) => {
    event.preventDefault();
    window.ledge.startDrag(item.id);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      window.ledge.open(item.id);
    } else if (event.key === "Enter" || event.key === " ") {
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
        title={`${item.name}\nClick to copy · Double-click to open · Drag to share`}
        aria-label={`${item.name}. Press Enter to copy, Shift Enter to open, Delete to remove.`}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
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
        className="remove"
        aria-label={`Remove ${item.name}`}
        title="Let it go"
        onClick={() => window.ledge.remove(item.id)}
      >
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M3 3l6 6M9 3l-6 6" />
        </svg>
      </button>
    </div>
  );
}

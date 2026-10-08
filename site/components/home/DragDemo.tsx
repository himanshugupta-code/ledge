"use client";

import { useEffect, useRef } from "react";
import { animate, utils } from "animejs";
import { prefersReducedMotion, spring, watchVisibility } from "../../lib/motion";

export type DragApp = { name: string; sub: string; to: string };

const APP_STYLE = [
  { color: "#3ddc84", glyph: "#" },
  { color: "#2cd4e8", glyph: "@" },
  { color: "#ff9a3c", glyph: "▤" },
];

export function DragDemo({ label, hint, shared, cardLabel, apps }: { label: string; hint: string; shared: string; cardLabel: string; apps: DragApp[] }) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const card = el.querySelector<HTMLDivElement>(".m-drag-card")!;
    const toast = el.querySelector<HTMLDivElement>(".m-toast")!;
    const targets = [...el.querySelectorAll<HTMLDivElement>(".m-app")];
    const reduce = prefersReducedMotion();
    let drag: { x0: number; y0: number; lx: number; vx: number } | null = null;

    const hit = (x: number, y: number) =>
      targets.find((a) => {
        const r = a.getBoundingClientRect();
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      });

    const down = (e: PointerEvent) => {
      card.setPointerCapture(e.pointerId);
      drag = { x0: e.clientX, y0: e.clientY, lx: e.clientX, vx: 0 };
      animate(card, { scale: 1.06, duration: 200, ease: "outQuad" });
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      drag.vx = e.clientX - drag.lx;
      drag.lx = e.clientX;
      utils.set(card, { x: e.clientX - drag.x0, y: e.clientY - drag.y0, rotate: Math.max(-14, Math.min(14, drag.vx * 0.8)) });
      const over = hit(e.clientX, e.clientY);
      targets.forEach((a) => a.classList.toggle("hot", a === over));
    };
    const up = (e: PointerEvent) => {
      if (!drag) return;
      drag = null;
      const over = hit(e.clientX, e.clientY);
      targets.forEach((a) => a.classList.remove("hot"));
      if (over) {
        animate(card, { scale: 0.2, opacity: 0, duration: 260, ease: "inQuad" }).then(() => {
          utils.set(card, { x: 0, y: 0, rotate: 0 });
          animate(card, { scale: [0.6, 1], opacity: [0, 1], duration: 700, ease: spring(200, 12) });
        });
        animate(over, { scale: [1, 1.06, 1], duration: 500, ease: "outQuad" });
        toast.textContent = shared.replace("{app}", over.dataset.to ?? "");
        animate(toast, { opacity: [0, 1, 1, 0], y: [10, 0, 0, -6], duration: 1800, ease: "outQuad" });
      } else {
        animate(card, { x: 0, y: 0, rotate: 0, scale: 1, duration: 900, ease: spring(180, 11) });
      }
    };
    card.addEventListener("pointerdown", down);
    card.addEventListener("pointermove", move);
    card.addEventListener("pointerup", up);
    card.addEventListener("pointercancel", up);

    let nudged = false;
    const unwatch = watchVisibility(el, (v) => {
      if (!v || nudged || reduce) return;
      nudged = true;
      animate(card, { x: [0, 26, 0], rotate: [0, 6, 0], duration: 1200, delay: 500, ease: "inOutSine" });
    });

    return () => {
      unwatch();
      card.removeEventListener("pointerdown", down);
      card.removeEventListener("pointermove", move);
      card.removeEventListener("pointerup", up);
      card.removeEventListener("pointercancel", up);
      utils.remove([card, toast, ...targets]);
    };
  }, [shared]);

  return (
    <div className="m-panel" ref={panel}>
      <div className="m-panel-bar">
        <span>{label}</span>
      </div>
      <div className="m-drop-zone">
        <div className="m-drag-home">
          <div className="m-drag-card m-th-photo" role="img" aria-label={cardLabel} />
          <span className="m-drag-hint">{hint}</span>
        </div>
        <div className="m-dock">
          {apps.map((app, i) => (
            <div key={app.name} className="m-app" data-to={app.to} style={{ ["--c" as string]: APP_STYLE[i].color }}>
              <i>{APP_STYLE[i].glyph}</i>
              <div>
                <b>{app.name}</b>
                <small>{app.sub}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="m-toast" aria-live="polite" />
    </div>
  );
}

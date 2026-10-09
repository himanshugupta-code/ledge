"use client";

import { useEffect, useRef } from "react";
import { animate, utils } from "animejs";
import { SPECTRUM, prefersReducedMotion } from "../../lib/motion";
import { useLatest } from "../../lib/useLatest";

const probes = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  return { x1: 128 * Math.cos(a), y1: 128 * Math.sin(a), x2: 190 * Math.cos(a), y2: 190 * Math.sin(a) };
});

const seeded = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const motes = Array.from({ length: 26 }, (_, i) => {
  const a = seeded(i) * Math.PI * 2;
  const r = seeded(i + 99) * 90;
  return { x: r * Math.cos(a), y: r * Math.sin(a), rot: seeded(i + 7) * 40 - 20, color: SPECTRUM[i % 6] };
});

export function VaultDemo({ label, caption, aria, active }: { label: string; caption: string; aria: string; active: boolean }) {
  const panel = useRef<HTMLDivElement>(null);
  const activeRef = useLatest(active);

  useEffect(() => {
    const el = panel.current;
    if (!el || prefersReducedMotion()) return;
    const moteEls = [...el.querySelectorAll<SVGGElement>(".m-mote")];
    const lines = [...el.querySelectorAll<SVGLineElement>(".m-probe")];
    let alive = true;
    const timers: number[] = [];
    const drift = (g: SVGGElement) => {
      if (!alive) return;
      if (!activeRef.current) {
        timers.push(window.setTimeout(() => drift(g), 600));
        return;
      }
      const a = Math.random() * Math.PI * 2;
      const r = 20 + Math.random() * 82;
      animate(g, { x: r * Math.cos(a), y: r * Math.sin(a), rotate: Math.random() * 60 - 30, duration: 2400 + Math.random() * 2600, ease: "inOutSine", onComplete: () => drift(g) });
    };
    moteEls.forEach((g, i) => timers.push(window.setTimeout(() => drift(g), i * 90)));
    const dash = animate(lines, { strokeDashoffset: [0, -32], duration: 1600, loop: true, ease: "linear" });

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      dash.revert();
      utils.remove(moteEls);
    };
  }, [activeRef]);

  return (
    <div className="m-panel" ref={panel}>
      <div className="m-panel-bar">
        <span>{label}</span>
      </div>
      <div className="m-vault">
        <svg viewBox="-200 -130 400 260" role="img" aria-label={aria}>
          <defs>
            <filter id="m-vglow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {probes.map((p, i) => (
            <line key={i} className="m-probe" x1={p.x1.toFixed(1)} y1={p.y1.toFixed(1)} x2={p.x2.toFixed(1)} y2={p.y2.toFixed(1)} strokeWidth={1} strokeDasharray="3 5" />
          ))}
          <circle r={118} fill="rgba(91,124,255,0.06)" stroke="#5b7cff" strokeWidth={2} filter="url(#m-vglow)" />
          {motes.map((m, i) => (
            <g key={i} className="m-mote" style={{ transform: `translate(${m.x.toFixed(1)}px, ${m.y.toFixed(1)}px) rotate(${m.rot.toFixed(1)}deg)` }}>
              <rect x={-9} y={-6} width={18} height={12} rx={2} fill={m.color} opacity={0.9} />
            </g>
          ))}
          <text className="m-vault-label" x={0} y={-124} textAnchor="middle">
            {caption}
          </text>
        </svg>
      </div>
    </div>
  );
}

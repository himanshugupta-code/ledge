"use client";

import { useEffect, useRef } from "react";
import { animate, createAnimatable, createScope, stagger, svg, utils } from "animejs";
import { SPECTRUM, cssVar, finished, prefersReducedMotion, sleep, spring, watchVisibility } from "../../lib/motion";

const COLS = 17;
const ROWS = 11;
const GAP = 15;
const FIELD_Y = -38;
const BW = ((COLS - 1) / 2) * GAP + 16;
const BH = ((ROWS - 1) / 2) * GAP + 16;
const SHELF_Y = 162;
const SLOT_W = 44;
const SLOT_H = 28;
const SLOT_GAP = 10;
const SLOTS = 4;
const NS = "http://www.w3.org/2000/svg";

const slotX = (i: number) => -((SLOTS - 1) / 2) * (SLOT_W + SLOT_GAP) + i * (SLOT_W + SLOT_GAP);

function arc(r: number, a0: number, a1: number) {
  const point = (a: number) => [r * Math.cos(((a - 90) * Math.PI) / 180), r * Math.sin(((a - 90) * Math.PI) / 180)];
  const [x0, y0] = point(a0);
  const [x1, y1] = point(a1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

const ticks = Array.from({ length: 120 }, (_, i) => {
  const a = ((i * 3 - 90) * Math.PI) / 180;
  const long = i % 5 === 0;
  const r0 = long ? 262 : 268;
  return { long, x1: r0 * Math.cos(a), y1: r0 * Math.sin(a), x2: 278 * Math.cos(a), y2: 278 * Math.sin(a) };
});

const dots = Array.from({ length: COLS * ROWS }, (_, i) => ({
  cx: ((i % COLS) - (COLS - 1) / 2) * GAP,
  cy: FIELD_Y + (Math.floor(i / COLS) - (ROWS - 1) / 2) * GAP,
}));

const corners = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

function miniCard(parent: SVGGElement, color: string) {
  const g = document.createElementNS(NS, "g");
  const add = (attrs: Record<string, string | number>) => {
    const r = document.createElementNS(NS, "rect");
    for (const [k, v] of Object.entries(attrs)) r.setAttribute(k, String(v));
    g.appendChild(r);
  };
  add({ x: -SLOT_W / 2, y: -SLOT_H, width: SLOT_W, height: SLOT_H, rx: 4, fill: "#eef1fb" });
  add({ x: -SLOT_W / 2, y: -SLOT_H, width: 10, height: SLOT_H, fill: color, opacity: 0.9 });
  add({ x: -7, y: -SLOT_H + 6, width: 22, height: 3, rx: 1.5, fill: "#9aa3c4" });
  add({ x: -7, y: -SLOT_H + 13, width: 16, height: 3, rx: 1.5, fill: "#c4cae0" });
  parent.appendChild(g);
  return g;
}

export function CaptureDial({ label, countLabel }: { label: string; countLabel: string }) {
  const root = useRef<HTMLDivElement>(null);
  const shelf = useRef<SVGGElement>(null);
  const count = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    const shelfG = shelf.current;
    const countEl = count.current;
    if (!el || !shelfG || !countEl) return;
    const reduce = prefersReducedMotion();
    let alive = true;
    let visible = true;
    let captures = 0;
    const cards: SVGGElement[] = [];

    for (let i = 0; i < 3; i++) {
      const g = miniCard(shelfG, SPECTRUM[(i + 3) % 6]);
      utils.set(g, { x: slotX(i + 1), y: SHELF_Y - 2 });
      cards.push(g);
    }
    captures = 3;
    countEl.textContent = String(captures);

    const svgEl = el.querySelector<SVGSVGElement>("svg")!;
    const ring = el.querySelector<SVGGElement>(".m-ring")!;
    const segs = [...el.querySelectorAll<SVGPathElement>(".m-seg")];
    const tickEls = [...el.querySelectorAll<SVGLineElement>(".m-tick")];
    const field = el.querySelector<SVGGElement>(".m-field")!;
    const dotEls = [...el.querySelectorAll<SVGCircleElement>(".m-dot")];
    const brackets = [...el.querySelectorAll<SVGGElement>(".m-bracket")];
    const sizeTag = el.querySelector<SVGTextElement>(".m-size")!;
    const flash = el.querySelector<SVGCircleElement>(".m-flash")!;
    const shelfLine = el.querySelector<SVGLineElement>(".m-shelf")!;
    const orbitA = el.querySelector<SVGCircleElement>(".m-orbit-a")!;
    const orbitB = el.querySelector<SVGPathElement>(".m-orbit-b")!;
    const orbitC = el.querySelector<SVGPathElement>(".m-orbit-c")!;

    const scope = createScope({ root: el }).add(() => {
      if (reduce) return;
      animate(svg.createDrawable(segs), { draw: ["0 0", "0 1"], duration: 1400, delay: stagger(140, { start: 200 }), ease: "inOutQuad" });
      animate(ring, { rotate: 360, duration: 90000, loop: true, ease: "linear" });
      animate(orbitA, { rotate: -360, duration: 60000, loop: true, ease: "linear" });
      animate(orbitB, { rotate: 360, duration: 14000, loop: true, ease: "inOutSine" });
      animate(orbitC, { rotate: -360, duration: 9000, loop: true, ease: "inOutQuad" });
      animate(tickEls, { opacity: [0.25, 1], duration: 700, delay: stagger(16), loop: true, alternate: true, ease: "inOutSine" });
      animate(dotEls, { scale: [0, 1], opacity: [0, 1], duration: 700, delay: stagger(18, { grid: [COLS, ROWS], from: "center", start: 500 }), ease: "outBack" });
    });

    const tilt = reduce ? null : createAnimatable(svgEl, { rotateX: 900, rotateY: 900, ease: "out(3)" });
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tilt?.rotateY(((e.clientX - r.left) / r.width - 0.5) * 14);
      tilt?.rotateX(-((e.clientY - r.top) / r.height - 0.5) * 14);
    };
    const onLeave = () => {
      tilt?.rotateX(0);
      tilt?.rotateY(0);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    const unwatch = watchVisibility(el, (v) => (visible = v), 0.1);

    async function loop() {
      await sleep(2000);
      let k = 0;
      while (alive) {
        if (!visible || document.hidden) {
          await sleep(400);
          continue;
        }
        const dotColor = cssVar("--m-dot") || "#5d6072";
        const color = SPECTRUM[k % 6];
        animate(dotEls, {
          scale: [{ to: 1.9, duration: 260 }, { to: 1, duration: 520 }],
          fill: [{ to: color, duration: 200 }, { to: dotColor, duration: 900 }],
          delay: stagger(26, { grid: [COLS, ROWS], from: (k * 37) % dotEls.length }),
          ease: "inOutQuad",
        });
        await sleep(700);
        if (!alive) return;
        brackets.forEach((b) => utils.set(b, { x: Number(b.dataset.sx) * 46, y: Number(b.dataset.sy) * 30, opacity: 0 }));
        utils.set(sizeTag, { opacity: 0 });
        await finished(animate(brackets, { x: 0, y: 0, opacity: 1, duration: 650, delay: stagger(40), ease: "outExpo" }));
        const size = { w: 0, h: 0 };
        animate(sizeTag, { opacity: 1, duration: 200 });
        await finished(
          animate(size, {
            w: 1440,
            h: 900,
            duration: 420,
            ease: "outQuad",
            modifier: utils.round(0),
            onUpdate: () => {
              sizeTag.textContent = `${size.w} × ${size.h}`;
            },
          }),
        );
        await sleep(160);
        if (!alive) return;
        animate(flash, { opacity: [0.85, 0], duration: 520, ease: "outQuad" });
        utils.set(dotEls, { fill: "#eef1fb" });
        animate([...brackets, sizeTag], { opacity: 0, duration: 220 });
        if (cards.length >= SLOTS) {
          const out = cards.pop()!;
          animate(out, { y: SHELF_Y + 60, opacity: 0, rotate: 18, duration: 600, ease: "inQuad", onComplete: () => out.remove() });
        }
        cards.forEach((g, i) => animate(g, { x: slotX(i + 1), duration: 900, delay: 120 + i * 40, ease: spring(170, 13) }));
        await finished(animate(field, { x: slotX(0), y: SHELF_Y - SLOT_H / 2 - 2 - FIELD_Y, scale: SLOT_W / (BW * 2), duration: 620, ease: "inOutExpo" }));
        if (!alive) return;
        const card = miniCard(shelfG!, color);
        utils.set(card, { x: slotX(0), y: SHELF_Y - 2, scale: 1.15 });
        animate(card, { scale: 1, duration: 700, ease: spring(260, 10) });
        animate(shelfLine, { strokeWidth: [6, 3], duration: 500, ease: "outQuad" });
        cards.unshift(card);
        captures += 1;
        countEl!.textContent = String(captures);
        utils.set(field, { x: 0, y: 0, scale: 1, opacity: 0 });
        utils.set(dotEls, { fill: dotColor });
        animate(field, { opacity: 1, duration: 300 });
        animate(dotEls, { scale: [0, 1], duration: 600, delay: stagger(14, { grid: [COLS, ROWS], from: "center" }), ease: "outBack" });
        k += 1;
        await sleep(1700);
      }
    }
    if (!reduce) loop();

    return () => {
      alive = false;
      unwatch();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      scope.revert();
      tilt?.revert();
      utils.remove([...dotEls, ...brackets, sizeTag, flash, field, shelfLine, ...cards]);
      cards.forEach((c) => c.remove());
    };
  }, []);

  return (
    <div className="m-dial" ref={root}>
      <svg viewBox="-320 -320 640 640" role="img" aria-label={label}>
        <defs>
          <filter id="m-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g className="m-ring">
          {SPECTRUM.map((c, i) => (
            <path key={c} className="m-seg" d={arc(292, i * 60 + 2, i * 60 + 58)} stroke={c} strokeWidth={5} fill="none" strokeLinecap="round" filter="url(#m-glow)" />
          ))}
        </g>
        <g>
          {ticks.map((t, i) => (
            <line key={i} className={`m-tick${t.long ? " long" : ""}`} x1={t.x1.toFixed(2)} y1={t.y1.toFixed(2)} x2={t.x2.toFixed(2)} y2={t.y2.toFixed(2)} strokeWidth={t.long ? 1.6 : 1} />
          ))}
        </g>
        <circle className="m-orbit-a" r={246} fill="none" strokeWidth={1} strokeDasharray="2 7" />
        <path className="m-orbit-b" d={arc(232, 200, 320)} fill="none" strokeWidth={14} strokeLinecap="round" />
        <path className="m-orbit-c" d={arc(232, 20, 80)} fill="none" stroke="#ff9a3c" strokeWidth={2} opacity={0.6} />
        <circle className="m-disc" r={218} strokeWidth={1} />
        <g className="m-field" style={{ transformOrigin: `0px ${FIELD_Y}px` }}>
          {dots.map((d, i) => (
            <circle key={i} className="m-dot" cx={d.cx} cy={d.cy} r={2.4} />
          ))}
        </g>
        {corners.map(([sx, sy]) => (
          <g key={`${sx}${sy}`} className="m-bracket" data-sx={sx} data-sy={sy} opacity={0}>
            <path
              d={`M${sx * BW} ${FIELD_Y + sy * (BH - 18)} L${sx * BW} ${FIELD_Y + sy * BH} L${sx * (BW - 18)} ${FIELD_Y + sy * BH}`}
              fill="none"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </g>
        ))}
        <text className="m-size" x={BW} y={FIELD_Y + BH + 22} textAnchor="end" opacity={0}>
          1440 × 900
        </text>
        <circle className="m-flash" r={218} fill="#ffffff" opacity={0} />
        <line className="m-shelf" x1={-128} y1={SHELF_Y} x2={128} y2={SHELF_Y} strokeWidth={3} strokeLinecap="round" filter="url(#m-glow)" />
        <g ref={shelf} />
      </svg>
      <p className="m-dial-count">
        {countLabel} <b ref={count}>0</b>
      </p>
    </div>
  );
}

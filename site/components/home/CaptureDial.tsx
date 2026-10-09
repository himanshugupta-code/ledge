"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { animate, createAnimatable, createTimeline, stagger, svg, utils } from "animejs";
import { SPECTRUM, prefersReducedMotion } from "../../lib/motion";

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

export type DialApi = { setCapture: (p: number) => void; setActive: (i: number) => void };

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

const cards = [
  { slot: 0, color: SPECTRUM[5], fresh: true },
  { slot: 1, color: SPECTRUM[3], fresh: false },
  { slot: 2, color: SPECTRUM[4], fresh: false },
  { slot: 3, color: SPECTRUM[0], fresh: false },
];

export function CaptureDial({ label, countLabel, apiRef }: { label: string; countLabel: string; apiRef: MutableRefObject<DialApi | null> }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = prefersReducedMotion();
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
    const fresh = el.querySelector<SVGGElement>(".m-mini.fresh .m-mini-body")!;
    const countEl = el.querySelector<HTMLElement>(".m-dial-count b")!;
    const orbits = [".m-orbit-a", ".m-orbit-b", ".m-orbit-c"].map((s) => el.querySelector<SVGElement>(s)!);

    const ambient = reduce
      ? []
      : [
          animate(svg.createDrawable(segs), { draw: ["0 0", "0 1"], duration: 1400, delay: stagger(140, { start: 200 }), ease: "inOutQuad" }),
          animate(ring, { rotate: 360, duration: 90000, loop: true, ease: "linear" }),
          animate(orbits[0], { rotate: -360, duration: 60000, loop: true, ease: "linear" }),
          animate(orbits[1], { rotate: 360, duration: 14000, loop: true, ease: "inOutSine" }),
          animate(orbits[2], { rotate: -360, duration: 9000, loop: true, ease: "inOutQuad" }),
          animate(tickEls, { opacity: [0.25, 1], duration: 700, delay: stagger(16), loop: true, alternate: true, ease: "inOutSine" }),
        ];

    const size = { w: 0, h: 0 };
    const tally = { n: 3 };
    utils.set(brackets, { opacity: 0 });
    utils.set(fresh, { scale: 0, opacity: 0 });
    const capture = createTimeline({ autoplay: false, defaults: { ease: "inOutQuad" } })
      .add(dotEls, { scale: [{ to: 1.9 }, { to: 1 }], fill: [{ to: SPECTRUM[5] }, { to: "#eef1fb" }], duration: 200, delay: stagger(12, { grid: [COLS, ROWS], from: "center" }) }, 0)
      .add(sizeTag, { opacity: [0, 1], duration: 40 }, 300)
      .add(size, { w: [0, 1440], h: [0, 900], duration: 140, modifier: utils.round(0), onUpdate: () => { sizeTag.textContent = `${size.w} × ${size.h}`; } }, 300)
      .add(flash, { opacity: [0, 0.85, 0], duration: 90 }, 470)
      .add(sizeTag, { opacity: 0, duration: 50 }, 500)
      .add(field, { x: [0, slotX(0)], y: [0, SHELF_Y - SLOT_H / 2 - 2 - FIELD_Y], scale: [1, SLOT_W / (BW * 2)], duration: 260, ease: "inOutExpo" }, 540)
      .add(field, { opacity: [1, 0], duration: 40 }, 790)
      .add(fresh, { scale: [0, 1], opacity: [0, 1], duration: 160, ease: "outBack" }, 800)
      .add(shelfLine, { strokeWidth: [3, 6, 3], duration: 160 }, 800)
      .add(tally, { n: [3, 4], duration: 10, modifier: utils.round(0), onUpdate: () => { countEl.textContent = String(tally.n); } }, 830)
      .add({}, { duration: 170 }, 830);
    brackets.forEach((b, j) => {
      capture.add(b, { x: [Number(b.dataset.sx) * 46, 0], y: [Number(b.dataset.sy) * 30, 0], opacity: [0, 1], duration: 160, ease: "outExpo" }, 240 + j * 10);
      capture.add(b, { opacity: 0, duration: 50 }, 500);
    });

    apiRef.current = {
      setCapture: (p) => capture.seek(Math.min(1, Math.max(0, p)) * capture.duration),
      setActive: (i) => {
        segs.forEach((seg, j) => {
          animate(seg, { opacity: i < 0 || i === j ? 1 : 0.18, strokeWidth: i === j ? 9 : 5, duration: 400, ease: "outQuad" });
        });
      },
    };

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

    return () => {
      apiRef.current = null;
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      ambient.forEach((a) => a.revert());
      capture.revert();
      tilt?.revert();
      utils.remove(segs);
    };
  }, [apiRef]);

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
        <g className="m-ticks">
          {ticks.map((t, i) => (
            <line key={i} className={`m-tick${t.long ? " long" : ""}`} x1={t.x1.toFixed(2)} y1={t.y1.toFixed(2)} x2={t.x2.toFixed(2)} y2={t.y2.toFixed(2)} strokeWidth={t.long ? 1.6 : 1} />
          ))}
        </g>
        <g className="m-inner">
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
            <g key={`${sx}${sy}`} className="m-bracket" data-sx={sx} data-sy={sy}>
              <path d={`M${sx * BW} ${FIELD_Y + sy * (BH - 18)} L${sx * BW} ${FIELD_Y + sy * BH} L${sx * (BW - 18)} ${FIELD_Y + sy * BH}`} fill="none" strokeWidth={2.5} strokeLinecap="round" />
            </g>
          ))}
          <text className="m-size" x={BW} y={FIELD_Y + BH + 22} textAnchor="end" opacity={0}>
            0 × 0
          </text>
          <circle className="m-flash" r={218} fill="#ffffff" opacity={0} />
          <line className="m-shelf" x1={-128} y1={SHELF_Y} x2={128} y2={SHELF_Y} strokeWidth={3} strokeLinecap="round" filter="url(#m-glow)" />
          {cards.map((c) => (
            <g key={c.slot} className={`m-mini${c.fresh ? " fresh" : ""}`} transform={`translate(${slotX(c.slot)} ${SHELF_Y - 2})`}>
              <g className="m-mini-body">
                <rect x={-SLOT_W / 2} y={-SLOT_H} width={SLOT_W} height={SLOT_H} rx={4} fill="#eef1fb" />
                <rect x={-SLOT_W / 2} y={-SLOT_H} width={10} height={SLOT_H} fill={c.color} opacity={0.9} />
                <rect x={-7} y={-SLOT_H + 6} width={22} height={3} rx={1.5} fill="#9aa3c4" />
                <rect x={-7} y={-SLOT_H + 13} width={16} height={3} rx={1.5} fill="#c4cae0" />
              </g>
            </g>
          ))}
        </g>
      </svg>
      <p className="m-dial-count">
        {countLabel} <b>3</b>
      </p>
    </div>
  );
}

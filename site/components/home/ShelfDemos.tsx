"use client";

import { useEffect, useRef } from "react";
import { animate, createTimeline, stagger, utils } from "animejs";
import { prefersReducedMotion, sleep, spring } from "../../lib/motion";
import { useLatest } from "../../lib/useLatest";

const THUMBS = ["m-th-dash", "m-th-code", "m-th-photo", "m-th-chat", "m-th-keys", "m-th-doc"];

const cardLeft = (row: HTMLElement, i: number) => {
  const h = row.clientHeight;
  return i * (h * 1.6 + h * 0.22);
};

function addCard(row: HTMLElement, kind: number, prepend = false) {
  const c = document.createElement("div");
  c.className = `m-card ${THUMBS[kind % THUMBS.length]}`;
  if (prepend) row.prepend(c);
  else row.appendChild(c);
  return c;
}

function MenuBar({ app, time }: { app: string; time: string }) {
  return (
    <div className="m-menubar">
      <b>{app}</b>
      <span>File</span>
      <span>Edit</span>
      <span>View</span>
      <span className="m-sp" />
      <span>{time}</span>
    </div>
  );
}

export function ShelfDemo({ label, active }: { label: string; active: boolean }) {
  const panel = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const activeRef = useLatest(active);

  useEffect(() => {
    const row = rowRef.current;
    const el = panel.current;
    if (!row || !el) return;
    const reduce = prefersReducedMotion();
    let alive = true;
    let next = 5;
    const cards = Array.from({ length: 5 }, (_, i) => addCard(row, i));
    const layout = () => cards.forEach((c, i) => (c.style.left = `${cardLeft(row, i)}px`));
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(row);
    async function loop() {
      while (alive) {
        await sleep(1600);
        if (!alive) return;
        if (!activeRef.current || document.hidden) continue;
        const c = addCard(row!, next++, true);
        c.style.left = `${cardLeft(row!, 0)}px`;
        cards.unshift(c);
        animate(c, { y: ["-240%", "0%"], rotate: [-8, 0], duration: 1100, ease: spring(150, 11) });
        const max = Math.max(1, Math.floor(row!.clientWidth / (row!.clientHeight * 1.82)));
        cards.forEach((card, i) => {
          if (i) animate(card, { left: cardLeft(row!, i), duration: 800, delay: i * 30, ease: spring(170, 15) });
        });
        while (cards.length > max) {
          const out = cards.pop()!;
          animate(out, { y: "180%", opacity: 0, rotate: 12, duration: 600, ease: "inQuad", onComplete: () => out.remove() });
        }
      }
    }
    if (!reduce) loop();

    return () => {
      alive = false;
      ro.disconnect();
      utils.remove(cards);
      cards.forEach((c) => c.remove());
    };
  }, [activeRef]);

  return (
    <div className="m-panel" ref={panel}>
      <div className="m-panel-bar">
        <span>{label}</span>
      </div>
      <div className="m-stage">
        <MenuBar app="Finder" time="12:30" />
        <div className="m-window" style={{ left: "14%", top: "40%", width: "72%", height: "50%" }} />
        <div className="m-strip" style={{ top: "7%" }}>
          <div className="m-slot-row" ref={rowRef} />
        </div>
      </div>
    </div>
  );
}

export function RevealDemo({ label, active }: { label: string; active: boolean }) {
  const panel = useRef<HTMLDivElement>(null);
  const timeline = useRef<ReturnType<typeof createTimeline> | null>(null);

  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const reduce = prefersReducedMotion();
    const row = el.querySelector<HTMLDivElement>(".m-slot-row")!;
    const strip = el.querySelector<HTMLDivElement>(".m-strip")!;
    const cursor = el.querySelector<SVGSVGElement>(".m-cursor")!;
    const edge = el.querySelector<HTMLDivElement>(".m-edge")!;
    const cards = Array.from({ length: 6 }, (_, i) => addCard(row, i + 2));
    const layout = () => cards.forEach((c, i) => (c.style.left = `${cardLeft(row, i)}px`));
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(row);
    utils.set(strip, { y: reduce ? "0%" : "-110%" });
    const hover = cards[2];
    const tl = createTimeline({ loop: true, autoplay: false, defaults: { ease: "inOutQuad" } })
      .add(cursor, { left: ["52%", "46%"], top: ["70%", "0.5%"], duration: 1100, ease: "inOutCubic" }, 300)
      .add(edge, { opacity: [0, 1, 0], duration: 700 }, "-=150")
      .add(strip, { y: ["-110%", "0%"], duration: 900, ease: spring(140, 14) }, "<<+=120")
      .add(cards, { opacity: [0, 1], y: [-14, 0], duration: 500, delay: stagger(60), ease: "outQuad" }, "<<+=150")
      .add(cursor, { left: "30%", top: "18%", duration: 700 }, "+=200")
      .add(hover, { y: -6, scale: 1.08, duration: 300, ease: "outBack" }, "-=100")
      .add(hover, { y: 0, scale: 1, duration: 300 }, "+=700")
      .add(cursor, { left: "60%", top: "78%", duration: 900, ease: "inOutCubic" })
      .add(strip, { y: "-110%", duration: 600, ease: "inQuad" }, "-=350")
      .add({}, { duration: 900 });
    timeline.current = reduce ? null : tl;

    return () => {
      timeline.current = null;
      ro.disconnect();
      tl.revert();
      cards.forEach((c) => c.remove());
    };
  }, []);

  useEffect(() => {
    if (active) timeline.current?.play();
    else timeline.current?.pause();
  }, [active]);

  return (
    <div className="m-panel" ref={panel}>
      <div className="m-panel-bar">
        <span>{label}</span>
      </div>
      <div className="m-stage">
        <MenuBar app="Code" time="12:31" />
        <div className="m-window m-th-code" style={{ left: "10%", top: "18%", width: "80%", height: "72%" }} />
        <div className="m-edge" />
        <div className="m-strip">
          <div className="m-slot-row" />
        </div>
        <svg className="m-cursor" viewBox="0 0 20 23" style={{ left: "52%", top: "70%" }} aria-hidden="true">
          <path d="M2 1 L2 18 L6.5 14 L9.5 21 L12.5 19.7 L9.6 13 L15.5 13 Z" fill="#111" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

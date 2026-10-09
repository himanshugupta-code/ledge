"use client";

import { useEffect, useRef } from "react";
import { animate, createTimeline, stagger } from "animejs";
import { prefersReducedMotion, spring } from "../../lib/motion";

const PAD_X = 18;
const PAD_Y = 12;
const HANDLES = ["tl", "tc", "tr", "mr", "br", "bc", "bl", "ml"];

export function HeroMarquee({ text }: { text: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const h1 = el.querySelector("h1")!;
    const box = el.querySelector<HTMLElement>(".m-sel")!;
    const tag = el.querySelector<HTMLElement>(".m-sel-tag")!;
    const flash = el.querySelector<HTMLElement>(".m-sel-flash")!;
    const cross = el.querySelector<HTMLElement>(".m-cross")!;
    const handles = el.querySelectorAll<HTMLElement>(".m-sel i");

    const measure = () => {
      const hr = el.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(h1);
      const b = range.getBoundingClientRect();
      const left = Math.max(0, Math.min(PAD_X, b.left - 6));
      const right = Math.max(0, Math.min(PAD_X, document.documentElement.clientWidth - b.right - 6));
      return { x: b.left - hr.left - left, y: b.top - hr.top - PAD_Y, w: b.width + left + right, h: b.height + PAD_Y * 2 };
    };
    const place = (m: { x: number; y: number; w: number; h: number }) => {
      box.style.left = `${m.x}px`;
      box.style.top = `${m.y}px`;
      box.style.width = `${m.w}px`;
      box.style.height = `${m.h}px`;
      tag.textContent = `${Math.round(m.w)} × ${Math.round(m.h)}`;
    };
    let done = false;
    const settle = () => {
      done = true;
      place(measure());
      box.classList.add("done");
    };
    const ro = new ResizeObserver(() => done && place(measure()));
    ro.observe(h1);

    if (prefersReducedMotion()) {
      box.style.opacity = "1";
      tag.style.opacity = "1";
      handles.forEach((h) => (h.style.transform = "scale(1)"));
      settle();
      return () => ro.disconnect();
    }

    const m = measure();
    const drag = { w: 0, h: 0 };
    box.style.left = `${m.x}px`;
    box.style.top = `${m.y}px`;
    cross.style.transform = `translate(${m.x}px, ${m.y}px)`;
    const tl = createTimeline({ delay: 450 })
      .add(cross, { opacity: [0, 1], duration: 220, ease: "outQuad" }, 0)
      .add(cross.firstElementChild!, { scale: [0.5, 1], rotate: [-45, 0], duration: 420, ease: "outBack" }, 0)
      .add(box, { opacity: [0, 1], duration: 60 }, 300)
      .add(tag, { opacity: [0, 1], duration: 160 }, 340)
      .add(drag, {
        w: [0, m.w],
        h: [0, m.h],
        duration: 1150,
        ease: "inOutCubic",
        onUpdate: () => {
          box.style.width = `${drag.w}px`;
          box.style.height = `${drag.h}px`;
          cross.style.transform = `translate(${m.x + drag.w}px, ${m.y + drag.h}px)`;
          tag.textContent = `${Math.round(drag.w)} × ${Math.round(drag.h)}`;
        },
      }, 300)
      .add(cross, { opacity: 0, duration: 180, ease: "outQuad" }, 1520)
      .call(settle, 1500)
      .add(flash, { opacity: [0, 0.85, 0], duration: 380, ease: "outQuad" }, 1500)
      .add(handles, { scale: [0, 1], duration: 650, delay: stagger(35), ease: spring(320, 15) }, 1600);
    const nudge = () => animate(tag, { y: [-4, 0], duration: 500, ease: spring(300, 12) });
    tl.then(nudge);

    return () => {
      ro.disconnect();
      tl.revert();
    };
  }, [text]);

  return (
    <div className="m-marquee" ref={host}>
      <h1>{text}</h1>
      <div className="m-sel" aria-hidden="true">
        <span className="m-sel-flash" />
        {HANDLES.map((h) => (
          <i key={h} className={h} />
        ))}
        <b className="m-sel-tag">0 × 0</b>
      </div>
      <div className="m-cross" aria-hidden="true">
        <svg viewBox="0 0 28 28">
          <path d="M14 1v10M14 17v10M1 14h10M17 14h10" />
          <circle cx="14" cy="14" r="2.2" />
        </svg>
      </div>
    </div>
  );
}

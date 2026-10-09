"use client";

import { useEffect, useRef } from "react";
import { createTimeline, stagger, svg, utils } from "animejs";
import { EDITOR_PROGRESS, prefersReducedMotion } from "../../lib/motion";

type Steps = { box: string; arrow: string; text: string; pixelate: string; adjust: string };

const KEYS = [
  ["Production", "sk_live_9fK2mQ7x…", 16],
  ["Staging", "sk_live_4tR8vN1z…", 48],
  ["CI runner", "sk_live_7hJ3sB6e…", 78],
] as const;

export function EditorDemo({ label, steps, note }: { label: string; steps: Steps; note: string }) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const pix = el.querySelector<HTMLDivElement>(".m-pix")!;
    const blocks = Array.from({ length: 60 }, (_, i) => {
      const b = document.createElement("i");
      const v = 170 + ((i * 47) % 60);
      b.style.background = `rgb(${v},${v + 4},${v + 14})`;
      pix.appendChild(b);
      return b;
    });
    const [rect] = svg.createDrawable(el.querySelector(".m-anno-rect")!);
    const [arrow] = svg.createDrawable(el.querySelector(".m-anno-arrow")!);
    const [head] = svg.createDrawable(el.querySelector(".m-anno-head")!);
    const text = el.querySelector<HTMLDivElement>(".m-anno-text")!;
    const shot = el.querySelector<HTMLDivElement>(".m-shot")!;
    const rail = [...el.querySelectorAll<HTMLSpanElement>(".m-ed-rail span")];
    const stepEl = el.querySelector<HTMLSpanElement>(".m-ed-step")!;
    const scrub = el.querySelector<HTMLElement>(".m-scrub i")!;
    const sliders = [1, 2, 3].map((i) => [el.querySelector<HTMLElement>(`.m-kn${i}`)!, el.querySelector<HTMLElement>(`.m-fill${i}`)!] as const);
    const typed = { n: 0 };
    const adj = { v: 0 };
    const tool = (i: number, name: string) => {
      rail.forEach((r, j) => r.classList.toggle("on", j === i));
      stepEl.textContent = name;
    };

    utils.set(blocks, { opacity: 0 });
    const tl = createTimeline({ autoplay: false, defaults: { ease: "inOutQuad" } })
      .call(() => tool(3, steps.box), 0)
      .add(rect, { draw: ["0 0", "0 1"], duration: 1000 }, 0)
      .call(() => tool(2, steps.arrow), 1000)
      .add(arrow, { draw: ["0 0", "0 1"], duration: 800 }, 1000)
      .add(head, { draw: ["0 0", "0 1"], duration: 250 }, 1800)
      .call(() => tool(5, steps.text), 2100)
      .add(typed, {
        n: [0, note.length],
        duration: 1200,
        ease: "linear",
        modifier: utils.round(0),
        onUpdate: () => {
          text.textContent = note.slice(0, typed.n);
        },
      }, 2100)
      .call(() => tool(6, steps.pixelate), 3400)
      .add(blocks, { opacity: [0, 1], scale: [0.4, 1], duration: 300, delay: stagger(14, { grid: [12, 5], from: "first" }) }, 3400)
      .call(() => tool(0, steps.adjust), 4500)
      .add(adj, {
        v: [0, 1],
        duration: 900,
        onUpdate: () => {
          const v = adj.v;
          [[0.5, 0.66], [0.5, 0.6], [0.5, 0.62]].forEach(([a, b], i) => {
            const p = `${(a + (b - a) * v) * 100}%`;
            sliders[i][0].style.left = p;
            sliders[i][1].style.width = p;
          });
          shot.style.filter = `brightness(${1 + 0.12 * v}) contrast(${1 + 0.1 * v}) saturate(${1 + 0.3 * v})`;
        },
      }, 4500);

    const seek = (p: number) => {
      tl.seek(p * tl.duration);
      scrub.style.width = `${p * 100}%`;
    };
    const onProgress = (e: Event) => seek((e as CustomEvent<number>).detail);
    if (prefersReducedMotion()) seek(1);
    else window.addEventListener(EDITOR_PROGRESS, onProgress);

    return () => {
      window.removeEventListener(EDITOR_PROGRESS, onProgress);
      tl.revert();
      blocks.forEach((b) => b.remove());
      text.textContent = "";
      shot.style.filter = "";
    };
  }, [steps, note]);

  return (
    <div className="m-panel" ref={panel}>
      <div className="m-panel-bar">
        <span>{label}</span>
        <span className="m-ed-step">{steps.box}</span>
      </div>
      <div className="m-ed">
        <div className="m-ed-rail">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} className={i === 0 ? "on" : ""} />
          ))}
        </div>
        <div className="m-ed-canvas">
          <div className="m-shot">
            <div className="m-shot-hd">Acme Console</div>
            <div className="m-shot-side" />
            <div className="m-shot-ttl">API Keys</div>
            <div className="m-shot-tbl">
              {KEYS.map(([name, key, top], i) => (
                <div key={name}>
                  {i > 0 && <i className="m-shot-row" style={{ top: `${top - 10}%` }} />}
                  <span className="m-shot-nm" style={{ top: `${top}%` }}>{name}</span>
                  <span className="m-shot-key" style={{ top: `${top}%` }}>{key}</span>
                </div>
              ))}
            </div>
            <div className="m-pix" />
            <div className="m-shot-btn">Create key</div>
            <svg className="m-anno" viewBox="0 0 160 100" preserveAspectRatio="none" aria-hidden="true">
              <rect className="m-anno-rect" x="114" y="70" width="38" height="16" fill="none" stroke="#ff3b30" strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
              <path className="m-anno-arrow" d="M70 90 Q 95 92 112 80" fill="none" stroke="#ff3b30" strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
              <path className="m-anno-head" d="M112 80 L106.5 80.5 M112 80 L109.5 85" fill="none" stroke="#ff3b30" strokeWidth="1.1" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="m-anno-text" />
          </div>
        </div>
        <div className="m-ed-side">
          <div>
            STYLE
            <div className="m-swatches">
              {["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#0a84ff"].map((c) => (
                <i key={c} style={{ background: c }} />
              ))}
            </div>
          </div>
          {["BRIGHTNESS", "CONTRAST", "SATURATION"].map((name, i) => (
            <div key={name} className="m-sl">
              {name}
              <div className="m-tr">
                <i className={`m-fill m-fill${i + 1}`} />
                <i className={`m-kn m-kn${i + 1}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="m-scrub">
        <i />
      </div>
    </div>
  );
}

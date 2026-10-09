"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate } from "animejs";
import { CaptureDial, type DialApi } from "./CaptureDial";
import { DragDemo, type DragApp } from "./DragDemo";
import { EditorDemo } from "./EditorDemo";
import { KeysDemo, type KeyActions } from "./KeysDemo";
import { RevealDemo, ShelfDemo } from "./ShelfDemos";
import { HeroMarquee } from "./HeroMarquee";
import { SplitWords } from "./SplitWords";
import { VaultDemo } from "./VaultDemo";
import { EDITOR_PROGRESS, clamp01, easeInOut, prefersReducedMotion } from "../../lib/motion";

type Sub = { b: string; s: string };
type Feature = { id: string; color: string; kicker: string; title: string; body: string; subs: Sub[] };

export type StoryProps = {
  hero: { eyebrow: string; title: string; sub: string; cta: string; film: string; note: string; href: string };
  dial: { label: string; count: string; hint: string };
  features: Feature[];
  stats: { v: string; l: string }[];
  shelf: { panel: string };
  reveal: { panel: string };
  drag: { panel: string; hint: string; shared: string; card: string; apps: DragApp[] };
  editor: { panel: string; note: string; steps: { box: string; arrow: string; text: string; pixelate: string; adjust: string } };
  keys: { panel: string; prompt: string; none: string; actions: KeyActions };
  privacy: { panel: string; caption: string; aria: string };
};

const MINI = 104;
const EDITOR_INDEX = 3;

export function Story(props: StoryProps) {
  const { hero, dial, features, stats } = props;
  const root = useRef<HTMLDivElement>(null);
  const dialApi = useRef<DialApi | null>(null);
  const [active, setActive] = useState(-1);
  const activeRef = useRef(-1);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = prefersReducedMotion();
    const pin = el.querySelector<HTMLElement>(".m-pin")!;
    const dialWrap = el.querySelector<HTMLElement>(".m-pin-dial")!;
    const demoLayer = el.querySelector<HTMLElement>(".m-pin-demos")!;
    const demos = [...el.querySelectorAll<HTMLElement>(".m-pin-demo")];
    const progress = el.querySelector<HTMLElement>(".m-pin-progress")!;
    const heroBlock = el.querySelector<HTMLElement>(".m-block-hero")!;
    const captureBlock = el.querySelector<HTMLElement>(".m-block-capture")!;
    const blocks = [...el.querySelectorAll<HTMLElement>(".m-block-feature")];
    let frame = 0;
    let lastEditor = -1;

    const fit = () => {
      const area = demoLayer.getBoundingClientRect();
      demos.forEach((d) => {
        const panel = d.firstElementChild as HTMLElement | null;
        if (!panel) return;
        panel.style.scale = "1";
        const h = panel.offsetHeight;
        const w = panel.offsetWidth;
        const s = Math.min(1, area.height / h, area.width / w);
        panel.style.scale = String(s);
      });
    };

    const show = (index: number) => {
      if (index === activeRef.current) return;
      const prev = activeRef.current;
      activeRef.current = index;
      setActive(index);
      dialApi.current?.setActive(index);
      demos.forEach((d, i) => {
        const on = i === index;
        d.classList.toggle("on", on);
        if (reduce) {
          d.style.opacity = on ? "1" : "0";
          return;
        }
        if (on) {
          animate(d, { opacity: [0, 1], clipPath: ["circle(0% at 50% 50%)", "circle(80% at 50% 50%)"], scale: [0.94, 1], duration: 750, ease: "inOutQuart" });
        } else if (i === prev) {
          animate(d, { opacity: 0, scale: 0.96, duration: 400, ease: "outQuad" });
        } else {
          d.style.opacity = "0";
        }
      });
    };

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const scroll = window.scrollY;
      const start = heroBlock.getBoundingClientRect().top + scroll - 48;
      const end = captureBlock.getBoundingClientRect().bottom + scroll - vh;
      dialApi.current?.setCapture(clamp01((scroll - start) / Math.max(1, end - start)));

      const first = blocks[0].getBoundingClientRect();
      const morph = reduce ? (first.top < vh * 0.5 ? 1 : 0) : clamp01((vh - first.top) / (vh * 0.7));
      const e = easeInOut(morph);
      const box = pin.getBoundingClientRect();
      const size = (dialWrap.firstElementChild as HTMLElement).offsetWidth;
      const scale = 1 + (MINI / size - 1) * e;
      const tx = (box.width / 2 - MINI / 2 - 8) * e;
      const ty = (box.height / 2 - MINI / 2 - 8) * e;
      dialWrap.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      dialWrap.style.opacity = window.innerWidth <= 900 ? String(1 - e) : "1";
      dialWrap.classList.toggle("mini", morph > 0.5);
      demoLayer.style.opacity = String(clamp01((morph - 0.45) / 0.55));
      progress.style.opacity = String(clamp01((morph - 0.6) / 0.4));

      let index = -1;
      if (morph > 0.5) {
        blocks.forEach((b, i) => {
          const r = b.getBoundingClientRect();
          if (r.top < vh * 0.55) index = i;
        });
        if (index < 0) index = 0;
      }
      show(index);

      const ed = blocks[EDITOR_INDEX].getBoundingClientRect();
      const p = clamp01((vh * 0.8 - ed.top) / (ed.height * 0.75));
      if (p !== lastEditor) {
        lastEditor = p;
        window.dispatchEvent(new CustomEvent(EDITOR_PROGRESS, { detail: p }));
      }
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      fit();
      request();
    };

    fit();
    update();
    const ro = new ResizeObserver(onResize);
    ro.observe(pin);
    demos.forEach((d) => d.firstElementChild && ro.observe(d.firstElementChild));
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const demoNodes: ReactNode[] = [
    <ShelfDemo key="shelf" label={props.shelf.panel} active={active === 0} />,
    <RevealDemo key="reveal" label={props.reveal.panel} active={active === 1} />,
    <DragDemo key="drag" label={props.drag.panel} hint={props.drag.hint} shared={props.drag.shared} cardLabel={props.drag.card} apps={props.drag.apps} active={active === 2} />,
    <EditorDemo key="editor" label={props.editor.panel} steps={props.editor.steps} note={props.editor.note} />,
    <KeysDemo key="keys" label={props.keys.panel} prompt={props.keys.prompt} none={props.keys.none} actions={props.keys.actions} active={active === 4} />,
    <VaultDemo key="vault" label={props.privacy.panel} caption={props.privacy.caption} aria={props.privacy.aria} active={active === 5} />,
  ];

  return (
    <div className="m-story" ref={root}>
      <div className="m-story-text">
        <div className="m-block m-block-hero">
          <HeroMarquee text={hero.title} />
          <p className="sub">{hero.sub}</p>
          <div className="cta">
            <a className="btn" href={hero.href}>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v10m0 0-4-4m4 4 4-4M4 16h12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {hero.cta}
            </a>
            <a className="btn ghost" href="#video">{hero.film}</a>
          </div>
          <p className="note">{hero.note}</p>
        </div>
        <div className="m-block m-block-capture">
          <p className="m-scroll-hint">
            <span aria-hidden="true">↓</span> {dial.hint}
          </p>
        </div>
        {features.map((f, i) => (
          <article key={f.id} id={f.id} className="m-block m-block-feature" style={{ ["--c" as string]: f.color }}>
            <p className="m-kicker">
              <i />
              {f.kicker}
            </p>
            <SplitWords text={f.title} className="m-h2" />
            <p className="m-lead">{f.body}</p>
            {f.subs.length > 0 && (
              <ul className="m-subs">
                {f.subs.map((s) => (
                  <li key={s.b}>
                    <b>{s.b}</b>
                    <span>{s.s}</span>
                  </li>
                ))}
              </ul>
            )}
            {i === features.length - 1 && (
              <div className="m-stats">
                {stats.map((s) => (
                  <div key={s.l} className="m-stat">
                    <b>{s.v}</b>
                    <span>{s.l}</span>
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
      <div className="m-story-stage">
        <div className="m-pin">
          <div className="m-pin-demos">
            {demoNodes.map((node, i) => (
              <div key={i} className="m-pin-demo" aria-hidden={active !== i}>
                {node}
              </div>
            ))}
          </div>
          <div className="m-pin-dial">
            <CaptureDial label={dial.label} countLabel={dial.count} apiRef={dialApi} />
          </div>
          <div className="m-pin-progress" aria-hidden="true">
            <div className="m-ticks-row">
              {features.map((f, i) => (
                <i key={f.id} className={i === active ? "on" : ""} style={{ ["--c" as string]: f.color }} />
              ))}
            </div>
            <span>
              {features[Math.max(active, 0)].kicker}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

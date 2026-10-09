"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, createAnimatable, createTimeline, stagger, svg, utils, type Timeline } from "animejs";
import { asset } from "../../lib/site";
import { SPECTRUM, prefersReducedMotion, spring, watchVisibility } from "../../lib/motion";

type GameText = {
  kicker: string;
  title: string;
  body: string;
  play: string;
  hint: string;
  loading: string;
  full: string;
  try: string;
  caught: string;
  close: string;
  ready: string;
};

type Phase = "idle" | "opening" | "playing";

type Drop = { el: HTMLElement; x: number; y: number; v: number; r: number; spin: number; bad: boolean; color: string };

const CLUTTER = "#e5484d";
const TITLE = "SHELF CATCH";
const RING = 2 * Math.PI * 54;
const ROW_MAX = 14;

export function GameSection({ t }: { t: GameText }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [load, setLoad] = useState(false);
  const phaseRef = useRef<Phase>("idle");
  const board = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const boot = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const engine = useRef<{ pause: () => void; resume: () => void; centre: () => void } | null>(null);
  const opening = useRef<Timeline | null>(null);
  const src = asset("/game/index.html");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const el = board.current;
    if (!el) return;
    const reduce = prefersReducedMotion();
    const drops = el.querySelector<HTMLElement>(".m-arcade-drops")!;
    const ledge = el.querySelector<HTMLElement>(".m-arcade-ledge")!;
    const bar = ledge.firstElementChild as HTMLElement;
    const row = el.querySelector<HTMLElement>(".m-arcade-row")!;
    const count = el.querySelector<HTMLElement>(".m-arcade-count")!;
    const letters = [...el.querySelectorAll<HTMLElement>(".m-arcade-title span")];
    const ring = el.querySelector<HTMLElement>(".m-arcade-ring")!;

    let W = 0;
    let H = 0;
    const measure = () => {
      W = el.clientWidth;
      H = el.clientHeight;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    const lx = createAnimatable(ledge, { x: reduce ? 0 : 420, ease: "out(4)" });
    const list: Drop[] = [];
    let pointer: number | null = null;
    let caught = 0;
    let spawnAt = 0;
    let last = 0;
    let raf = 0;
    let visible = false;
    let paused = false;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer = e.clientX - r.left - W / 2;
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    const onLeave = () => {
      pointer = null;
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onMove);
    el.addEventListener("pointerleave", onLeave);

    const spawn = () => {
      const bad = Math.random() < 0.18;
      const color = bad ? CLUTTER : SPECTRUM[Math.floor(Math.random() * SPECTRUM.length)];
      const node = document.createElement("i");
      node.className = bad ? "m-drop bad" : "m-drop";
      node.style.setProperty("--c", color);
      drops.appendChild(node);
      const half = Math.max(40, W / 2 - 50);
      list.push({ el: node, x: (Math.random() * 2 - 1) * half, y: -70, v: H * (0.3 + Math.random() * 0.14), r: Math.random() * 30 - 15, spin: Math.random() * 90 - 45, bad, color });
    };

    const sparks = (x: number, y: number, color: string, n: number) => {
      for (let i = 0; i < n; i++) {
        const s = document.createElement("b");
        s.className = "m-spark";
        s.style.background = color;
        s.style.left = `${W / 2 + x}px`;
        s.style.top = `${y}px`;
        drops.appendChild(s);
        const a = Math.random() * Math.PI * 2;
        const d = 30 + Math.random() * 50;
        animate(s, {
          x: Math.cos(a) * d,
          y: Math.sin(a) * d - 20,
          scale: [1, 0],
          duration: 500 + Math.random() * 300,
          ease: "outExpo",
          onComplete: () => s.remove(),
        });
      }
    };

    const shelve = (d: Drop) => {
      const from = d.el.getBoundingClientRect();
      const mini = document.createElement("i");
      mini.className = "m-mini-card";
      mini.style.setProperty("--c", d.color);
      row.prepend(mini);
      const to = mini.getBoundingClientRect();
      d.el.remove();
      animate(mini, {
        x: [from.left + from.width / 2 - (to.left + to.width / 2), 0],
        y: [from.top + from.height / 2 - (to.top + to.height / 2), 0],
        scale: [from.width / to.width, 1],
        rotate: [d.r, 0],
        duration: 700,
        ease: "outExpo",
      });
      animate([...row.children].slice(1), { x: [-(to.width + 6), 0], duration: 500, ease: "outQuart" });
      while (row.children.length > ROW_MAX) row.lastElementChild?.remove();
    };

    const autopilot = () => {
      let target: Drop | null = null;
      for (const d of list) if (!d.bad && (!target || d.y > target.y)) target = d;
      if (target) return target.x;
      return Math.sin(performance.now() / 900) * W * 0.18;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (!visible || paused) return;
      if (now > spawnAt) {
        spawn();
        spawnAt = now + 600 + Math.random() * 650;
      }
      const span = W / 2 - ledge.offsetWidth / 2 - 12;
      const aim = pointer ?? autopilot();
      lx.x(Math.max(-span, Math.min(span, aim)));
      const cx = Number(lx.x());
      const half = ledge.offsetWidth / 2;
      const top = ledge.offsetTop;
      for (let i = list.length - 1; i >= 0; i--) {
        const d = list[i];
        d.y += d.v * dt;
        d.r += d.spin * dt;
        const h = d.el.offsetHeight;
        d.el.style.transform = `translate(${W / 2 + d.x - d.el.offsetWidth / 2}px, ${d.y - h / 2}px) rotate(${d.r}deg)`;
        const bottom = d.y + h / 2;
        if (bottom >= top && bottom <= top + 26 && Math.abs(d.x - cx) < half + d.el.offsetWidth * 0.25) {
          list.splice(i, 1);
          if (d.bad) {
            sparks(d.x, top, CLUTTER, 14);
            animate(d.el, { scale: [1, 1.6], opacity: 0, duration: 320, ease: "outQuad", onComplete: () => d.el.remove() });
            animate(bar, { x: [0, -10, 9, -6, 4, 0], duration: 420, ease: "outQuad" });
            el.classList.add("hit");
            setTimeout(() => el.classList.remove("hit"), 260);
          } else {
            caught++;
            count.textContent = String(caught);
            animate(count, { scale: [1.6, 1], duration: 600, ease: spring(260, 14) });
            animate(bar, { scaleY: [0.55, 1], scaleX: [1.1, 1], duration: 650, ease: spring(300, 10) });
            sparks(d.x, top, d.color, 10);
            shelve(d);
          }
        } else if (d.y - h > H) {
          list.splice(i, 1);
          d.el.remove();
        }
      }
    };
    raf = requestAnimationFrame(tick);

    const intro = () => {
      if (reduce) return;
      animate(letters, { y: ["120%", "0%"], rotate: [12, 0], opacity: [0, 1], duration: 900, delay: stagger(45, { from: "center" }), ease: "outExpo" });
    };
    const wave = reduce
      ? null
      : animate(letters, { y: [0, -7, 0], duration: 1600, delay: stagger(90), loop: true, ease: "inOutSine", autoplay: false });
    const pulse = reduce ? null : animate(ring, { scale: [1, 1.45], opacity: [0.7, 0], duration: 1600, loop: true, ease: "outQuad" });

    let introduced = false;
    const unwatch = watchVisibility(el, (v) => {
      visible = v;
      if (v && !introduced) {
        introduced = true;
        intro();
        setTimeout(() => wave?.play(), 1000);
      }
    }, 0.2);

    engine.current = {
      pause: () => {
        paused = true;
        wave?.pause();
      },
      resume: () => {
        paused = false;
        last = 0;
        list.splice(0).forEach((d) => d.el.remove());
        intro();
        wave?.play();
      },
      centre: () => lx.x(0),
    };

    return () => {
      cancelAnimationFrame(raf);
      unwatch();
      ro.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onMove);
      el.removeEventListener("pointerleave", onLeave);
      lx.revert();
      wave?.revert();
      pulse?.revert();
      list.forEach((d) => d.el.remove());
      engine.current = null;
    };
  }, []);

  const reveal = useCallback(() => {
    const ifr = frame.current;
    const b = boot.current;
    if (!ifr || !b || phaseRef.current !== "opening") return;
    phaseRef.current = "playing";
    const label = b.querySelector<HTMLElement>(".m-boot-label");
    if (label) label.textContent = t.ready;
    const done = () => {
      setPhase("playing");
      ifr.focus();
      ifr.contentWindow?.postMessage({ source: "ledge", type: "focus" }, window.location.origin);
    };
    if (prefersReducedMotion()) {
      b.style.opacity = "0";
      ifr.style.opacity = "1";
      done();
      return;
    }
    createTimeline({ defaults: { ease: "outExpo" } })
      .add(b.querySelector(".m-boot-core")!, { scale: [1, 1.25], opacity: [1, 0], duration: 500, ease: "inBack" }, 150)
      .add(b, { opacity: [1, 0], duration: 600 }, 450)
      .add(ifr, { opacity: [0, 1], scale: [0.94, 1], duration: 900 }, 450)
      .call(done, 900);
  }, [t.ready]);

  useEffect(() => {
    if (phase !== "opening") return;
    const el = board.current!;
    const b = boot.current!;
    const reduce = prefersReducedMotion();
    const pct = b.querySelector<HTMLElement>(".m-boot-pct")!;
    const meter = b.querySelector<SVGCircleElement>(".m-boot-meter")!;
    let progress = 0;
    let ready = false;
    let shown = false;
    const set = (p: number) => {
      progress = Math.max(progress, p);
      pct.textContent = `${Math.round(progress * 100)}%`;
      meter.style.strokeDashoffset = String(RING * (1 - progress));
    };
    const tryReveal = () => {
      if (ready && shown) reveal();
    };
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || !e.data || e.data.source !== "shelf-catch") return;
      if (e.data.type === "progress") set(Number(e.data.value) || 0);
      if (e.data.type === "ready" || e.data.type === "error") {
        set(1);
        ready = true;
        tryReveal();
      }
    };
    window.addEventListener("message", onMessage);
    const fallback = setTimeout(() => {
      ready = true;
      shown = true;
      tryReveal();
    }, 30000);

    engine.current?.pause();
    engine.current?.centre();
    set(0);

    if (reduce) {
      b.style.clipPath = "none";
      shown = true;
      setLoad(true);
    } else {
      const drops = [...el.querySelectorAll(".m-drop")];
      const minis = [...el.querySelectorAll(".m-mini-card")];
      opening.current = createTimeline({ defaults: { ease: "inOutQuart" } })
        .add(el.querySelector(".m-arcade-play")!, { scale: [1, 1.08, 0], opacity: [1, 1, 0], duration: 520, ease: "inBack" }, 0)
        .add(el.querySelectorAll(".m-arcade-title span"), { y: "-140%", rotate: -10, opacity: 0, duration: 520, delay: stagger(28, { from: "center" }), ease: "inQuart" }, 0)
        .add(el.querySelector(".m-arcade-try")!, { opacity: 0, y: 12, duration: 300 }, 0)
        .add(el.querySelector(".m-arcade-hud")!, { opacity: 0, y: -10, duration: 350 }, 80);
      if (drops.length) opening.current.add(drops, { scale: 0, opacity: 0, duration: 420, delay: stagger(35), ease: "inBack" }, 60);
      if (minis.length) opening.current.add(minis, { y: 30, opacity: 0, duration: 380, delay: stagger(25), ease: "inQuad" }, 120);
      opening.current
        .add(el.querySelector(".m-arcade-ledge i")!, { scaleX: [1, 0.6, 14], scaleY: [1, 1.6, 0.4], duration: 900, ease: "inOutExpo" }, 280)
        .add(b, { clipPath: ["circle(0% at 50% 89%)", "circle(150% at 50% 89%)"], duration: 1000, ease: "inOutQuart" }, 760)
        .add(b.querySelectorAll(".m-boot-orbit"), { rotate: [-90, 0], opacity: [0, 1], duration: 1200, delay: stagger(120), ease: "outExpo" }, 1100)
        .add(svg.createDrawable(b.querySelector(".m-boot-track")!), { draw: ["0 0", "0 1"], duration: 900, ease: "outQuart" }, 1150)
        .add(b.querySelectorAll(".m-boot-core > *"), { y: [16, 0], opacity: [0, 1], duration: 700, delay: stagger(90), ease: "outExpo" }, 1250)
        .call(() => setLoad(true), 1500)
        .call(() => {
          shown = true;
          tryReveal();
        }, 1700);
    }
    const spin = reduce ? null : animate(b.querySelectorAll(".m-boot-orbit"), { rotate: "+=360", duration: 7000, loop: true, ease: "linear", delay: 2300 });

    return () => {
      clearTimeout(fallback);
      window.removeEventListener("message", onMessage);
      spin?.revert();
    };
  }, [phase, reveal]);

  const close = () => {
    opening.current?.revert();
    opening.current = null;
    if (boot.current) {
      utils.remove(boot.current);
      boot.current.removeAttribute("style");
    }
    phaseRef.current = "idle";
    setLoad(false);
    setPhase("idle");
    engine.current?.resume();
    if (!prefersReducedMotion()) {
      animate(stage.current!, { scale: [0.985, 1], duration: 700, ease: spring(200, 16) });
      animate(board.current!.querySelector(".m-arcade-play")!, { scale: [0, 1], opacity: [0, 1], duration: 800, delay: 250, ease: spring(220, 12) });
    }
  };

  return (
    <section className="band m-game" id="play">
      <div className="m-game-wrap">
        <header className="m-game-head">
          <div>
            <p className="m-game-kicker">
              <span aria-hidden="true">
                {SPECTRUM.map((c) => (
                  <i key={c} style={{ background: c }} />
                ))}
              </span>
              {t.kicker}
            </p>
            <h2 className="display m-game-title">{t.title}</h2>
          </div>
          <p className="m-game-lede">{t.body}</p>
        </header>

        <div className="m-game-stage" ref={stage} data-phase={phase}>
          <div className="m-game-halo" aria-hidden="true" />
          <div className="m-game-glow" aria-hidden="true">
            <i />
          </div>
          <div className="m-arcade" ref={board} aria-hidden={phase !== "idle"}>
            <div className="m-arcade-shelf">
              <div className="m-arcade-row" />
            </div>
            <div className="m-arcade-hud">
              <span>
                {t.caught} <b className="m-arcade-count">0</b>
              </span>
              <span className="m-arcade-tag">{t.kicker}</span>
            </div>
            <div className="m-arcade-drops" />
            <div className="m-arcade-ledge">
              <i />
            </div>
            <div className="m-arcade-center">
              <p className="m-arcade-title" aria-label="Shelf Catch">
                {TITLE.split("").map((ch, i) => (
                  <span key={i} aria-hidden="true" className={ch === " " ? "gap" : ""}>
                    {ch === " " ? " " : ch}
                  </span>
                ))}
              </p>
              <button type="button" className="m-arcade-play" onClick={() => phase === "idle" && setPhase("opening")}>
                <span className="m-arcade-ring" aria-hidden="true" />
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <defs>
                    <linearGradient id="m-play-g" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#ff5a5f" />
                      <stop offset="0.5" stopColor="#ffd43b" />
                      <stop offset="1" stopColor="#5b7cff" />
                    </linearGradient>
                  </defs>
                  <circle cx="12" cy="12" r="12" fill="url(#m-play-g)" />
                  <path d="M10 7.8v8.4l6.6-4.2z" fill="#fff" />
                </svg>
                {t.play}
              </button>
              <p className="m-arcade-try">{t.try}</p>
            </div>
          </div>

          {phase !== "idle" && (
            <>
              <div className="m-boot" ref={boot}>
                <svg className="m-boot-rings" viewBox="0 0 160 160" aria-hidden="true">
                  <defs>
                    <linearGradient id="m-boot-g" x1="0" y1="0" x2="1" y2="1">
                      {SPECTRUM.map((c, i) => (
                        <stop key={c} offset={i / (SPECTRUM.length - 1)} stopColor={c} />
                      ))}
                    </linearGradient>
                  </defs>
                  <circle className="m-boot-orbit" cx="80" cy="80" r="74" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="2 6" />
                  <path className="m-boot-orbit" d="M80 14 A66 66 0 0 1 146 80" fill="none" stroke="#ff9a3c" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
                  <circle className="m-boot-track" cx="80" cy="80" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                  <circle className="m-boot-meter" cx="80" cy="80" r="54" fill="none" stroke="url(#m-boot-g)" strokeWidth="6" strokeLinecap="round" strokeDasharray={RING} strokeDashoffset={RING} transform="rotate(-90 80 80)" />
                </svg>
                <div className="m-boot-core">
                  <b className="m-boot-pct">0%</b>
                  <span className="m-boot-label">{t.loading}</span>
                </div>
              </div>
              {load && (
                <iframe ref={frame} className="m-game-frame" src={`${src}?embed=1`} title={t.play} allow="autoplay; fullscreen" style={{ opacity: 0 }} />
              )}
            </>
          )}
        </div>

        <div className="m-game-foot">
          <p className="m-game-keys">
            <kbd>←</kbd>
            <kbd>→</kbd>
            <span>{t.hint}</span>
          </p>
          <p className="m-game-links">
            {phase === "playing" && (
              <button type="button" className="m-game-close" onClick={close}>
                {t.close} ✕
              </button>
            )}
            <a href={src} target="_blank" rel="noopener">
              {t.full} ↗
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

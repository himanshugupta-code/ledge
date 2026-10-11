"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { animate, stagger } from "animejs";
import { prefersReducedMotion } from "../../lib/motion";

export function ProseMotion({ children, accent }: { children: ReactNode; accent: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const bar = document.querySelector<HTMLElement>(".b-progress i");
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.4 - r.top) / Math.max(1, r.height)));
      if (bar) bar.style.transform = `scaleX(${p})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (prefersReducedMotion()) return () => window.removeEventListener("scroll", onScroll);

    const targets = [...el.querySelectorAll<HTMLElement>("h2, table, pre, ol, ul, blockquote")];
    targets.forEach((t) => t.classList.add("b-pending"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const t = e.target as HTMLElement;
          io.unobserve(t);
          t.classList.remove("b-pending");
          if (t.tagName === "H2") {
            animate(t, { opacity: [0, 1], x: [-30, 0], duration: 900, ease: "outExpo" });
            t.classList.add("b-lit");
          } else if (t.tagName === "TABLE") {
            animate(t.querySelectorAll("tr"), { opacity: [0, 1], x: [24, 0], duration: 700, delay: stagger(60), ease: "outExpo" });
            t.style.opacity = "1";
          } else if (t.tagName === "OL" || t.tagName === "UL") {
            animate(t.children, { opacity: [0, 1], y: [14, 0], duration: 700, delay: stagger(70), ease: "outExpo" });
            t.style.opacity = "1";
          } else {
            animate(t, { opacity: [0, 1], y: [20, 0], duration: 800, ease: "outExpo" });
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      targets.forEach((t) => t.classList.remove("b-pending"));
    };
  }, []);

  return (
    <div className="prose b-prose" ref={root} style={{ ["--c" as string]: accent }}>
      {children}
    </div>
  );
}

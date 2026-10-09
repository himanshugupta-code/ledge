"use client";

import { useEffect, useRef, type ElementType } from "react";
import { animate, stagger } from "animejs";
import { prefersReducedMotion, watchVisibility } from "../../lib/motion";

type Props = { text: string; as?: ElementType; className?: string; onLoad?: boolean };

export function SplitWords({ text, as: Tag = "h2", className = "", onLoad = false }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const words = el.querySelectorAll(".m-w > span");
    const play = () =>
      animate(words, onLoad
        ? { y: ["110%", "0%"], rotate: [6, 0], duration: 900, delay: stagger(70, { start: 150 }), ease: "outExpo" }
        : { opacity: [0.15, 1], y: [24, 0], rotate: [4, 0], duration: 800, delay: stagger(55), ease: "outExpo" });
    if (onLoad) {
      const a = play();
      return () => {
        a.revert();
      };
    }
    let played = false;
    const unwatch = watchVisibility(el, (v) => {
      if (!v || played) return;
      played = true;
      play();
    }, 0.6);
    return unwatch;
  }, [text, onLoad]);

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {text.split(" ").map((word, i) => (
        <span key={i} aria-hidden="true">
          {i > 0 && " "}
          <span className="m-w">
            <span>{word}</span>
          </span>
        </span>
      ))}
    </Tag>
  );
}

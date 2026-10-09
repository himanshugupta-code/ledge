"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import { artFor, type PostLite } from "../../lib/postArt";
import { prefersReducedMotion, watchVisibility } from "../../lib/motion";
import { PostArt } from "./PostArt";

type Labels = { guide: string; compare: string; min: string };

export function PostCards({ posts, labels, variant = "grid" }: { posts: PostLite[]; labels: Labels; variant?: "grid" | "feature" }) {
  const root = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const cards = [...el.querySelectorAll<HTMLElement>(".b-card")];
    const reduce = prefersReducedMotion();
    let played = false;
    const unwatch = reduce
      ? () => {}
      : watchVisibility(el, (v) => {
          if (!v || played) return;
          played = true;
          animate(cards, {
            opacity: [0, 1],
            y: [80, 0],
            rotateX: [-28, 0],
            scale: [0.92, 1],
            filter: ["blur(10px)", "blur(0px)"],
            duration: 1100,
            delay: stagger(90),
            ease: "outExpo",
          });
        }, 0.12);
    if (!reduce) cards.forEach((c) => (c.style.opacity = "0"));

    const offs = cards.map((card) => {
      const move = (e: PointerEvent) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--rx", `${(0.5 - y) * 10}deg`);
        card.style.setProperty("--ry", `${(x - 0.5) * 12}deg`);
        card.style.setProperty("--gx", `${x * 100}%`);
        card.style.setProperty("--gy", `${y * 100}%`);
      };
      const leave = () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      };
      if (!reduce) {
        card.addEventListener("pointermove", move);
        card.addEventListener("pointerleave", leave);
      }
      return () => {
        card.removeEventListener("pointermove", move);
        card.removeEventListener("pointerleave", leave);
      };
    });

    return () => {
      unwatch();
      offs.forEach((o) => o());
      cards.forEach((c) => (c.style.opacity = ""));
    };
  }, [posts]);

  return (
    <ul className={`b-cards b-cards-${variant}`} ref={root}>
      {posts.map((p, i) => {
        const art = artFor(p.slug);
        return (
          <li key={p.slug} className={variant === "feature" && i === 0 ? "b-lead" : ""}>
            <Link href={`/en/blog/${p.slug}/`} hrefLang="en" className="b-card" style={{ ["--c" as string]: art.accent }}>
              <span className="b-thumb">
                <PostArt slug={p.slug} />
                <span className="b-glare" aria-hidden="true" />
              </span>
              <span className="b-body">
                <span className="b-kind">
                  <i aria-hidden="true" />
                  {art.kind === "compare" ? labels.compare : labels.guide}
                  <em>
                    {p.minutes} {labels.min}
                  </em>
                </span>
                <b>{p.title}</b>
                <span className="b-desc">{p.description}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

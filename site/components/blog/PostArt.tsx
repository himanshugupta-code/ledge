"use client";

import { useEffect, useRef } from "react";
import { ART_H, ART_W, drawPostArt } from "./drawArt";

export function PostArt({ slug, className = "" }: { slug: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const draw = () => {
      const ctx = c.getContext("2d");
      if (!ctx) return;
      c.width = ART_W;
      c.height = ART_H;
      drawPostArt(ctx, slug, getComputedStyle(document.body).fontFamily);
    };
    draw();
    document.fonts?.ready.then(draw);
  }, [slug]);

  return <canvas ref={ref} className={`b-art ${className}`} width={ART_W} height={ART_H} aria-hidden="true" />;
}

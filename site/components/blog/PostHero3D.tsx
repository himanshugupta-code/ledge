"use client";

import { useEffect, useRef } from "react";
import { clamp01, prefersReducedMotion } from "../../lib/motion";
import { artFor, type PostLite } from "../../lib/postArt";
import { createStage } from "./stage3d";

const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const outBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

export function PostHero3D({ post, others }: { post: PostLite; others: PostLite[] }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const canvas = el.querySelector<HTMLCanvasElement>("canvas")!;
    const hero = el.closest<HTMLElement>(".b-post-hero") ?? el;
    const reduce = prefersReducedMotion();
    let disposed = false;
    let stop = () => {};

    (async () => {
      const stage = await createStage(canvas, 34);
      if (!stage || disposed) {
        hero.classList.add("no-gl");
        return;
      }
      const { THREE, renderer, scene, camera } = stage;
      scene.fog = new THREE.Fog(0x0a0c14, 8, 20);
      const main = stage.card(post.slug, post.title, 3.4);
      scene.add(main);
      const accent = new THREE.Color(artFor(post.slug).accent);
      const flare = new THREE.PointLight(accent, 0, 0, 0);
      flare.position.set(0, 0, 2);
      scene.add(flare);
      const back = others.slice(0, 5).map((p, i) => {
        const m = stage.card(p.slug, p.title, 2.2);
        const ang = (i / 5) * Math.PI * 2;
        m.userData.home = new THREE.Vector3(Math.cos(ang) * 4.6, Math.sin(ang) * 2.2, -6 - (i % 2) * 2.5);
        m.userData.spin = (i % 2 ? 1 : -1) * (0.2 + i * 0.05);
        scene.add(m);
        return m;
      });
      const dust = stage.dust(360, 20);

      stage.resize();
      const ro = new ResizeObserver(stage.resize);
      ro.observe(canvas);

      let px = 0;
      let py = 0;
      let sx = 0;
      let sy = 0;
      const onMove = (e: PointerEvent) => {
        px = (e.clientX / window.innerWidth) * 2 - 1;
        py = (e.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener("pointermove", onMove, { passive: true });

      const start = performance.now();
      let visible = true;
      let raf = 0;
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(loop);
      });
      io.observe(hero);

      const loop = (now: number) => {
        raf = 0;
        if (!visible || disposed) return;
        const t = (now - start) / 1000;
        const r = hero.getBoundingClientRect();
        const sp = clamp01(-r.top / Math.max(1, r.height));
        const d = reduce ? 1 : clamp01((t - 0.2) / 1.6);
        sx += (px - sx) * 0.05;
        sy += (py - sy) * 0.05;

        const e = reduce ? 1 : outBack(d);
        main.position.set((1 - outExpo(d)) * 3, (reduce ? 0 : Math.sin(t * 1.1) * 0.08) + sp * 1.6, -(1 - outExpo(d)) * 9);
        main.rotation.set(-0.12 + sy * 0.12 - sp * 0.7, (1 - e) * 2.6 - 0.32 + sx * 0.25, (1 - outExpo(d)) * 0.5);
        (main.userData.face as { opacity: number }).opacity = 1 - sp * 0.6;
        flare.intensity = Math.sin(clamp01((t - 0.9) / 0.8) * Math.PI) * 6 * (reduce ? 0 : 1);

        back.forEach((m, i) => {
          const h = m.userData.home;
          const k = reduce ? 1 : outExpo(clamp01((t - 0.6 - i * 0.12) / 1.6));
          m.position.set(h.x * k, h.y * k + Math.sin(t * 0.5 + i) * 0.2, h.z - (1 - k) * 8);
          m.rotation.set(Math.sin(t * 0.3 + i) * 0.15, m.userData.spin + Math.sin(t * 0.2 + i) * 0.3, 0);
          (m.userData.face as { opacity: number }).opacity = 0.55 * k;
        });
        dust.rotation.y = t * 0.025;

        camera.position.set(sx * 0.4, -sy * 0.25, 7.2);
        camera.lookAt(0, sp * 0.8, 0);
        renderer.render(scene, camera);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      hero.classList.add("ready");

      stop = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("pointermove", onMove);
        stage.dispose();
      };
    })();

    return () => {
      disposed = true;
      stop();
    };
  }, [post, others]);

  return (
    <div className="b-post-stage" ref={root} aria-hidden="true">
      <canvas />
    </div>
  );
}

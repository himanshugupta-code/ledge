"use client";

import { useEffect, useRef } from "react";
import type * as THREE_NS from "three";
import { SPECTRUM, clamp01, prefersReducedMotion } from "../../lib/motion";

type FilmText = { hint: string; aria: string; captions: string[]; free: string };

const WINDOWS: [number, number][] = [
  [0.13, 0.27],
  [0.34, 0.47],
  [0.63, 0.76],
  [0.85, 0.97],
];

const SCREEN_W = 3.18;
const SCREEN_H = 1.99;
const LIFT = 0.83;
const TEX_W = 1600;
const TEX_H = Math.round((TEX_W * SCREEN_H) / SCREEN_W);
const REGION = { x: 820, y: 190, w: 660, h: 470 };
const SHELF_Y = 3.3 + LIFT;
const SHELF_Z = -1.05;
const SLOTS = [-1.2, -0.4, 0.4, 1.2];
const CARD_W = 0.64;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

type Key = { p: number; pos: [number, number, number]; look: [number, number, number] };

const KEYS: Key[] = [
  { p: 0, pos: [4.6, 3.6, 5.8], look: [0, 0.55, 0] },
  { p: 0.12, pos: [3.6, 2.6, 5.2], look: [0, 0.7, -0.2] },
  { p: 0.3, pos: [0.25, 2.0 + LIFT, 5.4], look: [0, 1.0 + LIFT, -0.7] },
  { p: 0.45, pos: [0.32, 1.3 + LIFT, 1.45], look: [0.32, 1.2 + LIFT, -1.4] },
  { p: 0.6, pos: [0.46, 1.26 + LIFT, 1.2], look: [0.46, 1.2 + LIFT, -1.4] },
  { p: 0.72, pos: [0.25, 2.05 + LIFT, 3.0], look: [0.1, 2.8 + LIFT, -0.9] },
  { p: 0.86, pos: [-0.2, 2.85 + LIFT, 3.3], look: [0, 3.35 + LIFT, -1.0] },
  { p: 1, pos: [3.4, 3.0 + LIFT * 0.6, 7.6], look: [0, 1.6 + LIFT * 0.6, -0.5] },
];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawDesktop(ctx: CanvasRenderingContext2D, font: string) {
  const g = ctx.createLinearGradient(0, 0, TEX_W, TEX_H);
  g.addColorStop(0, "#23306e");
  g.addColorStop(0.55, "#3b2d74");
  g.addColorStop(1, "#5a2c69");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  const glow = ctx.createRadialGradient(TEX_W * 0.75, TEX_H * 0.15, 0, TEX_W * 0.75, TEX_H * 0.15, TEX_W * 0.6);
  glow.addColorStop(0, "rgba(255, 154, 60, 0.35)");
  glow.addColorStop(1, "rgba(255, 154, 60, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  ctx.fillStyle = "rgba(10, 10, 25, 0.38)";
  ctx.fillRect(0, 0, TEX_W, 34);
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.font = `600 17px ${font}`;
  ctx.textBaseline = "middle";
  ["Finder", "File", "Edit", "View", "Go", "Window"].forEach((w, i) => ctx.fillText(w, 46 + i * 78, 17));
  ctx.textAlign = "right";
  ctx.fillText("Fri 9:41", TEX_W - 24, 17);
  ctx.textAlign = "left";

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  roundRect(ctx, 110, 120, 640, 440, 14);
  ctx.fillStyle = "#1e2230";
  ctx.fill();
  ctx.restore();
  roundRect(ctx, 110, 120, 640, 440, 14);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "#2a2f40";
  ctx.fillRect(110, 120, 640, 40);
  ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(136 + i * 22, 140, 7, 0, Math.PI * 2);
    ctx.fill();
  });
  const code = [
    ["#c678dd", 0, 140],
    ["#61afef", 30, 260],
    ["#98c379", 60, 200],
    ["#e5c07b", 60, 310],
    ["#61afef", 30, 180],
    ["#c678dd", 0, 120],
    ["#98c379", 30, 280],
    ["#e06c75", 60, 220],
    ["#61afef", 60, 160],
    ["#e5c07b", 30, 240],
  ] as const;
  code.forEach(([c, indent, w], i) => {
    ctx.fillStyle = c;
    roundRect(ctx, 150 + indent, 190 + i * 34, w, 12, 6);
    ctx.fill();
  });
  ctx.restore();

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 20;
  roundRect(ctx, REGION.x, REGION.y, REGION.w, REGION.h, 14);
  ctx.fillStyle = "#f7f8fb";
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, REGION.x, REGION.y, REGION.w, REGION.h, 14);
  ctx.clip();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(REGION.x, REGION.y, REGION.w, 44);
  ctx.fillStyle = "#e6e8ee";
  ctx.fillRect(REGION.x, REGION.y + 44, REGION.w, 1);
  ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(REGION.x + 26 + i * 22, REGION.y + 22, 7, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "#16181d";
  ctx.font = `700 20px ${font}`;
  ctx.fillText("Weekly signups", REGION.x + 36, REGION.y + 86);
  ctx.font = `800 54px ${font}`;
  ctx.fillText("12,480", REGION.x + 36, REGION.y + 140);
  ctx.fillStyle = "#28a85a";
  ctx.font = `700 20px ${font}`;
  ctx.fillText("+18% this week", REGION.x + 250, REGION.y + 140);
  const bars = [0.42, 0.55, 0.48, 0.66, 0.6, 0.78, 0.92];
  bars.forEach((v, i) => {
    const bh = v * 210;
    ctx.fillStyle = i === bars.length - 1 ? "#2d6bff" : "#c9d4f6";
    roundRect(ctx, REGION.x + 40 + i * 84, REGION.y + 430 - bh, 56, bh, 8);
    ctx.fill();
  });
  ctx.restore();

  for (let i = 0; i < 4; i++) {
    const x = 60 + (i % 2) * 120;
    const y = 640 + Math.floor(i / 2) * 140;
    ctx.fillStyle = "#f4f5f9";
    roundRect(ctx, x, y, 74, 56, 6);
    ctx.fill();
    ctx.fillStyle = SPECTRUM[(i * 2) % SPECTRUM.length];
    ctx.fillRect(x, y, 18, 56);
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = `500 14px ${font}`;
    ctx.fillText("Screenshot…", x - 6, y + 78);
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
  roundRect(ctx, TEX_W / 2 - 330, TEX_H - 92, 660, 78, 22);
  ctx.fill();
  ["#5b7cff", "#3ddc84", "#ff9a3c", "#ff5a5f", "#2cd4e8", "#ffd43b", "#c678dd", "#eef1fb"].forEach((c, i) => {
    ctx.fillStyle = c;
    roundRect(ctx, TEX_W / 2 - 300 + i * 76, TEX_H - 80, 56, 56, 14);
    ctx.fill();
  });
}

function drawCapture(ctx: CanvasRenderingContext2D, font: string, p: number) {
  const appear = seg(p, 0.475, 0.5);
  const drag = ease(seg(p, 0.5, 0.57));
  const flash = seg(p, 0.575, 0.6);
  if (appear <= 0) return;
  const x0 = REGION.x - 6;
  const y0 = REGION.y - 6;
  const w = (REGION.w + 12) * drag;
  const h = (REGION.h + 12) * drag;
  if (drag > 0 && flash < 1) {
    ctx.fillStyle = "rgba(45, 107, 255, 0.12)";
    ctx.fillRect(x0, y0, w, h);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([12, 9]);
    ctx.lineDashOffset = -p * 4000;
    ctx.strokeRect(x0, y0, w, h);
    ctx.setLineDash([]);
    const label = `${Math.round(w)} × ${Math.round(h)}`;
    ctx.font = `700 20px ${font}`;
    const tw = ctx.measureText(label).width + 20;
    ctx.fillStyle = "#2d6bff";
    roundRect(ctx, x0 + w - tw, y0 + h + 12, tw, 34, 8);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x0 + w - tw + 10, y0 + h + 29);
  }
  if (flash < 1) {
    const cx = x0 + w;
    const cy = y0 + h;
    ctx.globalAlpha = appear;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 26, cy);
    ctx.lineTo(cx - 8, cy);
    ctx.moveTo(cx + 8, cy);
    ctx.lineTo(cx + 26, cy);
    ctx.moveTo(cx, cy - 26);
    ctx.lineTo(cx, cy - 8);
    ctx.moveTo(cx, cy + 8);
    ctx.lineTo(cx, cy + 26);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (flash > 0 && flash < 1) {
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(flash * Math.PI) * 0.9})`;
    ctx.fillRect(0, 0, TEX_W, TEX_H);
  }
}

function drawBoot(ctx: CanvasRenderingContext2D, font: string, ring: number, reveal: number, desk: HTMLCanvasElement) {
  ctx.fillStyle = "#040507";
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  const cx = TEX_W / 2;
  const cy = TEX_H / 2 - 30;
  const R = 110;
  if (ring > 0) {
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    const g = ctx.createConicGradient(-Math.PI / 2, cx, cy);
    SPECTRUM.forEach((c, n) => g.addColorStop(n / SPECTRUM.length, c));
    g.addColorStop(1, SPECTRUM[0]);
    ctx.save();
    ctx.shadowColor = "rgba(110, 149, 255, 0.9)";
    ctx.shadowBlur = 40;
    ctx.strokeStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ring);
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = Math.min(1, ring * 2);
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 64px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Ledge", cx, cy + R + 90);
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
  }
  if (reveal > 0) {
    ctx.save();
    ctx.globalAlpha = reveal;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(1, reveal * Math.hypot(TEX_W, TEX_H)), 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(desk, 0, 0);
    ctx.restore();
  }
}

function thumb(font: string, color: string, kind: number) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 352;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = kind === 1 ? "#1e2230" : "#f7f8fb";
  ctx.fillRect(0, 0, 512, 352);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 96, 352);
  if (kind === 1) {
    ["#c678dd", "#61afef", "#98c379", "#e5c07b", "#61afef"].forEach((col, i) => {
      ctx.fillStyle = col;
      roundRect(ctx, 130 + (i % 2) * 30, 50 + i * 54, 200 + ((i * 53) % 120), 18, 9);
      ctx.fill();
    });
  } else if (kind === 2) {
    const g = ctx.createLinearGradient(96, 0, 512, 352);
    g.addColorStop(0, "#ffb36b");
    g.addColorStop(0.5, "#ff7a8a");
    g.addColorStop(1, "#6a5acd");
    ctx.fillStyle = g;
    ctx.fillRect(96, 0, 416, 352);
    ctx.fillStyle = "#fff3c4";
    ctx.beginPath();
    ctx.arc(380, 120, 46, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "#16181d";
    ctx.font = `800 44px ${font}`;
    ctx.fillText("Notes", 130, 90);
    ctx.fillStyle = "#c4cae0";
    for (let i = 0; i < 5; i++) {
      roundRect(ctx, 130, 130 + i * 40, 320 - (i % 3) * 60, 14, 7);
      ctx.fill();
    }
  }
  return c;
}

export function ScrollFilm({ t, cta, href }: { t: FilmText; cta: string; href: string }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const canvas = el.querySelector<HTMLCanvasElement>(".m-film-canvas")!;
    const caps = [...el.querySelectorAll<HTMLElement>(".m-film-cap")];
    const title = el.querySelector<HTMLElement>(".m-film-title")!;
    const bar = el.querySelector<HTMLElement>(".m-film-bar i")!;
    const flashEl = el.querySelector<HTMLElement>(".m-film-flash")!;
    const reduce = prefersReducedMotion();
    let disposed = false;
    let stop = () => {};

    const progress = () => {
      const r = el.getBoundingClientRect();
      return clamp01(-r.top / Math.max(1, r.height - window.innerHeight));
    };

    const overlay = (p: number) => {
      title.style.opacity = String(1 - seg(p, 0.03, 0.09));
      title.style.visibility = seg(p, 0.03, 0.09) >= 1 ? "hidden" : "visible";
      title.style.transform = `translateY(${-seg(p, 0.03, 0.09) * 40}px)`;
      caps.forEach((c, i) => {
        const [a, b] = WINDOWS[i];
        const v = Math.min(seg(p, a, a + 0.03), 1 - seg(p, b - 0.03, b));
        c.style.opacity = String(v);
        c.style.transform = `translateY(${(1 - v) * 18}px)`;
      });
      bar.style.transform = `scaleX(${p})`;
      flashEl.style.opacity = String(reduce ? 0 : Math.sin(seg(p, 0.575, 0.605) * Math.PI) * 0.75);
    };

    (async () => {
      const THREE = await import("three");
      const { RoundedBoxGeometry } = await import("three/examples/jsm/geometries/RoundedBoxGeometry.js");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (disposed) return;

      let renderer: THREE_NS.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
      } catch {
        el.classList.add("no-gl");
        const onScroll = () => overlay(progress());
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        stop = () => window.removeEventListener("scroll", onScroll);
        return;
      }
      el.classList.add("gl");
      requestAnimationFrame(() => el.classList.add("ready"));
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;

      const font = getComputedStyle(document.body).fontFamily;
      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;
      scene.environmentIntensity = 0.8;

      const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 100);
      const hemi = new THREE.HemisphereLight(0xffffff, 0xb8c2d9, 0.7);
      scene.add(hemi);
      const sun = new THREE.DirectionalLight(0xffffff, 2.4);
      sun.position.set(4, 9, 6);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.left = -6;
      sun.shadow.camera.right = 6;
      sun.shadow.camera.top = 6;
      sun.shadow.camera.bottom = -6;
      sun.shadow.bias = -0.0005;
      scene.add(sun);
      const spill = new THREE.PointLight(0x9fb8ff, 0, 5, 1.6);
      spill.position.set(0, 1.1, -0.4);
      scene.add(spill);

      const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.16 }));
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);

      const rimBlue = new THREE.PointLight(0x6e95ff, 2.4, 0, 0);
      rimBlue.position.set(-5, 2.5, -4);
      scene.add(rimBlue);
      const rimWarm = new THREE.PointLight(0xffa25a, 1.6, 0, 0);
      rimWarm.position.set(5, 1.8, -3.5);
      scene.add(rimWarm);
      const coreLight = new THREE.PointLight(0x9fb8ff, 0, 0, 0);
      coreLight.position.set(0, 0.55, -0.35);
      scene.add(coreLight);

      const glowSprite = (inner: string, outer: string) => {
        const c = document.createElement("canvas");
        c.width = 128;
        c.height = 128;
        const g = c.getContext("2d")!;
        const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        rg.addColorStop(0, inner);
        rg.addColorStop(1, outer);
        g.fillStyle = rg;
        g.fillRect(0, 0, 128, 128);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
      };
      const specCv = document.createElement("canvas");
      specCv.width = 512;
      specCv.height = 8;
      const spx = specCv.getContext("2d")!;
      const spg = spx.createLinearGradient(0, 0, 512, 0);
      SPECTRUM.forEach((c, n) => spg.addColorStop(n / (SPECTRUM.length - 1), c));
      spx.fillStyle = spg;
      spx.fillRect(0, 0, 512, 8);
      const specTex = new THREE.CanvasTexture(specCv);
      specTex.colorSpace = THREE.SRGBColorSpace;

      const shell = new THREE.MeshStandardMaterial({ color: 0x1a1e27, metalness: 0.9, roughness: 0.32, envMapIntensity: 0.9 });
      const trim = new THREE.MeshStandardMaterial({ color: 0x4a5266, metalness: 1, roughness: 0.16 });
      const innerMat = new THREE.MeshStandardMaterial({ color: 0x0b0d13, metalness: 0.6, roughness: 0.5, emissive: 0x2d6bff, emissiveIntensity: 0 });

      const laptop = new THREE.Group();
      scene.add(laptop);
      const engine = new THREE.Group();
      engine.position.set(0, 0.45, -0.35);
      laptop.add(engine);

      const seamMats: THREE_NS.MeshBasicMaterial[] = [];
      const halves = [-1, 1].map((side) => {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new RoundedBoxGeometry(1.3, 0.8, 1.8, 6, 0.2), shell);
        body.position.x = side * 0.65;
        body.castShadow = true;
        g.add(body);
        const face = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.66), innerMat);
        face.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
        face.position.set(side * 0.003, 0, 0);
        g.add(face);
        const seamMat = new THREE.MeshBasicMaterial({ map: specTex, transparent: true, opacity: 0.5, toneMapped: false });
        seamMats.push(seamMat);
        const seamTop = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.012, 1.4), seamMat);
        seamTop.position.set(side * 0.007, 0.401, 0);
        g.add(seamTop);
        const seamFront = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.42, 0.012), seamMat);
        seamFront.position.set(side * 0.007, 0, 0.901);
        g.add(seamFront);
        const band = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.018, 0.01), trim);
        band.position.set(side * 0.68, -0.14, 0.902);
        g.add(band);
        for (let n = 0; n < 3; n++) {
          const dot = new THREE.Mesh(new THREE.CircleGeometry(0.02, 16), new THREE.MeshBasicMaterial({ color: SPECTRUM[side < 0 ? n : n + 3], toneMapped: false }));
          dot.position.set(side * (0.34 + n * 0.08), 0.12, 0.903);
          g.add(dot);
        }
        engine.add(g);
        return g;
      });

      const core = new THREE.Group();
      engine.add(core);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true, opacity: 0 });
      const coreBall = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 3), coreMat);
      core.add(coreBall);
      const coreGlowMat = new THREE.SpriteMaterial({ map: glowSprite("rgba(160,185,255,1)", "rgba(45,107,255,0)"), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const coreGlow = new THREE.Sprite(coreGlowMat);
      coreGlow.scale.setScalar(1.6);
      core.add(coreGlow);
      const ringMats: THREE_NS.MeshStandardMaterial[] = [];
      const rings = [0.34, 0.44, 0.54].map((rad, n) => {
        const m = new THREE.MeshStandardMaterial({ color: 0x2a3040, metalness: 1, roughness: 0.2, emissive: new THREE.Color(SPECTRUM[[5, 1, 4][n]]), emissiveIntensity: 0 });
        ringMats.push(m);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.012 + n * 0.002, 12, 120), m);
        core.add(ring);
        return ring;
      });

      const beamCv = document.createElement("canvas");
      beamCv.width = 8;
      beamCv.height = 256;
      const bx = beamCv.getContext("2d")!;
      const bg = bx.createLinearGradient(0, 0, 0, 256);
      bg.addColorStop(0, "rgba(140,170,255,0)");
      bg.addColorStop(0.7, "rgba(140,170,255,0.55)");
      bg.addColorStop(1, "rgba(220,230,255,0.9)");
      bx.fillStyle = bg;
      bx.fillRect(0, 0, 8, 256);
      const beamTex = new THREE.CanvasTexture(beamCv);
      const beamMat = new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 0.08, 1, 48, 1, true), beamMat);
      laptop.add(beam);

      const padMat = new THREE.MeshBasicMaterial({ map: glowSprite("rgba(110,149,255,0.7)", "rgba(110,149,255,0)"), transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const pad = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.2), padMat);
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(0, 0.004, -0.35);
      scene.add(pad);

      const dustGeo = new THREE.BufferGeometry();
      const dustPos = new Float32Array(360 * 3);
      for (let n = 0; n < 360; n++) {
        const a = Math.random() * Math.PI * 2;
        const rr = 1.2 + Math.random() * 3.4;
        dustPos.set([Math.cos(a) * rr, Math.random() * 5.5, Math.sin(a) * rr - 0.6], n * 3);
      }
      dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
      const dustMat = new THREE.PointsMaterial({ map: glowSprite("rgba(200,215,255,1)", "rgba(200,215,255,0)"), size: 0.05, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const dust = new THREE.Points(dustGeo, dustMat);
      scene.add(dust);

      const hinge = new THREE.Group();
      hinge.position.set(0, 0.075 + LIFT, -1.1);
      hinge.rotation.x = -0.22;
      laptop.add(hinge);
      const holo = new THREE.Group();
      holo.position.set(0, 1.09, 0);
      hinge.add(holo);
      const frameMat = new THREE.MeshBasicMaterial({ map: specTex, transparent: true, toneMapped: false });
      [
        [SCREEN_W + 0.06, 0.012, 0, SCREEN_H / 2 + 0.03],
        [SCREEN_W + 0.06, 0.012, 0, -SCREEN_H / 2 - 0.03],
        [0.012, SCREEN_H + 0.06, -SCREEN_W / 2 - 0.03, 0],
        [0.012, SCREEN_H + 0.06, SCREEN_W / 2 + 0.03, 0],
      ].forEach(([w, h, x, y]) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), frameMat);
        m.position.set(x, y, 0.002);
        holo.add(m);
      });
      const haloMat = new THREE.MeshBasicMaterial({ map: glowSprite("rgba(110,149,255,0.45)", "rgba(110,149,255,0)"), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const holoHalo = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W * 1.7, SCREEN_H * 1.9), haloMat);
      holoHalo.position.z = -0.04;
      holo.add(holoHalo);
      const scanCv = document.createElement("canvas");
      scanCv.width = 4;
      scanCv.height = 8;
      const scx = scanCv.getContext("2d")!;
      scx.fillStyle = "rgba(170,195,255,0.6)";
      scx.fillRect(0, 0, 4, 1);
      const scanTex = new THREE.CanvasTexture(scanCv);
      scanTex.wrapS = THREE.RepeatWrapping;
      scanTex.wrapT = THREE.RepeatWrapping;
      scanTex.repeat.set(1, 160);
      const scanMat = new THREE.MeshBasicMaterial({ map: scanTex, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const scan = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), scanMat);
      scan.position.z = 0.004;
      holo.add(scan);

      const desk = document.createElement("canvas");
      desk.width = TEX_W;
      desk.height = TEX_H;
      drawDesktop(desk.getContext("2d")!, font);
      const live = document.createElement("canvas");
      live.width = TEX_W;
      live.height = TEX_H;
      const lctx = live.getContext("2d")!;
      lctx.fillStyle = "#000";
      lctx.fillRect(0, 0, TEX_W, TEX_H);
      const screenTex = new THREE.CanvasTexture(live);
      screenTex.colorSpace = THREE.SRGBColorSpace;
      screenTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false, transparent: true, opacity: 0.94, side: THREE.DoubleSide });
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), screenMat);
      holo.add(screen);

      const logoCanvas = document.createElement("canvas");
      logoCanvas.width = 256;
      logoCanvas.height = 256;
      const lg = logoCanvas.getContext("2d")!;
      const lgGrad = lg.createLinearGradient(0, 0, 256, 256);
      SPECTRUM.forEach((c, n) => lgGrad.addColorStop(n / (SPECTRUM.length - 1), c));
      lg.fillStyle = lgGrad;
      roundRect(lg, 40, 40, 176, 176, 46);
      lg.fill();
      lg.fillStyle = "#ffffff";
      roundRect(lg, 72, 102, 112, 16, 8);
      lg.fill();
      roundRect(lg, 72, 134, 80, 16, 8);
      lg.fill();
      const logoTex = new THREE.CanvasTexture(logoCanvas);
      logoTex.colorSpace = THREE.SRGBColorSpace;
      const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, toneMapped: false }));
      logo.rotation.x = -Math.PI / 2;
      logo.position.set(0.62, 0.402, 0.25);
      halves[1].add(logo);

      const shelf = new THREE.Group();
      scene.add(shelf);
      const shelfMat = new THREE.MeshStandardMaterial({ color: 0xf4f6fb, metalness: 0.3, roughness: 0.25, transparent: true });
      const bar3 = new THREE.Mesh(new RoundedBoxGeometry(3.7, 0.08, 0.5, 3, 0.035), shelfMat);
      bar3.castShadow = true;
      shelf.add(bar3);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.012, 0.012), new THREE.MeshBasicMaterial({ color: 0x2d6bff, transparent: true, toneMapped: false }));
      strip.position.set(0, -0.038, 0.25);
      shelf.add(strip);
      const glowCanvas = document.createElement("canvas");
      glowCanvas.width = 64;
      glowCanvas.height = 64;
      const gg = glowCanvas.getContext("2d")!;
      const rg = gg.createRadialGradient(32, 32, 0, 32, 32, 32);
      rg.addColorStop(0, "rgba(45,107,255,0.55)");
      rg.addColorStop(1, "rgba(45,107,255,0)");
      gg.fillStyle = rg;
      gg.fillRect(0, 0, 64, 64);
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(glowCanvas), transparent: true, depthWrite: false, toneMapped: false }));
      glow.position.set(0, -0.12, 0.26);
      shelf.add(glow);

      const cardGeo = (w: number, h: number) => new RoundedBoxGeometry(w, h, 0.018, 2, 0.008);
      const edgeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, transparent: true });
      const cardH = CARD_W * (352 / 512);
      const parked: THREE_NS.Mesh[] = [];
      [
        [SPECTRUM[3], 1],
        [SPECTRUM[1], 2],
        [SPECTRUM[0], 3],
      ].forEach(([color, kind], i) => {
        const tex = new THREE.CanvasTexture(thumb(font, color as string, kind as number));
        tex.colorSpace = THREE.SRGBColorSpace;
        const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, transparent: true });
        const card = new THREE.Mesh(cardGeo(CARD_W, cardH), [edgeMat, edgeMat, edgeMat, edgeMat, face, edgeMat]);
        card.castShadow = true;
        card.position.set(SLOTS[i], 0.04 + cardH / 2, -0.02);
        card.rotation.x = -0.14;
        shelf.add(card);
        parked.push(card);
      });

      const crop = document.createElement("canvas");
      crop.width = REGION.w;
      crop.height = REGION.h;
      crop.getContext("2d")!.drawImage(desk, REGION.x, REGION.y, REGION.w, REGION.h, 0, 0, REGION.w, REGION.h);
      const cropTex = new THREE.CanvasTexture(crop);
      cropTex.colorSpace = THREE.SRGBColorSpace;
      const sx = SCREEN_W / TEX_W;
      const regionW = REGION.w * sx;
      const regionH = REGION.h * sx;
      const shotFace = new THREE.MeshBasicMaterial({ map: cropTex, toneMapped: false });
      const shot = new THREE.Mesh(cardGeo(regionW, regionH), [edgeMat, edgeMat, edgeMat, edgeMat, shotFace, edgeMat]);
      shot.castShadow = true;
      shot.visible = false;
      scene.add(shot);

      const v = (a: [number, number, number]) => new THREE.Vector3(...a);
      const camPos = new THREE.Vector3();
      const camLook = new THREE.Vector3();
      const tmp = new THREE.Vector3();
      const startPos = new THREE.Vector3();
      const startQuat = new THREE.Quaternion();
      const endPos = new THREE.Vector3();
      const endQuat = new THREE.Quaternion();
      const ctrl = new THREE.Vector3();
      const q = new THREE.Quaternion();
      const twist = new THREE.Quaternion();
      const yAxis = new THREE.Vector3(0, 1, 0);
      let aspect = 1;

      const resize = () => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        aspect = w / h;
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
      };

      let lastKey = "";
      const paintScreen = (p: number) => {
        const ring = ease(seg(p, 0.22, 0.3));
        const reveal = ease(seg(p, 0.3, 0.35));
        const key = p < 0.2 ? "off" : p < 0.35 ? `boot${Math.round(p * 1500)}` : p < 0.47 || p > 0.61 ? "desk" : String(Math.round(p * 2000));
        if (key === lastKey) return;
        lastKey = key;
        if (key === "off") {
          lctx.fillStyle = "#000";
          lctx.fillRect(0, 0, TEX_W, TEX_H);
        } else if (key.startsWith("boot")) {
          drawBoot(lctx, font, ring, reveal, desk);
        } else {
          lctx.drawImage(desk, 0, 0);
          if (key !== "desk") drawCapture(lctx, font, p);
        }
        screenTex.needsUpdate = true;
      };

      const apply = (p: number, time: number) => {
        let i = 0;
        while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
        const a = KEYS[i];
        const b = KEYS[i + 1];
        const f = ease(seg(p, a.p, b.p));
        camPos.lerpVectors(v(a.pos), v(b.pos), f);
        camLook.lerpVectors(v(a.look), v(b.look), f);
        const fit = aspect < 1.3 ? Math.min(2.1, 1.3 / aspect) : 1;
        const close = seg(p, 0.33, 0.45) * (1 - seg(p, 0.62, 0.74));
        const k2 = 1 + (fit - 1) * (1 - close * 0.55);
        camPos.sub(camLook).multiplyScalar(k2).add(camLook);
        const shake = reduce ? 0 : Math.sin(seg(p, 0.578, 0.62) * Math.PI) * 0.012;
        camPos.x += Math.sin(p * 2400) * shake;
        camPos.y += Math.cos(p * 3100) * shake;
        camera.position.copy(camPos);
        camera.lookAt(camLook);

        const idle = reduce ? 0 : 1 - seg(p, 0.02, 0.14);
        const t = reduce ? 0 : time * 0.001;
        laptop.rotation.y = -0.5 * (1 - ease(seg(p, 0, 0.3))) + Math.sin(t * 0.6) * 0.06 * idle;
        engine.position.y = 0.45 + Math.sin(t * 1.2) * 0.05;
        const o = seg(p, 0.08, 0.22);
        const open = o === 1 ? 1 : 1 + 2.4 * Math.pow(o - 1, 3) + 1.4 * Math.pow(o - 1, 2);
        halves.forEach((g, n) => {
          const side = n === 0 ? -1 : 1;
          g.position.set(side * 0.62 * open, 0.06 * open, -0.08 * open);
          g.rotation.y = side * 0.5 * open;
          g.rotation.z = -side * 0.08 * open;
        });
        const seamPulse = 0.5 + 0.3 * Math.sin(t * 2.4) * idle;
        seamMats.forEach((m) => (m.opacity = Math.min(1, seamPulse + ease(seg(p, 0.05, 0.12)))));
        innerMat.emissiveIntensity = ease(seg(p, 0.1, 0.2)) * 0.6;
        const spin = ease(seg(p, 0.12, 0.26));
        const coreOn = ease(seg(p, 0.1, 0.18));
        coreMat.opacity = coreOn;
        coreGlowMat.opacity = coreOn * (0.85 + 0.15 * Math.sin(t * 5));
        coreLight.intensity = coreOn * 3;
        coreBall.scale.setScalar(0.4 + 0.6 * coreOn);
        rings.forEach((ring, n) => {
          ring.scale.setScalar(0.2 + 0.8 * spin);
          ring.rotation.set(t * (0.7 + n * 0.35) * spin + n * 1.1, t * (0.9 - n * 0.2) * spin + n * 0.6, n * 0.5);
          ringMats[n].emissiveIntensity = spin * 1.6;
        });
        core.position.y = 0.25 * spin;
        const grow = ease(seg(p, 0.17, 0.22));
        const beamOn = grow * (1 - ease(seg(p, 0.4, 0.5)) * 0.6);
        const coreY = engine.position.y + core.position.y;
        const beamTop = 0.075 + LIFT + 0.06;
        const beamLen = Math.max(0.001, (beamTop - coreY) * grow);
        beam.scale.set(1, beamLen, 1);
        beam.position.set(0, coreY + beamLen / 2, -0.35 - 0.6 * grow);
        beamMat.opacity = beamOn * 0.45;
        const ux = ease(seg(p, 0.2, 0.25));
        const uy = ease(seg(p, 0.24, 0.31));
        holo.scale.set(0.02 + 0.98 * ux, 0.01 + 0.99 * uy, 1);
        holo.visible = ux > 0;
        frameMat.opacity = ux * (0.85 + 0.15 * Math.sin(t * 3));
        haloMat.opacity = uy * 0.5;
        screenMat.opacity = 0.94 * uy;
        scanTex.offset.y = -t * 0.6;
        scanMat.opacity = 0.1 * uy;
        dust.rotation.y = t * 0.04;
        dust.position.y = -((t * 0.08) % 0.5);
        padMat.opacity = 0.18 + 0.35 * coreOn;
        const power = uy;
        const flash = seg(p, 0.575, 0.6);
        spill.intensity = power * 1.6 + Math.sin(flash * Math.PI) * 6;
        paintScreen(p);

        const rise = ease(seg(p, 0.62, 0.74));
        shelf.position.set(0, SHELF_Y - 0.7 * (1 - rise), SHELF_Z);
        const op = rise;
        shelfMat.opacity = op;
        edgeMat.opacity = op;
        (strip.material as THREE_NS.MeshBasicMaterial).opacity = op;
        (glow.material as THREE_NS.MeshBasicMaterial).opacity = op * (0.6 + 0.4 * seg(p, 0.8, 0.86));
        shelf.visible = op > 0.001;
        const make = seg(p, 0.7, 0.79);
        parked.forEach((c, j) => {
          (c.material as THREE_NS.Material[])[4].opacity = op;
          c.position.x = SLOTS[j] + (SLOTS[1] - SLOTS[0]) * ease(make);
        });

        const fly = seg(p, 0.6, 0.84);
        shot.visible = fly > 0;
        if (shot.visible) {
          laptop.updateMatrixWorld(true);
          screen.localToWorld(startPos.set(REGION.x * sx + regionW / 2 - SCREEN_W / 2, SCREEN_H / 2 - REGION.y * sx - regionH / 2, 0.02));
          screen.getWorldQuaternion(startQuat);
          shelf.updateMatrixWorld(true);
          shelf.localToWorld(endPos.set(SLOTS[0], 0.04 + cardH / 2, -0.02));
          endQuat.setFromEuler(new THREE.Euler(-0.14, 0, 0));
          const e = ease(fly);
          ctrl.copy(startPos).add(tmp.set(0.4, 1.1, 1.6));
          const u = 1 - e;
          shot.position.set(
            u * u * startPos.x + 2 * u * e * ctrl.x + e * e * endPos.x,
            u * u * startPos.y + 2 * u * e * ctrl.y + e * e * endPos.y,
            u * u * startPos.z + 2 * u * e * ctrl.z + e * e * endPos.z,
          );
          q.slerpQuaternions(startQuat, endQuat, e);
          twist.setFromAxisAngle(yAxis, Math.sin(e * Math.PI) * 0.5);
          shot.quaternion.copy(q).multiply(twist);
          shot.scale.setScalar(1 + (CARD_W / regionW - 1) * e);
          const lift = Math.sin(seg(p, 0.6, 0.66) * Math.PI * 0.5);
          shot.position.addScaledVector(tmp.set(0, 0, 1).applyQuaternion(startQuat), 0.12 * lift * (1 - e));
        }
        overlay(p);
      };

      resize();
      const ro = new ResizeObserver(() => {
        resize();
        dirty = true;
      });
      ro.observe(canvas);

      let target = progress();
      let cur = target;
      let dirty = true;
      let visible = true;
      let raf = 0;
      let last = performance.now();
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !raf) {
          last = performance.now();
          raf = requestAnimationFrame(loop);
        }
      });
      io.observe(el);
      const onScroll = () => {
        target = progress();
      };
      window.addEventListener("scroll", onScroll, { passive: true });

      const loop = (now: number) => {
        raf = 0;
        if (!visible || disposed) return;
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        const prev = cur;
        cur += (target - cur) * (reduce ? 1 : 1 - Math.exp(-dt * 7));
        if (Math.abs(target - cur) < 0.00005) cur = target;
        const live = !reduce;
        if (dirty || live || cur !== prev) {
          apply(cur, now);
          renderer.render(scene, camera);
          dirty = false;
        }
        raf = requestAnimationFrame(loop);
      };
      apply(cur, performance.now());
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);

      stop = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("scroll", onScroll);
        scene.traverse((o) => {
          const mesh = o as THREE_NS.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
          mats.forEach((m) => {
            const map = (m as THREE_NS.MeshBasicMaterial).map;
            if (map) map.dispose();
            m.dispose();
          });
        });
        envTex.dispose();
        pmrem.dispose();
        renderer.dispose();
      };
    })();

    return () => {
      disposed = true;
      stop();
    };
  }, []);

  return (
    <section className="m-film" ref={root} aria-label={t.aria}>
      <div className="m-film-pin">
        <canvas className="m-film-canvas" aria-hidden="true" />
        <div className="m-film-flash" aria-hidden="true" />
        <div className="m-film-title">
          <p className="m-film-brand">Ledge</p>
          <div className="m-film-foot">
            <p className="m-film-cta">
              <a className="btn" href={href}>
                {cta}
              </a>
              <span>{t.free}</span>
            </p>
          <p className="m-film-hint">
            <span>{t.hint}</span>
            <i />
          </p>
          </div>
        </div>
        <div className="m-film-caps">
          {t.captions.map((c) => (
            <p key={c} className="m-film-cap">
              {c}
            </p>
          ))}
        </div>
        <div className="m-film-bar" aria-hidden="true">
          <i />
        </div>
      </div>
    </section>
  );
}

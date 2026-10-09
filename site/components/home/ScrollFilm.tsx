"use client";

import { useEffect, useRef } from "react";
import type * as THREE_NS from "three";
import { SPECTRUM, clamp01, prefersReducedMotion } from "../../lib/motion";

type FilmText = { hint: string; aria: string; captions: string[] };

const WINDOWS: [number, number][] = [
  [0.13, 0.27],
  [0.34, 0.47],
  [0.63, 0.76],
  [0.85, 0.97],
];

const SCREEN_W = 3.18;
const SCREEN_H = 1.99;
const KEY_COLS = 14;
const KEY_ROWS = 6;
const TEX_W = 1600;
const TEX_H = Math.round((TEX_W * SCREEN_H) / SCREEN_W);
const REGION = { x: 820, y: 190, w: 660, h: 470 };
const SHELF_Y = 3.3;
const SHELF_Z = -1.05;
const SLOTS = [-1.2, -0.4, 0.4, 1.2];
const CARD_W = 0.64;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

type Key = { p: number; pos: [number, number, number]; look: [number, number, number] };

const KEYS: Key[] = [
  { p: 0, pos: [4.6, 3.8, 5.6], look: [0, 0.35, 0] },
  { p: 0.12, pos: [3.9, 2.9, 5.0], look: [0, 0.45, -0.1] },
  { p: 0.3, pos: [0.25, 2.0, 5.2], look: [0, 1.0, -0.7] },
  { p: 0.45, pos: [0.32, 1.3, 1.45], look: [0.32, 1.2, -1.4] },
  { p: 0.6, pos: [0.46, 1.26, 1.2], look: [0.46, 1.2, -1.4] },
  { p: 0.72, pos: [0.25, 2.05, 3.0], look: [0.1, 2.8, -0.9] },
  { p: 0.86, pos: [-0.2, 2.85, 3.3], look: [0, 3.35, -1.0] },
  { p: 1, pos: [3.0, 2.7, 7.0], look: [0, 1.75, -0.5] },
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

export function ScrollFilm({ t }: { t: FilmText }) {
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

      const rimBlue = new THREE.PointLight(0x6e95ff, 1.3, 0, 0);
      rimBlue.position.set(-5, 2.5, -4);
      scene.add(rimBlue);
      const rimWarm = new THREE.PointLight(0xffa25a, 1.0, 0, 0);
      rimWarm.position.set(5, 1.8, -3.5);
      scene.add(rimWarm);

      const shell = new THREE.MeshStandardMaterial({ color: 0x2c3038, metalness: 0.82, roughness: 0.42, envMapIntensity: 0.7 });
      const shellEdge = new THREE.MeshStandardMaterial({ color: 0x3a3f49, metalness: 0.95, roughness: 0.18 });
      const black = new THREE.MeshStandardMaterial({ color: 0x07080b, metalness: 0.3, roughness: 0.4 });
      const keyMat = new THREE.MeshStandardMaterial({ color: 0x15171c, metalness: 0.2, roughness: 0.6, emissive: 0x6e95ff, emissiveIntensity: 0 });

      const laptop = new THREE.Group();
      scene.add(laptop);
      const base = new THREE.Mesh(new RoundedBoxGeometry(3.3, 0.075, 2.25, 6, 0.034), shell);
      base.position.y = 0.0375;
      base.castShadow = true;
      base.receiveShadow = true;
      laptop.add(base);
      const lip = new THREE.Mesh(new THREE.BoxGeometry(3.22, 0.004, 0.004), shellEdge);
      lip.position.set(0, 0.073, 1.122);
      laptop.add(lip);

      const well = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.16), black);
      well.rotation.x = -Math.PI / 2;
      well.position.set(0, 0.0752, -0.42);
      laptop.add(well);

      const glowCv = document.createElement("canvas");
      glowCv.width = 512;
      glowCv.height = 208;
      const gcx = glowCv.getContext("2d")!;
      gcx.fillStyle = "#000";
      gcx.fillRect(0, 0, 512, 208);
      for (let r = 0; r < KEY_ROWS; r++) {
        for (let c = 0; c < KEY_COLS; c++) {
          const gx = 8 + c * 35.6;
          const gy = 8 + r * 32.5;
          const kg = gcx.createRadialGradient(gx + 15, gy + 13, 2, gx + 15, gy + 13, 24);
          kg.addColorStop(0, "rgba(140,170,255,0.9)");
          kg.addColorStop(1, "rgba(140,170,255,0)");
          gcx.fillStyle = kg;
          gcx.fillRect(gx - 12, gy - 12, 54, 50);
        }
      }
      const glowTex = new THREE.CanvasTexture(glowCv);
      glowTex.colorSpace = THREE.SRGBColorSpace;
      const backlightMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const backlight = new THREE.Mesh(new THREE.PlaneGeometry(2.86, 1.14), backlightMat);
      backlight.rotation.x = -Math.PI / 2;
      backlight.position.set(0, 0.0756, -0.42);
      laptop.add(backlight);

      const keyGeo = new RoundedBoxGeometry(0.168, 0.022, 0.15, 2, 0.01);
      const keys = new THREE.InstancedMesh(keyGeo, keyMat, KEY_COLS * KEY_ROWS);
      keys.castShadow = true;
      const keyInfo: { x: number; z: number; d: number }[] = [];
      for (let r = 0; r < KEY_ROWS; r++) {
        for (let c = 0; c < KEY_COLS; c++) {
          const x = -1.3 + c * 0.2;
          const z = -0.92 + r * 0.183;
          keyInfo.push({ x, z, d: Math.hypot(x / 1.4, (z + 0.45) / 0.55) / 1.45 });
        }
      }
      const m4 = new THREE.Matrix4();
      let lastRise = -1;
      const setKeys = (open: number, time: number) => {
        const key = Math.round(open * 400);
        if (key === lastRise && (open === 0 || open === 1)) return;
        lastRise = key;
        keyInfo.forEach((ki, n) => {
          const t = clamp01((open - ki.d * 0.55) / 0.45);
          const e = t === 1 ? 1 : 1 - Math.pow(1 - t, 3) * (1 + 2.2 * t);
          m4.makeTranslation(ki.x, 0.0745 - 0.012 + 0.0225 * e, ki.z);
          keys.setMatrixAt(n, m4);
        });
        keys.instanceMatrix.needsUpdate = true;
        void time;
      };
      setKeys(0, 0);
      laptop.add(keys);

      const grilleCv = document.createElement("canvas");
      grilleCv.width = 64;
      grilleCv.height = 512;
      const grc = grilleCv.getContext("2d")!;
      grc.fillStyle = "#2c3038";
      grc.fillRect(0, 0, 64, 512);
      grc.fillStyle = "#0a0b0e";
      for (let y = 6; y < 512; y += 12) for (let x = 8; x < 64; x += 12) { grc.beginPath(); grc.arc(x + ((y / 12) % 2) * 6, y, 2.6, 0, Math.PI * 2); grc.fill(); }
      const grilleTex = new THREE.CanvasTexture(grilleCv);
      grilleTex.colorSpace = THREE.SRGBColorSpace;
      const grilleMat = new THREE.MeshStandardMaterial({ map: grilleTex, metalness: 0.7, roughness: 0.4 });
      [-1.53, 1.53].forEach((gx) => {
        const g = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 1.1), grilleMat);
        g.rotation.x = -Math.PI / 2;
        g.position.set(gx, 0.0752, -0.42);
        laptop.add(g);
      });

      const pad = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.004, 0.82, 3, 0.002), shellEdge);
      pad.position.set(0, 0.0742, 0.6);
      laptop.add(pad);

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
      const hingeLightMat = new THREE.MeshBasicMaterial({ map: specTex, transparent: true, opacity: 0, toneMapped: false });
      const hingeLight = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.006, 0.012), hingeLightMat);
      hingeLight.position.set(0, 0.076, -1.035);
      laptop.add(hingeLight);
      const hingeHaloMat = new THREE.MeshBasicMaterial({ map: specTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const hingeHalo = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 0.22), hingeHaloMat);
      hingeHalo.rotation.x = -Math.PI / 2;
      hingeHalo.position.set(0, 0.0758, -0.98);
      laptop.add(hingeHalo);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.5, 24), shellEdge);
      barrel.rotation.z = Math.PI / 2;
      barrel.position.set(0, 0.06, -1.1);
      laptop.add(barrel);

      const hinge = new THREE.Group();
      hinge.position.set(0, 0.075, -1.1);
      laptop.add(hinge);
      const lid = new THREE.Mesh(new RoundedBoxGeometry(3.3, 2.16, 0.03, 6, 0.014), shell);
      lid.position.set(0, 1.08, -0.017);
      lid.castShadow = true;
      hinge.add(lid);
      const bezel = new THREE.Mesh(new THREE.PlaneGeometry(3.26, 2.12), black);
      bezel.position.set(0, 1.08, -0.0015);
      hinge.add(bezel);

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
      const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), screenMat);
      screen.position.set(0, 1.09, -0.001);
      hinge.add(screen);

      const logoCanvas = document.createElement("canvas");
      logoCanvas.width = 256;
      logoCanvas.height = 256;
      const lg = logoCanvas.getContext("2d")!;
      const lgGrad = lg.createLinearGradient(0, 0, 256, 256);
      SPECTRUM.forEach((c, n) => lgGrad.addColorStop(n / (SPECTRUM.length - 1), c));
      lg.shadowColor = "rgba(110, 149, 255, 0.9)";
      lg.shadowBlur = 24;
      lg.fillStyle = lgGrad;
      roundRect(lg, 40, 40, 176, 176, 46);
      lg.fill();
      lg.shadowBlur = 0;
      lg.fillStyle = "#ffffff";
      roundRect(lg, 72, 102, 112, 16, 8);
      lg.fill();
      roundRect(lg, 72, 134, 80, 16, 8);
      lg.fill();
      const logoTex = new THREE.CanvasTexture(logoCanvas);
      logoTex.colorSpace = THREE.SRGBColorSpace;
      const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.46), new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, toneMapped: false }));
      logo.position.set(0, 1.08, -0.0325);
      logo.rotation.y = Math.PI;
      hinge.add(logo);

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
        const ring = ease(seg(p, 0.17, 0.27));
        const reveal = ease(seg(p, 0.27, 0.34));
        const key = p < 0.17 ? "off" : p < 0.34 ? `boot${Math.round(p * 1500)}` : p < 0.47 || p > 0.61 ? "desk" : String(Math.round(p * 2000));
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
        laptop.rotation.y = -0.5 * (1 - ease(seg(p, 0, 0.3))) + Math.sin(time * 0.0006) * 0.06 * idle;
        laptop.position.y = Math.sin(time * 0.0012) * 0.03 * idle;
        const o = seg(p, 0.1, 0.29);
        const lidEase = o === 1 ? 1 : 1 + 2.4 * Math.pow(o - 1, 3) + 1.4 * Math.pow(o - 1, 2);
        hinge.rotation.x = Math.PI / 2 - (Math.PI / 2 + 0.22) * lidEase;
        const wake = seg(p, 0.08, 0.3);
        setKeys(wake, time);
        const glowOn = ease(seg(p, 0.14, 0.3));
        backlightMat.opacity = glowOn * 0.55;
        keyMat.emissiveIntensity = glowOn * 0.08;
        hingeLightMat.opacity = ease(seg(p, 0.1, 0.18));
        hingeHaloMat.opacity = ease(seg(p, 0.1, 0.2)) * (0.55 + 0.25 * Math.sin(time * 0.003) * idle);
        const power = ease(seg(p, 0.17, 0.3));
        const flash = seg(p, 0.575, 0.6);
        spill.intensity = power * 2.2 + Math.sin(flash * Math.PI) * 6;
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
        const idle = !reduce && cur < 0.14;
        if (dirty || idle || cur !== prev) {
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
        <div className="m-film-title" aria-hidden="true">
          <p className="m-film-brand">Ledge</p>
          <p className="m-film-hint">
            <span>{t.hint}</span>
            <i />
          </p>
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

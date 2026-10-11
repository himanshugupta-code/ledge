"use client";

import { useEffect, useRef, useState } from "react";
import type * as THREE_NS from "three";
import { asset } from "../../lib/site";
import { clamp01, prefersReducedMotion, SPECTRUM } from "../../lib/motion";
import { artFor, type PostLite } from "../../lib/postArt";
import { ART_H, ART_W, drawPostArt } from "./drawArt";

export type CityText = {
  start: string;
  walking: string;
  driving: string;
  enterCar: string;
  exitCar: string;
  read: string;
  leave: string;
  move: string;
  car: string;
  open: string;
};

type Box = { x0: number; z0: number; x1: number; z1: number };
type Pad = { slug: string; title: string; accent: string; x: number; z: number; ring: THREE_NS.Mesh; beam: THREE_NS.Mesh };

const PITCH = 36;
const BLOCK = 26;
const EDGE = 62;
const ROADS = [-54, -18, 18, 54];

const KEYMAP: Record<string, string> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ShiftLeft: "run",
  ShiftRight: "run",
};

function windowsTexture(THREE: typeof THREE_NS, seed: number, cols: number, rows: number) {
  const c = document.createElement("canvas");
  c.width = cols * 16;
  c.height = rows * 16;
  const g = c.getContext("2d")!;
  g.fillStyle = "#151a26";
  g.fillRect(0, 0, c.width, c.height);
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const v = rnd();
      g.fillStyle = v > 0.62 ? (v > 0.9 ? "#ffd9a0" : "#ffe8bd") : v > 0.5 ? "#7aa2ff" : "#0c0f17";
      g.fillRect(x * 16 + 4, y * 16 + 4, 8, 9);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  return t;
}

function glowTexture(THREE: typeof THREE_NS, color: string) {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d")!;
  const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, color);
  rg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = rg;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function beamTexture(THREE: typeof THREE_NS) {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 128;
  const g = c.getContext("2d")!;
  const lg = g.createLinearGradient(0, 0, 0, 128);
  lg.addColorStop(0, "rgba(255,255,255,0)");
  lg.addColorStop(1, "rgba(255,255,255,0.9)");
  g.fillStyle = lg;
  g.fillRect(0, 0, 4, 128);
  return new THREE.CanvasTexture(c);
}

export function BlogCity({ posts, title, lead, t }: { posts: PostLite[]; title: string; lead: string; t: CityText }) {
  const root = useRef<HTMLElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"walk" | "drive">("walk");
  const [prompt, setPrompt] = useState<{ kind: "read" | "enter" | "exit"; title?: string } | null>(null);
  const [speed, setSpeed] = useState(0);
  const api = useRef<{ start: () => void; stop: () => void; press: (k: string, down: boolean) => void } | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const canvas = el.querySelector<HTMLCanvasElement>(".c-canvas")!;
    const mini = el.querySelector<HTMLCanvasElement>(".c-mini")!;
    const reduce = prefersReducedMotion();
    let disposed = false;
    let stop = () => {};

    (async () => {
      const THREE = await import("three");
      const { RoundedBoxGeometry } = await import("three/examples/jsm/geometries/RoundedBoxGeometry.js");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const kit = await new GLTFLoader()
        .loadAsync(asset("/city/city-kit.glb"))
        .then((g) => g.scene)
        .catch(() => null);
      if (disposed) return;
      let renderer: THREE_NS.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
      } catch {
        el.classList.add("no-gl");
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      const font = getComputedStyle(document.body).fontFamily;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(kit ? 0x1c212b : 0x0a0e1c);
      scene.fog = kit ? new THREE.FogExp2(0x1c212b, 0.0045) : new THREE.FogExp2(0x0d1224, 0.011);
      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
      scene.add(kit ? new THREE.HemisphereLight(0xdfe7ff, 0x30333c, 1.3) : new THREE.HemisphereLight(0x7d93d6, 0x0b0d16, 0.9));
      const moon = kit ? new THREE.DirectionalLight(0xfff0dc, 2.6) : new THREE.DirectionalLight(0xb7c6ff, 1.1);
      moon.position.set(30, 60, 20);
      if (kit) {
        const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environmentIntensity = 0.45;
        pmrem.dispose();
      }
      moon.castShadow = true;
      moon.shadow.mapSize.set(1024, 1024);
      Object.assign(moon.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 140 });
      moon.shadow.bias = -0.0008;
      scene.add(moon, moon.target);

      kit?.traverse((o) => {
        const m = o as THREE_NS.Mesh;
        if (!m.isMesh) return;
        m.castShadow = true;
        m.receiveShadow = true;
        const mat = m.material as THREE_NS.MeshStandardMaterial;
        if (mat.map) mat.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
      });
      const piece = (name: string) => {
        const src = kit?.getObjectByName(name);
        if (!src) return null;
        const o = src.clone(true);
        o.position.set(0, 0, 0);
        o.rotation.set(0, 0, 0);
        return o;
      };
      const tint = (o: THREE_NS.Object3D, name: string, mat: THREE_NS.Material) =>
        o.traverse((c) => {
          const m = c as THREE_NS.Mesh;
          if (m.isMesh && (m.material as THREE_NS.Material).name === name) m.material = mat;
        });
      const instanced = (name: string, mats: THREE_NS.Matrix4[], shadow: boolean) => {
        const src = piece(name);
        if (!src || !mats.length) return false;
        src.updateMatrixWorld(true);
        src.traverse((c) => {
          const m = c as THREE_NS.Mesh;
          if (!m.isMesh) return;
          const im = new THREE.InstancedMesh(m.geometry, m.material, mats.length);
          mats.forEach((mt, k) => im.setMatrixAt(k, new THREE.Matrix4().multiplyMatrices(mt, m.matrixWorld)));
          im.castShadow = shadow;
          im.receiveShadow = true;
          scene.add(im);
        });
        return true;
      };

      const boxes: Box[] = [];
      const addBox = (x: number, z: number, w: number, d: number) => boxes.push({ x0: x - w / 2, z0: z - d / 2, x1: x + w / 2, z1: z + d / 2 });

      const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: kit ? 0x2a2d34 : 0x141824, roughness: 0.9 }));
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      const plateMat = new THREE.MeshStandardMaterial({ color: kit ? 0x6b6f7a : 0x232838, roughness: 0.85 });
      const curbMat = new THREE.MeshStandardMaterial({ color: kit ? 0x8a8f9a : 0x3a4157, roughness: 0.6 });
      const blocks: [number, number][] = [];
      for (let bz = -1; bz <= 1; bz++) for (let bx = -1; bx <= 1; bx++) blocks.push([bx * PITCH, bz * PITCH]);
      const ring: [number, number][] = [];
      if (kit) for (let bz = -2; bz <= 2; bz++) for (let bx = -2; bx <= 2; bx++) if (Math.max(Math.abs(bx), Math.abs(bz)) === 2) ring.push([bx * PITCH, bz * PITCH]);
      const placed = new Map<string, THREE_NS.Matrix4[]>();
      const place = (name: string, x: number, z: number, rot: number, w: number, d: number, solid = true) => {
        if (!placed.has(name)) placed.set(name, []);
        placed.get(name)!.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0.24, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot), new THREE.Vector3(1, 1, 1)));
        if (!solid) return;
        const c = Math.abs(Math.cos(rot));
        const sn = Math.abs(Math.sin(rot));
        addBox(x, z, c * w + sn * d, sn * w + c * d);
      };
      [...blocks, ...ring].forEach(([x, z]) => {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(BLOCK, 0.24, BLOCK), plateMat);
        plate.position.set(x, 0.12, z);
        plate.receiveShadow = true;
        scene.add(plate);
        const curb = new THREE.Mesh(new THREE.BoxGeometry(BLOCK + 0.6, 0.18, BLOCK + 0.6), curbMat);
        curb.position.set(x, 0.09, z);
        scene.add(curb);
      });

      const dash = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.3, 2.2), new THREE.MeshBasicMaterial({ color: 0xc9d2ee }), 400);
      const m4 = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const flat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
      const flatX = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, Math.PI / 2));
      const one = new THREE.Vector3(1, 1, 1);
      let di = 0;
      ROADS.forEach((r) => {
        for (let s = -EDGE + 2; s < EDGE; s += 5) {
          if (ROADS.some((o) => Math.abs(s - o) < 7)) continue;
          if (di < 400) dash.setMatrixAt(di++, m4.compose(new THREE.Vector3(r, 0.02, s), flat, one));
          if (di < 400) dash.setMatrixAt(di++, m4.compose(new THREE.Vector3(s, 0.02, r), flatX, one));
        }
      });
      dash.count = di;
      scene.add(dash);

      const lampPole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.12, 5, 6), new THREE.MeshStandardMaterial({ color: 0x2c3244, metalness: 0.6, roughness: 0.4 }), 220);
      const lampPos: number[] = [];
      const lampMats: THREE_NS.Matrix4[] = [];
      const lo = kit ? 5.2 : 6.6;
      let li = 0;
      ROADS.forEach((r) => {
        for (let s = -EDGE + 6; s < EDGE; s += 12) {
          if (ROADS.some((o) => Math.abs(s - o) < 8)) continue;
          [
            [r + lo, s],
            [r - lo, s],
            [s, r + lo],
            [s, r - lo],
          ].forEach(([x, z]) => {
            if (Math.abs(x) > EDGE || Math.abs(z) > EDGE || li >= 220) return;
            lampPole.setMatrixAt(li++, m4.compose(new THREE.Vector3(x, 2.5, z), q.identity(), one));
            lampMats.push(new THREE.Matrix4().makeTranslation(x, 0, z));
            lampPos.push(x, kit ? 4.85 : 5.1, z);
          });
        }
      });
      lampPole.count = li;
      if (!instanced("Lamp", lampMats, false)) scene.add(lampPole);
      const lampGeo = new THREE.BufferGeometry();
      lampGeo.setAttribute("position", new THREE.Float32BufferAttribute(lampPos, 3));
      scene.add(new THREE.Points(lampGeo, new THREE.PointsMaterial({ map: glowTexture(THREE, "rgba(255,222,170,1)"), size: 2.6, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
      const poolGeo = new THREE.InstancedMesh(new THREE.CircleGeometry(3.2, 20), new THREE.MeshBasicMaterial({ map: glowTexture(THREE, "rgba(255,210,150,0.28)"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), li);
      for (let k = 0; k < li; k++) poolGeo.setMatrixAt(k, m4.compose(new THREE.Vector3(lampPos[k * 3], 0.03, lampPos[k * 3 + 2]), flat, one));
      scene.add(poolGeo);

      const roof = new THREE.MeshStandardMaterial({ color: 0x1b2030, roughness: 0.8 });
      const building = (x: number, z: number, w: number, d: number, h: number, seed: number) => {
        const tex = windowsTexture(THREE, seed, Math.max(2, Math.round(w / 1.6)), Math.max(3, Math.round(h / 2.2)));
        const side = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.85, roughness: 0.7, metalness: 0.2 });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, roof, roof, side, side]);
        mesh.position.set(x, h / 2 + 0.24, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        addBox(x, z, w, d);
        return mesh;
      };

      const pads: Pad[] = [];
      const beamTex = beamTexture(THREE);
      const landmarkBlocks = blocks.filter(([x, z]) => !(x === 0 && z === 0) && !(x === 0 && z === PITCH));
      posts.slice(0, landmarkBlocks.length).forEach((post, i) => {
        const [bx, bz] = landmarkBlocks[i];
        const accent = artFor(post.slug).accent;
        const dir = Math.abs(bz) >= Math.abs(bx) && bz !== 0 ? new THREE.Vector2(0, -Math.sign(bz)) : new THREE.Vector2(-Math.sign(bx), 0);
        const perp = new THREE.Vector2(-dir.y, dir.x);
        const h = 24 + ((i * 7) % 4) * 4;
        const cx = bx + dir.x * 3;
        const cz = bz + dir.y * 3;
        const neon = new THREE.MeshBasicMaterial({ color: accent, toneMapped: false });
        const tw = piece(["L_Glass", "L_Round", "L_Deco", "L_Spire", "L_Grid"][i % 5]);
        if (tw) {
          tw.position.set(cx, 0.24, cz);
          tw.rotation.y = (i % 4) * (Math.PI / 2);
          tint(tw, "Accent", neon);
          scene.add(tw);
          addBox(cx, cz, 13, 13);
        } else {
          building(cx, cz, 13, 13, h, i * 17 + 3);
          [-1, 1].forEach((sx) =>
            [-1, 1].forEach((sz) => {
              const strip = new THREE.Mesh(new THREE.BoxGeometry(0.25, h, 0.25), neon);
              strip.position.set(cx + sx * 6.55, h / 2 + 0.24, cz + sz * 6.55);
              scene.add(strip);
            }),
          );
          const crown = new THREE.Mesh(new THREE.BoxGeometry(13.6, 0.4, 13.6), neon);
          crown.position.set(cx, h + 0.44, cz);
          scene.add(crown);
        }

        const art = document.createElement("canvas");
        art.width = ART_W;
        art.height = ART_H;
        drawPostArt(art.getContext("2d")!, post.slug, font, post.title);
        const tex = new THREE.CanvasTexture(art);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const bw = 11;
        const bh = (bw * ART_H) / ART_W;
        const board = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
        const face = new THREE.Vector3(cx + dir.x * 6.62, Math.min(h - bh / 2 - 1.5, 13), cz + dir.y * 6.62);
        board.position.copy(face);
        board.lookAt(face.x + dir.x, face.y, face.z + dir.y);
        scene.add(board);
        const frame = new THREE.Mesh(new THREE.PlaneGeometry(bw + 0.6, bh + 0.6), neon);
        frame.position.copy(face).add(new THREE.Vector3(-dir.x * 0.02, 0, -dir.y * 0.02));
        frame.quaternion.copy(board.quaternion);
        scene.add(frame);

        if (kit) {
          const rot = Math.atan2(-perp.y, perp.x);
          const backs = ["B_Brick", "B_White", "B_Shops", "B_Stone", "B_Office", "B_Curve", "B_Build", "B_Cream"];
          const sides = ["S_Resi", "S_Glass", "S_Brick", "S_Stone", "S_Salmon"];
          [-1, 1].forEach((s) => {
            place(backs[(i * 2 + (s + 1) / 2) % backs.length], bx - dir.x * 8.25 + perp.x * s * 6.5, bz - dir.y * 8.25 + perp.y * s * 6.5, rot, 11, 8);
            place(sides[(i * 2 + (s + 1) / 2) % sides.length], bx + dir.x * 3 + perp.x * s * 9.6, bz + dir.y * 3 + perp.y * s * 9.6, rot, 6, 12);
          });
        } else {
          [-1, 1].forEach((s) => building(bx - dir.x * 8 + perp.x * s * 6.5, bz - dir.y * 8 + perp.y * s * 6.5, 8, 7, 8 + ((i + s + 3) % 4) * 3.5, i * 31 + s * 7 + 11));
        }

        const px = bx + dir.x * 18;
        const pz = bz + dir.y * 18;
        const ring = new THREE.Mesh(new THREE.RingGeometry(3, 3.8, 48), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.85, toneMapped: false, side: THREE.DoubleSide }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(px, 0.05, pz);
        scene.add(ring);
        const beam = new THREE.Mesh(
          new THREE.CylinderGeometry(3.4, 3.4, 16, 32, 1, true),
          new THREE.MeshBasicMaterial({ map: beamTex, color: accent, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
        );
        beam.position.set(px, 8, pz);
        scene.add(beam);
        pads.push({ slug: post.slug, title: post.title, accent, x: px, z: pz, ring, beam });
      });

      const skies = ["K_Slab", "K_Round", "K_Deco", "K_Spire", "K_Grid", "K_Twin", "K_Cream"];
      const fills = ["B_Brick", "B_Stone", "B_Cream", "B_White", "B_Curve", "B_Shops", "B_Office"];
      ring.forEach(([x, z], k) => {
        if (k % 3 !== 1) place(skies[(k * 3) % skies.length], x, z, (k % 4) * (Math.PI / 2), 20, 20, false);
        else
          [-1, 1].forEach((sx) =>
            [-1, 1].forEach((sz) => place(fills[(k + sx + sz * 2 + 7) % fills.length], x + sx * 6.5, z + sz * 8.25, sz > 0 ? Math.PI : 0, 11, 8, false)),
          );
      });
      placed.forEach((mats, name) => instanced(name, mats, true));

      const fountain = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5, 0.9, 40), new THREE.MeshStandardMaterial({ color: 0x3a4157, roughness: 0.5 }));
      fountain.position.set(0, 0.69, 0);
      fountain.castShadow = true;
      scene.add(fountain);
      const water = new THREE.Mesh(new THREE.CircleGeometry(4.1, 40), new THREE.MeshBasicMaterial({ color: 0x2d6bff, transparent: true, opacity: 0.7, toneMapped: false }));
      water.rotation.x = -Math.PI / 2;
      water.position.set(0, 1.15, 0);
      scene.add(water);
      const spec = new THREE.Group();
      SPECTRUM.forEach((c, k) => {
        const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 3.2, 8), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.8, toneMapped: false }));
        const a = (k / SPECTRUM.length) * Math.PI * 2;
        jet.position.set(Math.cos(a) * 2.2, 2.6, Math.sin(a) * 2.2);
        spec.add(jet);
      });
      scene.add(spec);
      boxes.push({ x0: -5, z0: -5, x1: 5, z1: 5 });

      const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.3, 1.6, 6), new THREE.MeshStandardMaterial({ color: 0x3b2c22 }), 40);
      const crownT = new THREE.InstancedMesh(new THREE.ConeGeometry(1.6, 4, 8), new THREE.MeshStandardMaterial({ color: 0x1f5c47, roughness: 0.8, emissive: 0x0a2a1f, emissiveIntensity: 0.6 }), 40);
      let ti = 0;
      const treeMats: THREE_NS.Matrix4[] = [];
      for (let gx = -2; gx <= 2; gx++) {
        for (let gz = -2; gz <= 2; gz++) {
          if (Math.abs(gx) + Math.abs(gz) === 0) continue;
          const x = gx * 4.6 + ((gz * 37) % 3) * 0.4;
          const z = PITCH + gz * 4.6;
          trunk.setMatrixAt(ti, m4.compose(new THREE.Vector3(x, 1.04, z), q.identity(), one));
          const ts = 0.8 + ((gx * 3 + gz * 5 + 20) % 5) * 0.1;
          treeMats.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0.24, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), gx * 1.3 + gz * 0.7), new THREE.Vector3(ts, ts, ts)));
          crownT.setMatrixAt(ti, m4.compose(new THREE.Vector3(x, 3.6, z), q.identity(), new THREE.Vector3(1, 0.8 + ((gx + gz + 6) % 3) * 0.2, 1)));
          addBox(x, z, 0.8, 0.8);
          ti++;
        }
      }
      trunk.count = ti;
      crownT.count = ti;
      crownT.castShadow = true;
      if (!instanced("Tree", treeMats, true)) scene.add(trunk, crownT);

      const stars = new THREE.BufferGeometry();
      const sp: number[] = [];
      for (let k = 0; k < 600; k++) {
        const a = Math.random() * Math.PI * 2;
        const e = 0.15 + Math.random() * 1.2;
        sp.push(Math.cos(a) * Math.cos(e) * 180, Math.sin(e) * 180, Math.sin(a) * Math.cos(e) * 180);
      }
      stars.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
      scene.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: 0xcdd6ff, size: 0.7, fog: false, transparent: true, opacity: 0.8 })));

      const car = new THREE.Group();
      const kitCar = piece("Car");
      let chassis: THREE_NS.Object3D;
      let wheels: { pivot: THREE_NS.Object3D; w: THREE_NS.Object3D; front: boolean }[];
      if (kitCar) {
        chassis = kitCar.getObjectByName("Car_Body")!;
        car.add(chassis);
        wheels = ["Wheel_FL", "Wheel_FR", "Wheel_BL", "Wheel_BR"].map((n) => {
          const w = kitCar.getObjectByName(n)!;
          const pivot = new THREE.Group();
          pivot.position.copy(w.position);
          w.position.set(0, 0, 0);
          pivot.add(w);
          car.add(pivot);
          return { pivot, w, front: n[6] === "F" };
        });
      } else {
        const carBody = new THREE.MeshStandardMaterial({ color: 0x2d6bff, metalness: 0.7, roughness: 0.3 });
        const glass = new THREE.MeshStandardMaterial({ color: 0x0b0e18, metalness: 0.9, roughness: 0.1 });
        const tire = new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.8 });
        chassis = new THREE.Mesh(new RoundedBoxGeometry(2.2, 0.7, 4.4, 3, 0.18), carBody);
        chassis.position.y = 0.75;
        chassis.castShadow = true;
        car.add(chassis);
        const cabin = new THREE.Mesh(new RoundedBoxGeometry(1.9, 0.62, 2.3, 3, 0.2), glass);
        cabin.position.set(0, 1.35, -0.2);
        cabin.castShadow = true;
        car.add(cabin);
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.08, 4.42), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
        stripe.position.y = 0.8;
        car.add(stripe);
        wheels = [
          [-1.05, 1.35],
          [1.05, 1.35],
          [-1.05, -1.35],
          [1.05, -1.35],
        ].map(([x, z]) => {
          const pivot = new THREE.Group();
          pivot.position.set(x, 0.42, z);
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.34, 18), tire);
          w.rotation.z = Math.PI / 2;
          pivot.add(w);
          car.add(pivot);
          return { pivot, w, front: z > 0 };
        });
        const headMat = new THREE.MeshBasicMaterial({ color: 0xfff3d6, toneMapped: false });
        const tailMat = new THREE.MeshBasicMaterial({ color: 0xff3b4a, toneMapped: false });
        [-0.7, 0.7].forEach((x) => {
          const hl = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.16, 0.06), headMat);
          hl.position.set(x, 0.8, 2.21);
          car.add(hl);
          const tl = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.06), tailMat);
          tl.position.set(x, 0.8, -2.21);
          car.add(tl);
        });
      }
      const beamLight = new THREE.SpotLight(0xfff1d0, 0, 40, 0.5, 0.6, 1);
      beamLight.position.set(0, 1, 2);
      beamLight.target.position.set(0, 0, 12);
      car.add(beamLight, beamLight.target);
      car.position.set(6, 0, 16);
      car.rotation.y = Math.PI / 2;
      scene.add(car);

      const person = new THREE.Group();
      const kitPerson = piece("Person");
      let legs: THREE_NS.Object3D[];
      let arms: THREE_NS.Object3D[];
      if (kitPerson) {
        person.add(kitPerson);
        legs = ["Leg_L", "Leg_R"].map((n) => kitPerson.getObjectByName(n)!);
        arms = ["Arm_L", "Arm_R"].map((n) => kitPerson.getObjectByName(n)!);
      } else {
        const skin = new THREE.MeshStandardMaterial({ color: 0xeef0f6, roughness: 0.5 });
        const shirt = new THREE.MeshStandardMaterial({ color: 0xff9a3c, roughness: 0.6 });
        const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.55, 6, 12), shirt);
        torso.position.y = 1.25;
        torso.castShadow = true;
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 12), skin);
        head.position.y = 1.95;
        head.castShadow = true;
        legs = [-0.15, 0.15].map((x) => {
          const pivot = new THREE.Group();
          pivot.position.set(x, 0.85, 0);
          const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.55, 4, 8), new THREE.MeshStandardMaterial({ color: 0x1f2a4a }));
          leg.position.y = -0.4;
          leg.castShadow = true;
          pivot.add(leg);
          person.add(pivot);
          return pivot;
        });
        arms = [-0.45, 0.45].map((x) => {
          const pivot = new THREE.Group();
          pivot.position.set(x, 1.5, 0);
          const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.5, 4, 8), shirt);
          arm.position.y = -0.35;
          pivot.add(arm);
          person.add(pivot);
          return pivot;
        });
        person.add(torso, head);
      }
      person.position.set(0, 0.24, 11);
      scene.add(person);

      const keys = new Set<string>();
      const state = {
        mode: "walk" as "walk" | "drive",
        heading: Math.PI,
        carHeading: Math.PI / 2,
        speed: 0,
        steer: 0,
        stride: 0,
        playing: false,
        intro: 0,
      };

      const collide = (pos: THREE_NS.Vector3, r: number) => {
        let hit = false;
        for (const b of boxes) {
          const cx = Math.max(b.x0, Math.min(pos.x, b.x1));
          const cz = Math.max(b.z0, Math.min(pos.z, b.z1));
          const dx = pos.x - cx;
          const dz = pos.z - cz;
          const d2 = dx * dx + dz * dz;
          if (d2 < r * r) {
            hit = true;
            if (d2 > 1e-6) {
              const d = Math.sqrt(d2);
              pos.x = cx + (dx / d) * r;
              pos.z = cz + (dz / d) * r;
            } else {
              const ex = Math.min(pos.x - b.x0, b.x1 - pos.x);
              const ez = Math.min(pos.z - b.z0, b.z1 - pos.z);
              if (ex < ez) pos.x = pos.x - b.x0 < b.x1 - pos.x ? b.x0 - r : b.x1 + r;
              else pos.z = pos.z - b.z0 < b.z1 - pos.z ? b.z0 - r : b.z1 + r;
            }
          }
        }
        pos.x = Math.max(-EDGE, Math.min(EDGE, pos.x));
        pos.z = Math.max(-EDGE, Math.min(EDGE, pos.z));
        return hit;
      };

      const actor = () => (state.mode === "drive" ? car : person);
      let currentPad: Pad | null = null;
      let nearCar = false;
      let lastPrompt = "";
      const updatePrompt = () => {
        const key = currentPad ? `r${currentPad.slug}` : state.mode === "drive" ? "x" : nearCar ? "e" : "";
        if (key === lastPrompt) return;
        lastPrompt = key;
        if (currentPad) setPrompt({ kind: "read", title: currentPad.title });
        else if (state.mode === "drive") setPrompt({ kind: "exit" });
        else if (nearCar) setPrompt({ kind: "enter" });
        else setPrompt(null);
      };

      const toggleCar = () => {
        if (state.mode === "walk" && nearCar) {
          state.mode = "drive";
          person.visible = false;
          state.speed = 0;
          beamLight.intensity = 60;
          setMode("drive");
        } else if (state.mode === "drive" && Math.abs(state.speed) < 4) {
          state.mode = "walk";
          const side = new THREE.Vector3(Math.cos(state.carHeading), 0, -Math.sin(state.carHeading)).multiplyScalar(-2.4);
          person.position.set(car.position.x + side.x, 0.24, car.position.z + side.z);
          collide(person.position, 0.5);
          state.heading = state.carHeading;
          person.visible = true;
          state.speed = 0;
          beamLight.intensity = 0;
          setMode("walk");
        }
      };

      const go = () => {
        if (currentPad) window.location.assign(asset(`/en/blog/${currentPad.slug}/`));
      };

      const onKey = (e: KeyboardEvent, down: boolean) => {
        if (!state.playing) return;
        const k = KEYMAP[e.code];
        if (k) {
          e.preventDefault();
          if (down) keys.add(k);
          else keys.delete(k);
          return;
        }
        if (!down) return;
        if (e.code === "Enter" || e.code === "Space") {
          e.preventDefault();
          go();
        } else if (e.code === "KeyE" || e.code === "KeyF") {
          e.preventDefault();
          toggleCar();
        } else if (e.code === "Escape") {
          api.current?.stop();
        }
      };
      const kd = (e: KeyboardEvent) => onKey(e, true);
      const ku = (e: KeyboardEvent) => onKey(e, false);
      window.addEventListener("keydown", kd);
      window.addEventListener("keyup", ku);

      api.current = {
        start: () => {
          state.playing = true;
          state.intro = reduce ? 1 : 0;
          setPlaying(true);
          canvas.focus({ preventScroll: true });
        },
        stop: () => {
          state.playing = false;
          keys.clear();
          setPlaying(false);
        },
        press: (k, down) => {
          if (k === "enter" && down) go();
          else if (k === "car" && down) toggleCar();
          else if (down) keys.add(k);
          else keys.delete(k);
        },
      };

      const resize = () => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);

      const mctx = mini.getContext("2d")!;
      const MS = mini.width;
      const toMap = (v: number) => ((v + EDGE + 4) / ((EDGE + 4) * 2)) * MS;
      const drawMini = () => {
        mctx.clearRect(0, 0, MS, MS);
        mctx.fillStyle = "rgba(10, 14, 28, 0.82)";
        mctx.fillRect(0, 0, MS, MS);
        mctx.fillStyle = "#3a4157";
        ROADS.forEach((r) => {
          mctx.fillRect(toMap(r - 5), toMap(-EDGE), toMap(r + 5) - toMap(r - 5), toMap(EDGE) - toMap(-EDGE));
          mctx.fillRect(toMap(-EDGE), toMap(r - 5), toMap(EDGE) - toMap(-EDGE), toMap(r + 5) - toMap(r - 5));
        });
        mctx.fillStyle = "#1c2132";
        blocks.forEach(([x, z]) => mctx.fillRect(toMap(x - BLOCK / 2), toMap(z - BLOCK / 2), toMap(x + BLOCK / 2) - toMap(x - BLOCK / 2), toMap(z + BLOCK / 2) - toMap(z - BLOCK / 2)));
        pads.forEach((p) => {
          mctx.fillStyle = p.accent;
          mctx.beginPath();
          mctx.arc(toMap(p.x), toMap(p.z), currentPad === p ? 6 : 4, 0, Math.PI * 2);
          mctx.fill();
        });
        if (state.mode === "walk") {
          mctx.fillStyle = "#2d6bff";
          mctx.fillRect(toMap(car.position.x) - 3, toMap(car.position.z) - 3, 6, 6);
        }
        const a = actor().position;
        const hd = state.mode === "drive" ? state.carHeading : state.heading;
        mctx.save();
        mctx.translate(toMap(a.x), toMap(a.z));
        mctx.rotate(-hd + Math.PI);
        mctx.fillStyle = "#ffffff";
        mctx.beginPath();
        mctx.moveTo(0, -7);
        mctx.lineTo(5, 5);
        mctx.lineTo(-5, 5);
        mctx.closePath();
        mctx.fill();
        mctx.restore();
      };

      const camPos = new THREE.Vector3(70, 60, 70);
      const camLook = new THREE.Vector3();
      const wantPos = new THREE.Vector3();
      const wantLook = new THREE.Vector3();
      let visible = true;
      let raf = 0;
      let last = performance.now();
      let lastSpeed = -1;
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (!visible && state.playing) api.current?.stop();
        if (visible && !raf) {
          last = performance.now();
          raf = requestAnimationFrame(loop);
        }
      });
      io.observe(el);

      const loop = (now: number) => {
        raf = 0;
        if (!visible || disposed) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const time = now / 1000;
        const up = keys.has("up") ? 1 : 0;
        const down = keys.has("down") ? 1 : 0;
        const turn = (keys.has("left") ? 1 : 0) - (keys.has("right") ? 1 : 0);

        if (state.playing) {
          if (state.mode === "walk") {
            const run = keys.has("run") ? 1.8 : 1;
            state.heading += turn * 2.6 * dt;
            const v = (up - down * 0.6) * 5.2 * run;
            person.position.x += Math.sin(state.heading) * v * dt;
            person.position.z += Math.cos(state.heading) * v * dt;
            collide(person.position, 0.5);
            person.rotation.y = state.heading;
            state.stride += Math.abs(v) * dt * 1.6;
            const swing = Math.abs(v) > 0.1 ? Math.sin(state.stride * 2.4) * 0.7 : 0;
            legs[0].rotation.x = swing;
            legs[1].rotation.x = -swing;
            arms[0].rotation.x = -swing * 0.8;
            arms[1].rotation.x = swing * 0.8;
            person.position.y = 0.24 + Math.abs(Math.sin(state.stride * 2.4)) * 0.06 * (Math.abs(v) > 0.1 ? 1 : 0);
          } else {
            const accel = up ? 16 : down ? -20 : 0;
            state.speed += accel * dt;
            if (!up && !down) state.speed *= Math.pow(0.35, dt);
            state.speed = Math.max(-8, Math.min(26, state.speed));
            state.steer += (turn * 0.55 - state.steer) * Math.min(1, dt * 8);
            state.carHeading += state.steer * state.speed * dt * 0.18;
            car.position.x += Math.sin(state.carHeading) * state.speed * dt;
            car.position.z += Math.cos(state.carHeading) * state.speed * dt;
            if (collide(car.position, 1.9)) state.speed *= -0.25;
          }
        }
        car.rotation.y = state.carHeading;
        wheels.forEach((w) => {
          w.w.rotation.x += (state.mode === "drive" ? state.speed : 0) * dt * 2.4;
          if (w.front) w.pivot.rotation.y = state.mode === "drive" ? state.steer : 0;
        });
        chassis.rotation.z = -state.steer * Math.min(1, Math.abs(state.speed) / 20) * 0.08;

        const a = actor().position;
        currentPad = null;
        for (const p of pads) {
          const d = Math.hypot(a.x - p.x, a.z - p.z);
          if (d < 4.2) currentPad = p;
          const near = clamp01(1 - (d - 4) / 30);
          (p.beam.material as THREE_NS.MeshBasicMaterial).opacity = 0.18 + 0.3 * near + (currentPad === p ? 0.25 : 0);
          p.ring.scale.setScalar(1 + Math.sin(time * 3 + p.x) * 0.04 + (currentPad === p ? 0.12 : 0));
        }
        nearCar = state.mode === "walk" && person.position.distanceTo(new THREE.Vector3(car.position.x, 0.24, car.position.z)) < 3.6;
        updatePrompt();
        spec.rotation.y = time * 0.6;
        spec.children.forEach((j, k) => (j.scale.y = 0.8 + Math.sin(time * 4 + k) * 0.25));

        moon.position.set(a.x + 30, 60, a.z + 20);
        moon.target.position.set(a.x, 0, a.z);

        if (state.playing || state.intro > 0) {
          const hd = state.mode === "drive" ? state.carHeading : state.heading;
          const dist = state.mode === "drive" ? 11 + Math.abs(state.speed) * 0.12 : 6.5;
          const hgt = state.mode === "drive" ? 5 : 3.4;
          wantPos.set(a.x - Math.sin(hd) * dist, hgt, a.z - Math.cos(hd) * dist);
          wantLook.set(a.x + Math.sin(hd) * 3, 1.4, a.z + Math.cos(hd) * 3);
          if (state.playing && state.intro < 1) state.intro = Math.min(1, state.intro + dt / 1.8);
          const k = state.intro < 1 ? 0.04 + 0.1 * state.intro : 1 - Math.pow(0.0015, dt);
          camPos.lerp(wantPos, k);
          camLook.lerp(wantLook, k);
        } else {
          const ang = time * 0.06;
          camPos.set(Math.cos(ang) * 78, 46, Math.sin(ang) * 78);
          camLook.set(0, 4, 0);
        }
        camera.position.copy(camPos);
        camera.lookAt(camLook);
        renderer.render(scene, camera);
        drawMini();
        const sp = Math.round(Math.abs(state.speed) * 3.6);
        if (sp !== lastSpeed) {
          lastSpeed = sp;
          setSpeed(sp);
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      setReady(true);

      stop = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("keydown", kd);
        window.removeEventListener("keyup", ku);
        scene.traverse((o) => {
          const m = o as THREE_NS.Mesh;
          m.geometry?.dispose();
          const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
          mats.forEach((mat) => {
            (mat as THREE_NS.MeshBasicMaterial).map?.dispose();
            mat.dispose();
          });
        });
        renderer.dispose();
        api.current = null;
      };
    })();

    return () => {
      disposed = true;
      stop();
    };
  }, [posts]);

  const hold = (k: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      api.current?.press(k, true);
    },
    onPointerUp: () => api.current?.press(k, false),
    onPointerLeave: () => api.current?.press(k, false),
    onPointerCancel: () => api.current?.press(k, false),
  });

  return (
    <section className={`c-city${playing ? " playing" : ""}${ready ? " ready" : ""}`} ref={root}>
      <canvas className="c-canvas" tabIndex={-1} aria-label={t.start} />
      <div className="c-intro" aria-hidden={playing}>
        <h1>{title}</h1>
        <p>{lead}</p>
        <button type="button" className="btn c-start" onClick={() => api.current?.start()} disabled={!ready}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M6 4.5v11l9-5.5z" fill="currentColor" />
          </svg>
          {t.start}
        </button>
      </div>
      <div className="c-hud" aria-live="polite">
        <p className="c-mode">
          <i className={mode} aria-hidden="true" />
          {mode === "drive" ? t.driving : t.walking}
          {mode === "drive" && <b>{speed} km/h</b>}
        </p>
        <canvas className="c-mini" width={150} height={150} aria-hidden="true" />
        {prompt && (
          <p className={`c-prompt c-prompt-${prompt.kind}`}>
            <kbd>{prompt.kind === "read" ? "Enter" : "E"}</kbd>
            <span>
              {prompt.kind === "read" ? t.read : prompt.kind === "enter" ? t.enterCar : t.exitCar}
              {prompt.title && <b>{prompt.title}</b>}
            </span>
          </p>
        )}
        <p className="c-help">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            <kbd>←</kbd>
            <kbd>→</kbd> {t.move}
          </span>
          <span>
            <kbd>E</kbd> {t.car}
          </span>
          <span>
            <kbd>Enter</kbd> {t.open}
          </span>
          <button type="button" className="c-leave" onClick={() => api.current?.stop()}>
            <kbd>Esc</kbd> {t.leave}
          </button>
        </p>
        <div className="c-touch" aria-hidden="true">
          <div className="c-pad">
            <button type="button" className="u" {...hold("up")}>▲</button>
            <button type="button" className="l" {...hold("left")}>◀</button>
            <button type="button" className="r" {...hold("right")}>▶</button>
            <button type="button" className="d" {...hold("down")}>▼</button>
          </div>
          <div className="c-acts">
            <button type="button" {...hold("car")}>{t.car}</button>
            <button type="button" className="go" {...hold("enter")}>{t.open}</button>
          </div>
        </div>
      </div>
    </section>
  );
}

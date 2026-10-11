import type * as THREE_NS from "three";
import { ART_H, ART_W, drawPostArt } from "./drawArt";

export type Stage = {
  THREE: typeof THREE_NS;
  renderer: THREE_NS.WebGLRenderer;
  scene: THREE_NS.Scene;
  camera: THREE_NS.PerspectiveCamera;
  card: (slug: string, title: string, w: number) => THREE_NS.Mesh;
  dust: (count: number, spread: number) => THREE_NS.Points;
  resize: () => void;
  dispose: () => void;
};

export async function createStage(canvas: HTMLCanvasElement, fov = 38): Promise<Stage | null> {
  const THREE = await import("three");
  const { RoundedBoxGeometry } = await import("three/examples/jsm/geometries/RoundedBoxGeometry.js");
  const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
  let renderer: THREE_NS.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.6;
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xc8d4ff, 0x0a0c14, 0.8));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 6, 8);
  scene.add(key);
  const rim = new THREE.PointLight(0x6e95ff, 2, 0, 0);
  rim.position.set(-6, 3, -4);
  scene.add(rim);
  const font = getComputedStyle(document.body).fontFamily;

  const edge = new THREE.MeshStandardMaterial({ color: 0x2a3142, metalness: 0.9, roughness: 0.25 });
  const back = new THREE.MeshStandardMaterial({ color: 0x141824, metalness: 0.8, roughness: 0.4 });

  const card = (slug: string, title: string, w: number) => {
    const c = document.createElement("canvas");
    c.width = ART_W;
    c.height = ART_H;
    drawPostArt(c.getContext("2d")!, slug, font, title);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const face = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true });
    const h = (w * ART_H) / ART_W;
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.05, 4, 0.04), [edge, edge, edge, edge, face, back]);
    mesh.userData.slug = slug;
    mesh.userData.face = face;
    return mesh;
  };

  const dot = (() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const g = c.getContext("2d")!;
    const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, "rgba(210,222,255,1)");
    rg.addColorStop(1, "rgba(210,222,255,0)");
    g.fillStyle = rg;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();

  const dust = (count: number, spread: number) => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) pos.set([(Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread * 0.6, (Math.random() - 0.5) * spread - 4], i * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: dot, size: 0.07, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    scene.add(pts);
    return pts;
  };

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const dispose = () => {
    scene.traverse((o) => {
      const m = o as THREE_NS.Mesh;
      m.geometry?.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      mats.forEach((mat) => {
        (mat as THREE_NS.MeshBasicMaterial).map?.dispose();
        mat.dispose();
      });
    });
    env.dispose();
    pmrem.dispose();
    renderer.dispose();
  };

  return { THREE, renderer, scene, camera, card, dust, resize, dispose };
}

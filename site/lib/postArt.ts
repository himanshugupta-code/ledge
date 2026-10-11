import { SPECTRUM } from "./motion";

export type PostLite = { slug: string; title: string; description: string; date: string; minutes: number };

export type Motif = "organize" | "desktop" | "drag" | "blur" | "versus";

export type Art = { kind: "guide" | "compare"; accent: string; motif: Motif; rival?: string };

const RIVALS: Record<string, { name: string; color: string }> = {
  shottr: { name: "Shottr", color: SPECTRUM[1] },
  "cleanshot-x": { name: "CleanShot X", color: SPECTRUM[4] },
  dropover: { name: "Dropover", color: SPECTRUM[3] },
};

export function artFor(slug: string): Art & { rivalColor?: string } {
  if (slug.startsWith("ledge-vs-")) {
    const r = RIVALS[slug.slice(9)] ?? { name: slug.slice(9), color: SPECTRUM[2] };
    return { kind: "compare", accent: r.color, motif: "versus", rival: r.name, rivalColor: r.color };
  }
  if (slug.includes("organize")) return { kind: "guide", accent: SPECTRUM[5], motif: "organize" };
  if (slug.includes("desktop")) return { kind: "guide", accent: SPECTRUM[2], motif: "desktop" };
  if (slug.includes("drag")) return { kind: "guide", accent: SPECTRUM[3], motif: "drag" };
  return { kind: "guide", accent: SPECTRUM[0], motif: "blur" };
}

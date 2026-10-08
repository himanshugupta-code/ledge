import { createSpring } from "animejs";

export const SPECTRUM = ["#ff5a5f", "#ff9a3c", "#ffd43b", "#3ddc84", "#2cd4e8", "#5b7cff"];

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const spring = (stiffness = 160, damping = 12) => createSpring({ stiffness, damping });

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const cssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function watchVisibility(el: Element, onChange: (visible: boolean) => void, threshold = 0.25) {
  const io = new IntersectionObserver(([entry]) => onChange(entry.isIntersecting), { threshold });
  io.observe(el);
  return () => io.disconnect();
}

export const finished = (animation: { then: (callback: () => void) => unknown }) =>
  new Promise<void>((resolve) => {
    animation.then(() => resolve());
  });

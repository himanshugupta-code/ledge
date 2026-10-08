"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, stagger, utils } from "animejs";
import { cssVar, prefersReducedMotion, sleep, watchVisibility } from "../../lib/motion";

export type KeyActions = Record<"esc" | "tab" | "enter" | "del" | "c" | "l" | "v" | "a" | "r" | "o" | "p" | "h" | "t" | "x" | "z" | "s", string>;

const ROWS = [
  ["Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "⌫"],
  ["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "Del"],
  ["⇪", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "↵"],
  ["⇧", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "⇧"],
];
const FLAT = ROWS.flat();

const COMBOS: Record<string, [string[], keyof KeyActions]> = {
  Esc: [["Esc"], "esc"],
  Tab: [["Tab"], "tab"],
  "↵": [["Enter"], "enter"],
  Del: [["Delete"], "del"],
  "⌫": [["Delete"], "del"],
  C: [["C"], "c"],
  L: [["⌘", "⌥", "L"], "l"],
  V: [["V"], "v"],
  A: [["A"], "a"],
  R: [["R"], "r"],
  O: [["O"], "o"],
  P: [["P"], "p"],
  H: [["H"], "h"],
  T: [["T"], "t"],
  X: [["X"], "x"],
  Z: [["⌘", "Z"], "z"],
  S: [["⌘", "S"], "s"],
};

const KEY_NAMES: Record<string, string> = { Escape: "Esc", Tab: "Tab", Enter: "↵", Delete: "Del", Backspace: "⌫", CapsLock: "⇪", Shift: "⇧" };

export function KeysDemo({ label, prompt, none, actions }: { label: string; prompt: string; none: string; actions: KeyActions }) {
  const panel = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState<{ combo: string[]; text: string } | null>(null);
  const touched = useRef(false);

  const press = useCallback(
    (key: string, fromUser: boolean) => {
      const el = panel.current;
      if (!el) return;
      if (fromUser) touched.current = true;
      const idx = FLAT.indexOf(key);
      const info = COMBOS[key];
      if (!prefersReducedMotion()) {
        const keys = [...el.querySelectorAll<HTMLElement>(".m-k")];
        const base = cssVar("--m-key") || "#232327";
        animate(keys, {
          y: [{ to: -7, duration: 160 }, { to: 0, duration: 420 }],
          backgroundColor: [{ to: info ? "#5b7cff" : "#8a8c9a", duration: 160 }, { to: base, duration: 700 }],
          delay: stagger(34, { grid: [12, 4], from: idx < 0 ? 0 : idx }),
          ease: "outQuad",
          onComplete: () => keys.forEach((k) => k.style.removeProperty("background-color")),
        });
        if (readout.current) animate(readout.current.children, { opacity: [0, 1], x: [-8, 0], duration: 360, delay: stagger(60), ease: "outQuad" });
      }
      setCurrent({ combo: info ? info[0] : [key], text: info ? actions[info[1]] : none });
    },
    [actions, none],
  );

  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    let visible = false;
    let alive = true;
    const unwatch = watchVisibility(el, (v) => (visible = v), 0.3);
    const onKey = (e: KeyboardEvent) => {
      if (!visible || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select")) return;
      const key = KEY_NAMES[e.key] ?? e.key.toUpperCase();
      if (!FLAT.includes(key)) return;
      if (e.key === "Tab" && target?.classList.contains("m-k")) return;
      press(key, true);
    };
    window.addEventListener("keydown", onKey);

    (async () => {
      const tour = ["C", "L", "↵", "A", "X", "Z", "Esc"];
      let i = 0;
      while (alive && !prefersReducedMotion()) {
        await sleep(2400);
        if (!alive || touched.current) return;
        if (!visible || document.hidden) continue;
        press(tour[i++ % tour.length], false);
      }
    })();

    return () => {
      alive = false;
      unwatch();
      window.removeEventListener("keydown", onKey);
      utils.remove(el.querySelectorAll(".m-k"));
    };
  }, [press]);

  return (
    <div className="m-panel" ref={panel}>
      <div className="m-panel-bar">
        <span>{label}</span>
      </div>
      <div className="m-kb-wrap">
        <div className="m-kb">
          {FLAT.map((key, i) => {
            const mapped = Boolean(COMBOS[key]);
            return (
              <button
                key={`${key}-${i}`}
                type="button"
                className={`m-k${mapped ? " map" : ""}`}
                tabIndex={mapped ? 0 : -1}
                onClick={() => press(key, true)}
              >
                {key}
              </button>
            );
          })}
        </div>
        <div className="m-readout" ref={readout} aria-live="polite">
          <div className="m-combo">
            {(current?.combo ?? ["?"]).map((k, i) => (
              <kbd key={`${k}-${i}`}>{k}</kbd>
            ))}
          </div>
          <div className="m-what">{current?.text ?? prompt}</div>
        </div>
      </div>
    </div>
  );
}

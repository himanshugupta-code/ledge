"use client";

import { useEffect, useState } from "react";

type Mode = "light" | "system" | "dark";
const KEY = "ledge-theme";

const icons: Record<Mode, React.ReactNode> = {
  light: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" />
    </svg>
  ),
  system: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1.8" y="2.6" width="12.4" height="8.2" rx="1.4" />
      <path d="M5.5 13.4h5M8 10.8v2.6" />
    </svg>
  ),
  dark: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8Z" />
    </svg>
  ),
};

const labels: Record<Mode, string> = { light: "Light theme", system: "System theme", dark: "Dark theme" };

function apply(mode: Mode) {
  const root = document.documentElement;
  if (mode === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", mode);
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "light" || saved === "dark") setMode(saved);
    } catch {}
  }, []);

  const choose = (next: Mode) => {
    setMode(next);
    apply(next);
    try {
      if (next === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {}
  };

  return (
    <div className="theme" role="group" aria-label="Colour theme">
      {(["light", "system", "dark"] as Mode[]).map((m) => (
        <button key={m} type="button" aria-pressed={mode === m} aria-label={labels[m]} title={labels[m]} onClick={() => choose(m)}>
          {icons[m]}
        </button>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import { asset } from "../../lib/site";
import { SPECTRUM } from "../../lib/motion";

type GameText = { title: string; body: string; play: string; hint: string; loading: string; full: string };

const DROPS = [
  { x: 14, d: 0, c: 0 },
  { x: 32, d: 1.4, c: 3 },
  { x: 51, d: 0.6, c: -1 },
  { x: 68, d: 2.1, c: 5 },
  { x: 84, d: 1, c: 2 },
  { x: 42, d: 2.8, c: 4 },
];

export function GameSection({ t }: { t: GameText }) {
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);
  const src = asset("/game/index.html");

  return (
    <section className="band center m-game" id="play">
      <div className="wrap">
        <h2 className="display">{t.title}</h2>
        <p className="lede">{t.body}</p>
        <div className="m-game-stage">
          {on ? (
            <>
              {!ready && <p className="m-game-loading">{t.loading}</p>}
              <iframe src={src} title={t.play} allow="autoplay; fullscreen" onLoad={() => setReady(true)} />
            </>
          ) : (
            <button type="button" className="m-game-poster" onClick={() => setOn(true)}>
              <span className="m-game-rain" aria-hidden="true">
                {DROPS.map((p, i) => (
                  <i
                    key={i}
                    className={p.c < 0 ? "bad" : ""}
                    style={{ left: `${p.x}%`, animationDelay: `${p.d}s`, ["--c" as string]: p.c < 0 ? "#e5484d" : SPECTRUM[p.c] }}
                  />
                ))}
              </span>
              <span className="m-game-ledge" aria-hidden="true" />
              <span className="btn">{t.play}</span>
            </button>
          )}
        </div>
        <p className="m-game-foot">
          <span>{t.hint}</span>
          <a href={src} target="_blank" rel="noopener">{t.full} ↗</a>
        </p>
      </div>
    </section>
  );
}

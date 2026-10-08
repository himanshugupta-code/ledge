import type { ReactNode } from "react";
import { JsonLd } from "./JsonLd";
import { Reveal } from "./Reveal";
import { CaptureDial } from "./home/CaptureDial";
import { DragDemo } from "./home/DragDemo";
import { EditorDemo } from "./home/EditorDemo";
import { KeysDemo } from "./home/KeysDemo";
import { RevealDemo, ShelfDemo } from "./home/ShelfDemos";
import { SplitWords } from "./home/SplitWords";
import { VaultDemo } from "./home/VaultDemo";
import { getDictionary } from "../dictionaries";
import type { Locale } from "../lib/i18n";
import { abs, asset, AUTHOR, DMG_ARM, DMG_X64, RELEASE } from "../lib/site";

type Sub = { b: string; s: string };

function Feature({ id, color, kicker, title, body, subs, flip = false, children }: { id: string; color: string; kicker: string; title: string; body: string; subs: Sub[]; flip?: boolean; children: ReactNode }) {
  return (
    <section className={`m-feature${flip ? " flip" : ""}`} id={id}>
      <div className="wrap m-feature-grid">
        <div className="m-copy">
          <p className="m-kicker" style={{ ["--c" as string]: color }}>
            <i />
            {kicker}
          </p>
          <SplitWords text={title} className="m-h2" />
          <p className="m-lead">{body}</p>
          {subs.length > 0 && (
            <ul className="m-subs">
              {subs.map((s) => (
                <li key={s.b}>
                  <b>{s.b}</b>
                  <span>{s.s}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

export function HomePage({ lang }: { lang: Locale }) {
  const t = getDictionary(lang);
  const m = t.motion;
  const home = abs(`/${lang}/`);

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": abs("/#website"),
        url: abs("/"),
        name: "Ledge",
        inLanguage: lang,
        publisher: { "@id": abs("/#author") },
      },
      { "@type": "Person", "@id": abs("/#author"), name: AUTHOR.name, url: AUTHOR.url },
      {
        "@type": "SoftwareApplication",
        "@id": `${home}#app`,
        name: "Ledge",
        alternateName: "Ledge: Screenshot Shelf",
        description: t.meta.description,
        url: home,
        inLanguage: lang,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "macOS",
        softwareVersion: "1.0",
        downloadUrl: RELEASE,
        image: abs("/og.png"),
        screenshot: [abs("/editor.png")],
        keywords: t.meta.keywords.join(", "),
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        author: { "@id": abs("/#author") },
      },
      {
        "@type": "FAQPage",
        "@id": `${home}#faq`,
        inLanguage: lang,
        mainEntity: t.faq.items.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <JsonLd data={graph} />
      <section className="hero m-hero">
        <div className="wrap m-hero-grid">
          <div className="m-hero-copy">
            <p className="eyebrow">{t.hero.eyebrow}</p>
            <SplitWords as="h1" text={t.hero.title} onLoad />
            <p className="sub">{t.hero.sub}</p>
            <div className="cta">
              <a className="btn" href={DMG_ARM}>{t.hero.cta}</a>
              <a className="btn ghost" href="#video">{t.hero.film}</a>
            </div>
            <p className="note">{t.hero.note}</p>
          </div>
          <CaptureDial label={m.dial.label} countLabel={m.dial.count} />
        </div>
      </section>

      <Feature id="shelf" color="#ff5a5f" {...m.shelf}>
        <ShelfDemo label={m.shelf.panel} />
      </Feature>

      <Feature id="reveal" color="#ff9a3c" flip {...m.reveal}>
        <RevealDemo label={m.reveal.panel} />
      </Feature>

      <Feature id="drag" color="#ffd43b" {...m.drag}>
        <DragDemo label={m.drag.panel} hint={m.drag.hint} shared={m.drag.shared} cardLabel={m.drag.card} apps={m.drag.apps} />
      </Feature>

      <Feature id="editor" color="#3ddc84" flip kicker={m.editor.kicker} title={`${t.editor.line1} ${t.editor.line2}`} body={t.editor.body} subs={m.editor.subs}>
        <EditorDemo label={m.editor.panel} steps={m.editor.steps} note={m.editor.note} />
      </Feature>

      <Feature id="keys" color="#2cd4e8" {...m.keys} subs={[]}>
        <KeysDemo label={m.keys.panel} prompt={m.keys.prompt} none={m.keys.none} actions={m.keys.actions} />
      </Feature>

      <Feature id="private" color="#5b7cff" flip {...m.privacy} subs={[]}>
        <div className="m-private">
          <VaultDemo label={m.privacy.panel} caption={m.privacy.caption} aria={m.privacy.aria} />
          <div className="m-stats">
            {m.privacy.stats.map((s) => (
              <div key={s.l} className="m-stat">
                <b>{s.v}</b>
                <span>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </Feature>

      <section className="band alt center" id="video">
        <div className="wrap">
          <Reveal as="h2" className="display">{t.video.title}</Reveal>
          <Reveal>
            <video controls preload="none" poster={asset("/ledge-intro-poster.jpg")}>
              <source src={asset("/ledge-intro.mp4")} type="video/mp4" />
            </video>
          </Reveal>
        </div>
      </section>

      <section className="band">
        <div className="wrap faq">
          <Reveal as="h2" className="display center">{t.faq.title}</Reveal>
          <Reveal>
            {t.faq.items.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="band alt center m-get">
        <div className="wrap">
          <div className="m-spectrum" aria-hidden="true">
            {["#ff5a5f", "#ff9a3c", "#ffd43b", "#3ddc84", "#2cd4e8", "#5b7cff"].map((c) => (
              <i key={c} style={{ ["--c" as string]: c }} />
            ))}
          </div>
          <SplitWords text={t.get.title} className="display" />
          <Reveal as="p" className="lede" delay={100}>{t.get.body}</Reveal>
          <Reveal delay={200}>
            <p className="m-get-cta">
              <a className="btn" href={DMG_ARM}>{t.get.cta}</a>
              <a className="btn ghost" href={DMG_X64}>{m.x64}</a>
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}

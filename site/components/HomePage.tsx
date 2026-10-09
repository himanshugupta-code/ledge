import { JsonLd } from "./JsonLd";
import { Reveal } from "./Reveal";
import { SplitWords } from "./home/SplitWords";
import { GameSection } from "./home/GameSection";
import { Story } from "./home/Story";
import { getDictionary } from "../dictionaries";
import type { Locale } from "../lib/i18n";
import { abs, asset, AUTHOR, DMG_ARM, DMG_X64, RELEASE } from "../lib/site";

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
      <Story
        hero={{ ...t.hero, href: DMG_ARM }}
        dial={m.dial}
        features={[
          { id: "shelf", color: "#ff5a5f", ...m.shelf },
          { id: "reveal", color: "#ff9a3c", ...m.reveal },
          { id: "drag", color: "#ffd43b", ...m.drag },
          { id: "editor", color: "#3ddc84", kicker: m.editor.kicker, title: `${t.editor.line1} ${t.editor.line2}`, body: t.editor.body, subs: m.editor.subs },
          { id: "keys", color: "#2cd4e8", ...m.keys, subs: [] },
          { id: "private", color: "#5b7cff", ...m.privacy, subs: [] },
        ]}
        stats={m.privacy.stats}
        shelf={m.shelf}
        reveal={m.reveal}
        drag={m.drag}
        editor={m.editor}
        keys={m.keys}
        privacy={m.privacy}
      />

      <GameSection t={t.game} />

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

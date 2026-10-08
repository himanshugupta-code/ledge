import { JsonLd } from "./JsonLd";
import { Reveal } from "./Reveal";
import { ScrollScale } from "./ScrollScale";
import { getDictionary } from "../dictionaries";
import type { Locale } from "../lib/i18n";
import { abs, asset, AUTHOR, RELEASE } from "../lib/site";

export function HomePage({ lang }: { lang: Locale }) {
  const t = getDictionary(lang);
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
      <section className="hero">
        <div className="shelf-wrap">
          <img className="for-light" src={asset("/ledge-light.png")} alt={t.hero.shelfAlt} width={2560} height={336} />
          <img className="for-dark" src={asset("/ledge-dark.png")} alt="" width={2560} height={336} />
        </div>
        <div className="wrap copy">
          <p className="eyebrow">{t.hero.eyebrow}</p>
          <h1>{t.hero.title}</h1>
          <p className="sub">{t.hero.sub}</p>
          <div className="cta">
            <a className="btn" href={RELEASE}>{t.hero.cta}</a>
            <a className="btn ghost" href="#video">{t.hero.film}</a>
          </div>
          <p className="note">{t.hero.note}</p>
        </div>
      </section>

      <section className="band center">
        <div className="wrap">
          <Reveal as="h2" className="display">
            {t.intro.line1}
            <br />
            <span className="grad">{t.intro.line2}</span>
          </Reveal>
          <Reveal as="p" className="lede" delay={120}>{t.intro.body}</Reveal>
        </div>
      </section>

      <section className="band alt">
        <div className="wrap">
          <Reveal as="h2" className="display center">{t.bento.title}</Reveal>
          <div className="bento">
            <Reveal className="tile t-a">
              <div className="big">{t.bento.a.big}</div>
              <h3>{t.bento.a.h}</h3>
              <p>{t.bento.a.p}</p>
              <div className="kbds"><kbd>⌘</kbd><kbd>⌥</kbd><kbd>L</kbd></div>
            </Reveal>
            <Reveal className="tile t-b" delay={100}>
              <h3>{t.bento.b.h}</h3>
              <p>{t.bento.b.p}</p>
            </Reveal>
            <Reveal className="tile t-c" delay={60}>
              <h3>{t.bento.c.h}</h3>
              <p>{t.bento.c.p}</p>
            </Reveal>
            <Reveal className="tile t-d" delay={140}>
              <h3>{t.bento.d.h}</h3>
              <p>{t.bento.d.p}</p>
            </Reveal>
            <Reveal className="tile t-e" delay={220}>
              <h3>{t.bento.e.h}</h3>
              <p>{t.bento.e.p}</p>
            </Reveal>
            <Reveal className="tile t-f">
              <div className="big grad">{t.bento.f.big}</div>
              <p>{t.bento.f.p}</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="band center">
        <div className="wrap">
          <Reveal as="h2" className="display">
            {t.editor.line1}
            <br />
            <span className="grad">{t.editor.line2}</span>
          </Reveal>
          <Reveal as="p" className="lede" delay={120}>{t.editor.body}</Reveal>
          <ScrollScale>
            <img src={asset("/editor.png")} alt={t.editor.alt} width={1280} height={820} />
          </ScrollScale>
        </div>
      </section>

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

      <section className="band alt center">
        <div className="wrap">
          <Reveal as="h2" className="display">{t.get.title}</Reveal>
          <Reveal as="p" className="lede" delay={100}>{t.get.body}</Reveal>
          <Reveal delay={200}>
            <p style={{ marginTop: 32 }}>
              <a className="btn" href={RELEASE}>{t.get.cta}</a>
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}

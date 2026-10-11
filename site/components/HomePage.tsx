import { JsonLd } from "./JsonLd";
import { GameSection } from "./home/GameSection";
import { ScrollFilm } from "./home/ScrollFilm";
import { Story } from "./home/Story";
import Link from "next/link";
import { getDictionary } from "../dictionaries";
import { getAllPosts } from "../lib/blog";
import { PostCards } from "./blog/PostCards";
import type { Locale } from "../lib/i18n";
import { abs, asset, AUTHOR, DMG_ARM, DMG_X64, RELEASE, REPO } from "../lib/site";

export async function HomePage({ lang }: { lang: Locale }) {
  const t = getDictionary(lang);
  const posts = (await getAllPosts()).slice(0, 6).map(({ slug, title, description, date, minutes }) => ({ slug, title, description, date, minutes }));
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
        isAccessibleForFree: true,
        license: "https://opensource.org/licenses/MIT",
        sameAs: [REPO],
        downloadUrl: RELEASE,
        image: abs("/og.png"),
        screenshot: [abs("/editor.png")],
        keywords: t.meta.keywords.join(", "),
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        author: { "@id": abs("/#author") },
      },
      {
        "@type": "VideoObject",
        "@id": `${home}#video`,
        name: t.video.title,
        description: t.meta.description,
        inLanguage: "en",
        thumbnailUrl: abs("/ledge-intro-poster.jpg"),
        contentUrl: abs("/ledge-intro.mp4"),
        uploadDate: "2026-10-08",
        duration: "PT40S",
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
      <ScrollFilm t={t.film} cta={t.hero.cta} href={DMG_ARM} />
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

      <section className="band alt" id="video">
        <div className="wrap wide">
          <div className="m-head">
            <h2 className="display">{t.video.title}</h2>
          </div>
          <div className="m-panel m-video-window">
            <div className="m-panel-bar">
              <span>ledge-intro.mp4</span>
            </div>
            <video controls preload="none" poster={asset("/ledge-intro-poster.jpg")}>
              <source src={asset("/ledge-intro.mp4")} type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      <section className="band" id="guides">
        <div className="wrap wide">
          <div className="m-head">
            <h2 className="display">{t.guides.title}</h2>
            {t.guides.note && <p className="lede">{t.guides.note}</p>}
          </div>
          <PostCards posts={posts} labels={{ guide: t.blog.guide, compare: t.blog.compare, min: t.blog.minRead }} />
          <p className="m-guides-all">
            <Link href="/en/blog/" hrefLang="en">{t.guides.all} →</Link>
          </p>
        </div>
      </section>

      <section className="band alt">
        <div className="wrap wide m-faq">
          <h2 className="display">{t.faq.title}</h2>
          <div className="faq">
            {t.faq.items.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="m-get">
        <div className="wrap wide">
          <div className="m-get-card">
            <div className="m-get-title">
              <h2 className="display">{t.get.title}</h2>
              <span className="m-sel done static" aria-hidden="true">
                {["tl", "tr", "br", "bl"].map((h) => (
                  <i key={h} className={h} />
                ))}
              </span>
            </div>
            <div className="m-get-side">
              <p className="lede">{t.get.body}</p>
              <p className="m-get-cta">
                <a className="btn" href={DMG_ARM}>
                  <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v10m0 0-4-4m4 4 4-4M4 16h12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {t.get.cta}
                </a>
                <a className="btn ghost" href={DMG_X64}>{m.x64}</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

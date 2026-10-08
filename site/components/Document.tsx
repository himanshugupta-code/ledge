import Link from "next/link";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { getDictionary } from "../dictionaries";
import type { Locale } from "../lib/i18n";
import { asset, DMG_ARM, REPO } from "../lib/site";

/** The full HTML document shell shared by every page and language. */
export function Document({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  const t = getDictionary(lang);
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("ledge-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`,
          }}
        />
      </head>
      <body>
        <header className="nav">
          <div className="wrap">
            <Link href={`/${lang}/`} className="brand">
              <img src={asset("/icon.png")} alt="" width={22} height={22} />
              Ledge
            </Link>
            <nav aria-label={t.nav.main}>
              <Link href={`/${lang}/privacy/`} className="hide-sm">{t.nav.privacy}</Link>
              <Link href={`/${lang}/support/`} className="hide-sm">{t.nav.support}</Link>
              <Link href="/en/blog/" className="hide-sm">{t.nav.blog}</Link>
              <a href={REPO} className="hide-sm">{t.nav.github}</a>
              <ThemeToggle labels={t.theme} />
              <a href={DMG_ARM} className="pill">{t.nav.download}</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site">
          <div className="wrap">
            <LanguageSwitcher current={lang} label={t.footer.languages} />
            <div className="foot-row">
              <span>{t.footer.rights}</span>
              <span>
                <Link href={`/${lang}/privacy/`}>{t.footer.privacy}</Link> &nbsp;·&nbsp;{" "}
                <Link href={`/${lang}/support/`}>{t.footer.support}</Link> &nbsp;·&nbsp;{" "}
                <Link href="/en/blog/">{t.footer.blog}</Link> &nbsp;·&nbsp; <a href={REPO}>{t.footer.source}</a>
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

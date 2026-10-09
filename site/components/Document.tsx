import { Archivo, Inter } from "next/font/google";
import Link from "next/link";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { getDictionary } from "../dictionaries";
import type { Locale } from "../lib/i18n";
import { asset, DMG_ARM, REPO } from "../lib/site";

const inter = Inter({ subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-inter" });
const archivo = Archivo({ subsets: ["latin", "latin-ext"], display: "swap", axes: ["wdth"], variable: "--font-archivo" });

/** The full HTML document shell shared by every page and language. */
export function Document({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  const t = getDictionary(lang);
  return (
    <html lang={lang} className={`${inter.variable} ${archivo.variable}`} suppressHydrationWarning>
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
              <span className="foot-links">
                <Link href={`/${lang}/privacy/`}>{t.footer.privacy}</Link>
                <Link href={`/${lang}/support/`}>{t.footer.support}</Link>
                <Link href="/en/blog/">{t.footer.blog}</Link>
                <a href={REPO}>{t.footer.source}</a>
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeNames, locales } from "../lib/i18n";

/** Links to the same page in every language. Blog pages are English only, so they link to each home page. */
export function LanguageSwitcher({ current, label }: { current: string; label: string }) {
  const pathname = usePathname() ?? `/${current}/`;
  const rest = pathname.split("/").slice(2).join("/");
  const isBlog = rest.startsWith("blog");
  const target = (l: string) => (isBlog ? `/${l}/` : `/${l}/${rest}`.replace(/\/+$/, "/"));

  return (
    <nav className="langs" aria-label={label}>
      <span>{label}:</span>
      {locales.map((l) => (
        <Link key={l} href={target(l)} hrefLang={l} lang={l} aria-current={l === current ? "true" : undefined}>
          {localeNames[l]}
        </Link>
      ))}
    </nav>
  );
}

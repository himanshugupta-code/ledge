import type { Metadata } from "next";
import { abs } from "./site";
import { languageAlternates, locales, ogLocales, type Locale } from "./i18n";

type Args = {
  lang: Locale;
  /** Path after the locale segment, e.g. "/" or "/privacy/". */
  path: string;
  title: string;
  description: string;
  keywords?: string[];
  ogAlt?: string;
  type?: "website" | "article";
  /** Set false for pages that only exist in English. */
  localized?: boolean;
  publishedTime?: string;
};

/** Builds title, description, canonical, hreflang, Open Graph and Twitter metadata for a page. */
export function pageMetadata({ lang, path, title, description, keywords, ogAlt, type = "website", localized = true, publishedTime }: Args): Metadata {
  const url = abs(`/${lang}${path}`);
  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
      languages: localized ? languageAlternates(path, abs) : undefined,
    },
    openGraph: {
      type,
      url,
      siteName: "Ledge",
      title,
      description,
      locale: ogLocales[lang],
      alternateLocale: localized ? locales.filter((l) => l !== lang).map((l) => ogLocales[l]) : undefined,
      images: [{ url: abs("/og.png"), width: 1200, height: 630, alt: ogAlt ?? title }],
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [abs("/og.png")],
    },
  };
}

/** Serialises JSON-LD safely for inline script tags. */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

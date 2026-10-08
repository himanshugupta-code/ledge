export const locales = ["en", "es", "fr", "de", "ja", "hi"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ja: "日本語",
  hi: "हिन्दी",
};

/** OpenGraph locale codes. */
export const ogLocales: Record<Locale, string> = {
  en: "en_US",
  es: "es_ES",
  fr: "fr_FR",
  de: "de_DE",
  ja: "ja_JP",
  hi: "hi_IN",
};

export const isLocale = (value: string): value is Locale => (locales as readonly string[]).includes(value);

/** hreflang map for a path that exists in every locale, e.g. "/privacy/" or "/". */
export function languageAlternates(path: string, base: (p: string) => string) {
  const entries = locales.map((l) => [l, base(`/${l}${path}`)] as const);
  return { ...Object.fromEntries(entries), "x-default": base(`/${defaultLocale}${path}`) };
}

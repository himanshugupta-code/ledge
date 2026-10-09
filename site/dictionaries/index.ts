import type { Locale } from "../lib/i18n";
import type { Dict } from "./en";
import en from "./en";
import es from "./es";
import fr from "./fr";
import de from "./de";
import ja from "./ja";
import hi from "./hi";

const dictionaries: Record<Locale, Dict> = { en, es, fr, de, ja, hi };

export const getDictionary = (locale: Locale): Dict => dictionaries[locale];
export type { Dict };

import type { MetadataRoute } from "next";
import { postSlugs } from "../lib/blog";
import { languageAlternates, locales } from "../lib/i18n";
import { abs } from "../lib/site";

export const dynamic = "force-static";

const localizedPaths = ["/", "/privacy/", "/support/"];
const lastModified = new Date("2026-10-09");

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = localizedPaths.flatMap((path) =>
    locales.map((lang) => ({
      url: abs(`/${lang}${path}`),
      lastModified,
      changeFrequency: path === "/" ? ("weekly" as const) : ("yearly" as const),
      priority: path === "/" ? 1 : 0.5,
      alternates: { languages: languageAlternates(path, abs) },
    })),
  );
  const blog: MetadataRoute.Sitemap = [
    { url: abs("/en/blog/"), lastModified, changeFrequency: "weekly", priority: 0.7 },
    ...postSlugs.map((slug) => ({ url: abs(`/en/blog/${slug}/`), lastModified, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
  return [...pages, ...blog];
}

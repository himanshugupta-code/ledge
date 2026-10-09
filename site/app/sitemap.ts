import type { MetadataRoute } from "next";
import { getAllPosts } from "../lib/blog";
import { languageAlternates, locales } from "../lib/i18n";
import { abs } from "../lib/site";

export const dynamic = "force-static";

const localizedPaths = ["/", "/privacy/", "/support/"];
const lastModified = new Date("2026-10-09");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  const newest = posts.length ? new Date(posts[0].date) : lastModified;
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
    { url: abs("/en/blog/"), lastModified: newest, changeFrequency: "weekly", priority: 0.7 },
    ...posts.map((post) => ({ url: abs(`/en/blog/${post.slug}/`), lastModified: new Date(post.date), changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
  return [...pages, ...blog];
}

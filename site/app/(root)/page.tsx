import type { Metadata } from "next";
import { HomePage } from "../../components/HomePage";
import { getDictionary } from "../../dictionaries";
import { pageMetadata } from "../../lib/seo";

export function generateMetadata(): Metadata {
  const t = getDictionary("en");
  return pageMetadata({ lang: "en", path: "/", title: t.meta.title, description: t.meta.description, keywords: t.meta.keywords, ogAlt: t.meta.ogAlt });
}

export default function Root() {
  return <HomePage lang="en" />;
}

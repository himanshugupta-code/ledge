import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePage } from "../../../components/HomePage";
import { getDictionary } from "../../../dictionaries";
import { isLocale } from "../../../lib/i18n";
import { pageMetadata } from "../../../lib/seo";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return pageMetadata({ lang, path: "/", title: t.meta.title, description: t.meta.description, keywords: t.meta.keywords, ogAlt: t.meta.ogAlt });
}

export default async function Home({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <HomePage lang={lang} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "../../../../components/JsonLd";
import { getDictionary } from "../../../../dictionaries";
import { isLocale } from "../../../../lib/i18n";
import { pageMetadata } from "../../../../lib/seo";
import { abs, SUPPORT } from "../../../../lib/site";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return pageMetadata({ lang, path: "/privacy/", title: `${t.privacy.metaTitle} · Ledge`, description: t.privacy.desc });
}

export default async function Privacy({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.blog.home, item: abs(`/${lang}/`) },
      { "@type": "ListItem", position: 2, name: t.privacy.metaTitle, item: abs(`/${lang}/privacy/`) },
    ],
  };
  return (
    <article className="doc">
      <JsonLd data={crumbs} />
      <h1>{t.privacy.title}</h1>
      <p>{t.privacy.lead}</p>
      <ul>
        {t.privacy.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p>
        {t.privacy.questions} <a href={SUPPORT}>{SUPPORT}</a>
      </p>
    </article>
  );
}

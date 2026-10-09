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
  return pageMetadata({ lang, path: "/support/", title: `${t.support.metaTitle} · Ledge`, description: t.support.desc });
}

export default async function Support({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.blog.home, item: abs(`/${lang}/`) },
      { "@type": "ListItem", position: 2, name: t.support.metaTitle, item: abs(`/${lang}/support/`) },
    ],
  };
  return (
    <article className="doc">
      <JsonLd data={crumbs} />
      <h1>{t.support.title}</h1>
      <p>
        {t.support.reportPre} <a href={SUPPORT}>{t.support.reportLink}</a>.
      </p>
      <h2>{t.support.startTitle}</h2>
      <ol>
        {t.support.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <h2>{t.support.emptyTitle}</h2>
      <p>{t.support.emptyBody}</p>
    </article>
  );
}

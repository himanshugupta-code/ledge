import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "../../../../../components/JsonLd";
import { getDictionary } from "../../../../../dictionaries";
import { getPost, postSlugs } from "../../../../../lib/blog";
import { pageMetadata } from "../../../../../lib/seo";
import { abs, AUTHOR } from "../../../../../lib/site";

export const dynamicParams = false;
export function generateStaticParams() {
  return postSlugs.map((slug) => ({ lang: "en", slug }));
}

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { meta } = await getPost(slug);
  return pageMetadata({
    lang: "en",
    path: `/blog/${slug}/`,
    title: `${meta.title} · Ledge`,
    description: meta.description,
    keywords: meta.keywords,
    type: "article",
    localized: false,
    publishedTime: meta.date,
  });
}

export default async function Post({ params }: Props) {
  const { lang, slug } = await params;
  if (lang !== "en") notFound();
  const { Content, meta } = await getPost(slug);
  const t = getDictionary("en");
  const url = abs(`/en/blog/${slug}/`);
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#post`,
        headline: meta.title,
        description: meta.description,
        datePublished: meta.date,
        dateModified: meta.date,
        inLanguage: "en",
        keywords: meta.keywords.join(", "),
        image: abs("/og.png"),
        mainEntityOfPage: url,
        author: { "@type": "Person", name: AUTHOR.name, url: AUTHOR.url },
        publisher: { "@type": "Person", name: AUTHOR.name, url: AUTHOR.url },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t.blog.home, item: abs("/en/") },
          { "@type": "ListItem", position: 2, name: t.blog.title, item: abs("/en/blog/") },
          { "@type": "ListItem", position: 3, name: meta.title, item: url },
        ],
      },
    ],
  };
  return (
    <article className="doc post">
      <JsonLd data={data} />
      <p className="crumbs">
        <Link href="/en/blog/">← {t.blog.back}</Link>
      </p>
      <h1>{meta.title}</h1>
      <p className="meta">
        <time dateTime={meta.date}>
          {new Date(meta.date).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}
        </time>{" "}
        · {meta.minutes} {t.blog.minRead} · {AUTHOR.name}
      </p>
      <div className="prose">
        <Content />
      </div>
    </article>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "../../../../../components/JsonLd";
import { getDictionary } from "../../../../../dictionaries";
import { getAllPosts, getPost, postSlugs } from "../../../../../lib/blog";
import { artFor } from "../../../../../lib/postArt";
import { PostCards } from "../../../../../components/blog/PostCards";
import { PostHero3D } from "../../../../../components/blog/PostHero3D";
import { ProseMotion } from "../../../../../components/blog/ProseMotion";
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
  const all = (await getAllPosts()).map(({ slug: s2, title, description, date, minutes }) => ({ slug: s2, title, description, date, minutes }));
  const lite = all.find((p) => p.slug === slug)!;
  const others = all.filter((p) => p.slug !== slug);
  const art = artFor(slug);
  const kind = art.kind === "compare" ? t.blog.compare : t.blog.guide;
  const next = [...others.filter((p) => artFor(p.slug).kind !== art.kind), ...others.filter((p) => artFor(p.slug).kind === art.kind)].slice(0, 3);
  return (
    <article className="b-post" style={{ ["--c" as string]: art.accent }}>
      <JsonLd data={data} />
      <div className="b-progress" aria-hidden="true">
        <i />
      </div>
      <header className="b-post-hero">
        <PostHero3D post={lite} others={others} />
        <div className="b-post-copy">
          <p className="b-crumbs">
            <Link href="/en/blog/">← {t.blog.back}</Link>
          </p>
          <p className="b-kind">
            <i aria-hidden="true" />
            {kind}
          </p>
          <h1>{meta.title}</h1>
          <p className="b-lede">{meta.description}</p>
          <p className="b-meta">
            <time dateTime={meta.date}>
              {new Date(meta.date).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}
            </time>
            <span>
              {meta.minutes} {t.blog.minRead}
            </span>
            <span>{AUTHOR.name}</span>
          </p>
        </div>
      </header>
      <div className="b-post-body">
        <ProseMotion accent={art.accent}>
          <Content />
        </ProseMotion>
      </div>
      <section className="b-next">
        <div className="wrap wide">
          <h2 className="display">{t.blog.next}</h2>
          <PostCards posts={next} labels={{ guide: t.blog.guide, compare: t.blog.compare, min: t.blog.minRead }} />
          <p className="m-guides-all">
            <Link href="/en/blog/">{t.blog.all} →</Link>
          </p>
        </div>
      </section>
    </article>
  );
}

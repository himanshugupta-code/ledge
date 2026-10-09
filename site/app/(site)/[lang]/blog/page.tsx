import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "../../../../components/JsonLd";
import { getDictionary } from "../../../../dictionaries";
import { getAllPosts } from "../../../../lib/blog";
import { pageMetadata } from "../../../../lib/seo";
import { abs } from "../../../../lib/site";

/** The blog is English only for now, so only /en/blog/ is generated. */
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ lang: "en" }];
}

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary("en");
  return pageMetadata({ lang: "en", path: "/blog/", title: `${t.blog.metaTitle} · Ledge`, description: t.blog.desc, localized: false });
}

export default async function BlogIndex({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "en") notFound();
  const t = getDictionary("en");
  const posts = await getAllPosts();
  const data = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Ledge blog",
    description: t.blog.desc,
    url: abs("/en/blog/"),
    inLanguage: "en",
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      datePublished: p.date,
      url: abs(`/en/blog/${p.slug}/`),
    })),
  };
  return (
    <article className="doc blog-index">
      <JsonLd data={data} />
      <h1>{t.blog.title}</h1>
      <p className="lead-doc">{t.blog.lead}</p>
      <ul className="posts">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link href={`/en/blog/${p.slug}/`}>
              <time dateTime={p.date}>
                {new Date(p.date).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}
              </time>
              <h2>{p.title}</h2>
              <p>{p.description}</p>
              <span>
                {t.blog.read} · {p.minutes} {t.blog.minRead}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}

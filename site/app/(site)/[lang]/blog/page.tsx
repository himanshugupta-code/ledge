import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "../../../../components/JsonLd";
import { BlogCity } from "../../../../components/blog/BlogCity";
import { PostCards } from "../../../../components/blog/PostCards";
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
  const lite = posts.map(({ slug, title, description, date, minutes }) => ({ slug, title, description, date, minutes }));
  return (
    <div className="b-page">
      <JsonLd data={data} />
      <BlogCity posts={lite} title={t.blog.heroTitle} lead={t.blog.cityLead} t={t.blog.city} />
      <section className="b-list">
        <div className="wrap wide">
          <PostCards posts={lite} labels={{ guide: t.blog.guide, compare: t.blog.compare, min: t.blog.minRead }} variant="feature" />
        </div>
      </section>
    </div>
  );
}

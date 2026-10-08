import type { ComponentType } from "react";

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  minutes: number;
  keywords: string[];
};

/** Add a slug here after creating content/blog/<slug>.mdx. */
export const postSlugs = ["blur-sensitive-info-in-mac-screenshots"] as const;

export async function getPost(slug: string): Promise<{ Content: ComponentType; meta: PostMeta }> {
  const mod = await import(`@/content/blog/${slug}.mdx`);
  return { Content: mod.default, meta: { ...(mod.meta as Omit<PostMeta, "slug">), slug } };
}

export async function getAllPosts() {
  const posts = await Promise.all(postSlugs.map((s) => getPost(s)));
  return posts.map((p) => p.meta).sort((a, b) => b.date.localeCompare(a.date));
}

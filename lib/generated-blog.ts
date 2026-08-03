import postsFile from "@/content/blog/generated-posts.json";
import { dedupePostsForIndex } from "@/lib/blog-utils";

export type GeneratedBlogPost = {
  slug: string;
  title: string;
  description: string;
  contentMarkdown: string;
  contentHtml: string;
  keywords: string[];
  cta: string;
  audience: string;
  internalLinks: { text: string; url: string }[];
  publishedAt: string;
  url: string;
  topicKey?: string;
};

type PostsFile = { posts: GeneratedBlogPost[] };

const data = postsFile as PostsFile;

export function getAllGeneratedBlogPosts(): GeneratedBlogPost[] {
  return [...(data.posts ?? [])].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/** Index view: one entry per topic (newest wins). All URLs remain routable. */
export function getGeneratedBlogPosts(): GeneratedBlogPost[] {
  return dedupePostsForIndex(getAllGeneratedBlogPosts());
}

export function getGeneratedBlogPost(slug: string): GeneratedBlogPost | null {
  return getAllGeneratedBlogPosts().find((p) => p.slug === slug) ?? null;
}

export function getGeneratedBlogSlugs(): string[] {
  return getAllGeneratedBlogPosts().map((p) => p.slug);
}

import type { Metadata } from "next";
import Link from "next/link";
import { SeoSiteNav } from "@/components/SeoSiteNav";
import { getGeneratedBlogPosts } from "@/lib/generated-blog";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Sports Card Grading Guides & Tips",
  description:
    "Expert guides on sports card grading, PSA vs BGS vs SGC, card condition, and when grading is worth the cost.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Sports Card Grading Guides | CardSnap",
    description:
      "Expert guides on sports card grading, condition, and ROI before you submit to PSA.",
    url: `${getSiteUrl()}/blog`,
    type: "website",
  },
};

export default function BlogIndexPage() {
  const posts = getGeneratedBlogPosts();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SeoSiteNav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight">CardSnap Blog</h1>
        <p className="mt-2 text-zinc-400">
          Grading guides, card condition tips, and collector strategies.
        </p>
        <ul className="mt-10 space-y-6">
          {posts.map((post) => (
            <li key={post.slug} className="border-b border-zinc-800 pb-6">
              <Link href={`/blog/${post.slug}`} className="group block">
                <h2 className="text-xl font-semibold text-zinc-50 group-hover:text-amber-400">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm text-zinc-400">{post.description}</p>
              </Link>
            </li>
          ))}
        </ul>
        {posts.length === 0 ? (
          <p className="mt-8 text-zinc-500">New guides publish daily.</p>
        ) : null}
      </main>
    </div>
  );
}

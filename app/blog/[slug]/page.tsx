import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { SeoSiteNav } from "@/components/SeoSiteNav";
import {
  getGeneratedBlogPost,
  getGeneratedBlogSlugs,
} from "@/lib/generated-blog";
import { getSiteUrl } from "@/lib/site-url";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return getGeneratedBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getGeneratedBlogPost(params.slug);
  if (!post) return { title: "Not found | CardSnap" };
  const siteUrl = getSiteUrl();
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${siteUrl}/blog/${post.slug}`,
      siteName: "CardSnap",
      type: "article",
      locale: "en_US",
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: ["/opengraph-image"],
    },
  };
}

export default function GeneratedBlogPostPage({ params }: Props) {
  const post = getGeneratedBlogPost(params.slug);
  if (!post) notFound();

  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/blog/${post.slug}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: { "@type": "Organization", name: "CardSnap" },
    publisher: { "@type": "Organization", name: "CardSnap" },
    mainEntityOfPage: pageUrl,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <JsonLd data={articleJsonLd} />
      <SeoSiteNav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
          CardSnap Blog
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-50 md:text-4xl">
          {post.title}
        </h1>
        <p className="mt-3 text-zinc-400">{post.description}</p>
        <article
          className="blog-prose mt-8 space-y-4 text-zinc-300 [&_a]:text-amber-400 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-zinc-100 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-medium [&_li]:ml-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-zinc-700 [&_td]:p-2 [&_th]:border [&_th]:border-zinc-700 [&_th]:p-2 [&_th]:text-left [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
        {post.cta ? (
          <p className="mt-10 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-100">
            {post.cta}
          </p>
        ) : null}
        {post.internalLinks.length > 0 ? (
          <section className="mt-10 border-t border-zinc-800 pt-8">
            <h2 className="text-lg font-semibold text-zinc-100">Related</h2>
            <ul className="mt-3 space-y-2">
              {post.internalLinks.map((link) => (
                <li key={link.url}>
                  <Link href={link.url} className="text-amber-400 hover:underline">
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <p className="mt-10">
          <Link href="/blog" className="text-sm text-zinc-500 hover:text-zinc-300">
            ← All blog posts
          </Link>
        </p>
      </main>
    </div>
  );
}

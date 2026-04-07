import type { MetadataRoute } from "next";
import { cardPages } from "@/lib/cards";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/cards`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/psa-grading-calculator`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/grade-or-skip/baseball`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/grade-or-skip/basketball`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/grade-or-skip/pokemon`, lastModified, changeFrequency: "monthly", priority: 0.8 },
  ];

  const cardRoutes: MetadataRoute.Sitemap = cardPages.map((c) => ({
    url: `${base}/cards/${c.slug}`,
    lastModified: new Date(c.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...cardRoutes];
}

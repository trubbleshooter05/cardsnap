#!/usr/bin/env npx tsx
import postsFile from "@/content/blog/generated-posts.json";
import type { GeneratedBlogPost } from "@/lib/generated-blog";
import {
  dedupePostsForIndex,
  findDuplicateBlogIssues,
  normalizeBlogTitle,
} from "@/lib/blog-utils";

const posts = (postsFile as { posts: GeneratedBlogPost[] }).posts ?? [];

const issues = findDuplicateBlogIssues(posts);
const indexPosts = dedupePostsForIndex(posts);

console.log("Blog SEO validation");
console.log("===================");
console.log(`Total stored posts: ${posts.length}`);
console.log(`Unique index entries: ${indexPosts.length}`);
console.log(`Unique normalized titles: ${new Set(posts.map((p) => normalizeBlogTitle(p.title))).size}`);

let failed = false;

if (issues.duplicateSlugs.length > 0) {
  failed = true;
  console.error("\nFAIL duplicate slugs:", issues.duplicateSlugs);
}

if (issues.duplicateTitles.length > 0) {
  console.warn("\nWARN duplicate normalized titles (legacy URLs may remain):");
  for (const row of issues.duplicateTitles) {
    console.warn(`  - "${row.title}" → ${row.slugs.join(", ")}`);
  }
}

if (issues.duplicateTopicKeys.length > 0) {
  console.warn("\nWARN duplicate topic keys (same topic, date-suffixed slugs):");
  for (const row of issues.duplicateTopicKeys) {
    console.warn(`  - ${row.topicKey} → ${row.slugs.join(", ")}`);
  }
}

const indexSlugs = new Set(indexPosts.map((p) => p.slug));
if (indexSlugs.size !== indexPosts.length) {
  failed = true;
  console.error("\nFAIL blog index dedupe produced duplicate slugs");
}

if (failed) {
  process.exit(1);
}

console.log("\nPASS: no exact slug duplicates; index dedupe OK.");
console.log("(Normalized title/topic duplicates may remain until manual URL cleanup.)");

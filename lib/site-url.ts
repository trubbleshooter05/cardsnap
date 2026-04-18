/** Production canonical: https://getcardsnap.com — override with NEXT_PUBLIC_APP_URL (e.g. localhost in .env.local). */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://getcardsnap.com";
  return raw.replace(/\/$/, "");
}

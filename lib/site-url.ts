export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://cardsnap-seven.vercel.app";
  return raw.replace(/\/$/, "");
}

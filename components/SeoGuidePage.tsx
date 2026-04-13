import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { SeoSiteNav } from "@/components/SeoSiteNav";
import type {
  SeoGuideBlock,
  SeoGuideDefinition,
} from "@/lib/seo-guides-types";
import { buildSeoGuideArticleJsonLd } from "@/lib/seo-guides-data";
import { getSiteUrl } from "@/lib/site-url";

function ExampleRowValue({
  value,
  tone,
}: {
  value: string;
  tone?: "amber" | "zinc" | "emerald";
}) {
  const className =
    tone === "amber"
      ? "font-semibold tabular-nums text-amber-300"
      : tone === "emerald"
        ? "font-semibold tabular-nums text-emerald-400"
        : "font-semibold tabular-nums text-zinc-100";
  return <span className={className}>{value}</span>;
}

function GuideBlocks({
  blocks,
  base,
}: {
  blocks: SeoGuideBlock[];
  base: string;
}) {
  return (
    <>
      {blocks.map((block, i) => {
        const key = `${block.kind}-${i}`;
        switch (block.kind) {
          case "paragraph":
            return (
              <p key={key} className="text-zinc-300">
                {block.text}
              </p>
            );
          case "paragraphs":
            return (
              <div key={key} className="space-y-3">
                {block.items.map((t, j) => (
                  <p key={j} className="text-zinc-300">
                    {t}
                  </p>
                ))}
              </div>
            );
          case "subhead":
            return (
              <p key={key} className="font-medium text-zinc-200">
                {block.text}
              </p>
            );
          case "bullet":
            return (
              <ul
                key={key}
                className="list-disc space-y-2 pl-6 marker:text-amber-400"
              >
                {block.items.map((item) => (
                  <li key={item} className="text-zinc-300">
                    {item}
                  </li>
                ))}
              </ul>
            );
          case "callout":
            return (
              <p
                key={key}
                className="border-l-2 border-amber-500/30 pl-4 text-base italic text-zinc-400"
              >
                {block.text}
              </p>
            );
          case "exampleRows":
            return (
              <ul
                key={key}
                className="list-none space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6"
              >
                {block.rows.map((row) => (
                  <li
                    key={row.label}
                    className="flex flex-wrap gap-x-2 text-zinc-300"
                  >
                    <span className="text-zinc-500">{row.label}</span>
                    <ExampleRowValue value={row.value} tone={row.valueTone} />
                  </li>
                ))}
              </ul>
            );
          case "toolLink":
            return (
              <p key={key} className="text-zinc-300">
                {block.lead ? (
                  <>
                    {block.lead}{" "}
                  </>
                ) : null}
                <Link
                  href={base}
                  className="font-medium text-amber-400 underline decoration-amber-500/40 underline-offset-2 hover:text-amber-300"
                >
                  {base}
                </Link>
                {block.after ? <> {block.after}</> : null}
              </p>
            );
          default:
            return null;
        }
      })}
    </>
  );
}

export function SeoGuidePage({ guide }: { guide: SeoGuideDefinition }) {
  const base = getSiteUrl();
  const articleLd = buildSeoGuideArticleJsonLd(guide);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <JsonLd data={articleLd} />
      <SeoSiteNav />

      <main className="mx-auto max-w-[700px] px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        <article className="space-y-10 text-[17px] leading-relaxed text-zinc-300 sm:text-lg">
          <header className="space-y-5">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {guide.h1}
            </h1>
            <div className="space-y-4 border-l-2 border-amber-500/40 pl-4 text-zinc-400">
              {guide.intro.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </header>

          {guide.sections.map((section) => (
            <section key={section.title} className="space-y-4">
              <h2 className="text-2xl font-semibold text-white sm:text-[1.65rem]">
                {section.title}
              </h2>
              <GuideBlocks blocks={section.blocks} base={base} />
            </section>
          ))}

          <section className="space-y-5">
            <h2 className="text-2xl font-semibold text-white sm:text-[1.65rem]">
              {guide.cta.title}
            </h2>
            <GuideBlocks blocks={guide.cta.blocks} base={base} />
            <div className="pt-2">
              <Link
                href={base}
                className="inline-flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-8 text-base font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-300 hover:to-orange-400"
              >
                {guide.cta.buttonText}
              </Link>
            </div>
          </section>

          <section className="space-y-4 border-t border-zinc-800 pt-10">
            <h2 className="text-2xl font-semibold text-white sm:text-[1.65rem]">
              {guide.finalSection.title}
            </h2>
            {guide.finalSection.paragraphs.map((p, idx) => (
              <p key={idx} className="text-zinc-300">
                {p}
              </p>
            ))}
          </section>
        </article>
      </main>
    </div>
  );
}

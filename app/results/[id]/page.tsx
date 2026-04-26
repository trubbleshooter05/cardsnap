import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase";
import { ResultCard } from "@/components/ResultCard";
import type { ScanResultPayload } from "@/lib/types";

type Row = {
  id: string;
  result: ScanResultPayload;
};

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("scans")
    .select("result")
    .eq("id", params.id)
    .maybeSingle();

  const payload = data?.result as ScanResultPayload | undefined;
  const title = payload?.confirmedName
    ? `${payload.confirmedName} · CardSnap`
    : "Card result · CardSnap";

  return { title, description: "Sports card value and grading verdict on CardSnap." };
}

export default async function SharedResultPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("scans")
    .select("id, result")
    .eq("id", params.id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const row = data as Row;

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-xl flex-col items-center">
        <p className="mb-6 text-sm text-zinc-500">
          <Link
            href="/"
            className="font-medium text-zinc-800 underline dark:text-zinc-200"
          >
            ← New analysis
          </Link>
        </p>
        <ResultCard data={row.result} scanId={row.id} />
      </div>
    </div>
  );
}

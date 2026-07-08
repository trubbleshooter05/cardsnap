import { config } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { searchEbayItemPrices } from "../lib/ebay";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");

  const supabase = createClient(url, key);
  const query = "2020 Prizm Joe Burrow #307";

  const t0 = Date.now();
  await searchEbayItemPrices(query, supabase);
  const firstMs = Date.now() - t0;

  const t1 = Date.now();
  await searchEbayItemPrices(query, supabase);
  const secondMs = Date.now() - t1;

  const { data, error } = await supabase
    .from("card_prices")
    .select("card_query,avg_price,comp_source,expires_at")
    .order("fetched_at", { ascending: false })
    .limit(1);

  if (error) throw error;

  console.log(JSON.stringify({ firstMs, secondMs, cacheHitFaster: secondMs < firstMs, latestRow: data?.[0] ?? null }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

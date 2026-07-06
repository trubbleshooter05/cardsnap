/**
 * Smoke-test Production eBay Browse credentials (loads .env.local).
 * Usage: npm run test:ebay
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { searchEbayItemPrices } from "../lib/ebay";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const env = {
    hasAppId: Boolean(process.env.EBAY_APP_ID?.trim()),
    hasCertId: Boolean(process.env.EBAY_CERT_ID?.trim()),
    hasStaticOAuthToken: Boolean(process.env.EBAY_OAUTH_TOKEN?.trim()),
  };

  console.log("EBAY env:", env);
  if (!env.hasAppId || !env.hasCertId) {
    console.error(
      "FAIL: Add Production EBAY_APP_ID and EBAY_CERT_ID to .env.local (leave EBAY_OAUTH_TOKEN unset)."
    );
    process.exit(1);
  }
  if (env.hasStaticOAuthToken) {
    console.warn(
      "WARN: EBAY_OAUTH_TOKEN is set — unset it to test client-credentials flow."
    );
  }

  const query = "2020 Prizm Joe Burrow #307";
  console.log("Query:", query);
  const result = await searchEbayItemPrices(query);

  console.log("compSource:", result.compSource);
  console.log("avgSoldPrice:", result.avgSoldPrice);
  console.log("pricedItems:", result.recentSales.length);
  if (result.debug) {
    console.log("debug:", JSON.stringify(result.debug, null, 2));
  }

  if (result.compSource === "ebay_active_listings" && result.avgSoldPrice != null) {
    console.log("SUCCESS: live eBay Browse comps returned.");
    process.exit(0);
  }

  console.error("FAIL: fallback — see debug/logs above.");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

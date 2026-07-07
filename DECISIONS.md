# CardSnap — Architecture Decisions

## eBay Browse API Integration (July 2026)

### What was already built (pre-task)
- `lib/ebay.ts`: OAuth 2.0 client-credentials token flow, Browse API call with retry/fallback logic, graceful timeout/error handling, dev-only debug panel.
- `lib/types.ts`: `EbayComp` type with `avgSoldPrice`, `minSoldPrice`, `maxSoldPrice`, `recentSales`, `compSource`.
- `app/api/scan/route.ts`: eBay called in parallel with OpenAI + PSA via `Promise.allSettled` — one failure never blocks others.
- `components/ResultCard.tsx`: "eBay market" cell in Values grid, dev-only debug panel, `EbayAffiliateButton`.

### What was added in this task

**1. `supabase-card-prices.sql`**  
New Supabase migration. Creates `card_prices` table keyed by `card_query` (normalised eBay search string). TTL = 24 hours via `expires_at` column. Apply in Supabase dashboard → SQL editor.

**2. Cache read/write in `lib/ebay.ts`**  
`searchEbayItemPrices` now accepts an optional `SupabaseClient`. When provided:
- Reads `card_prices` first — returns cached row if `expires_at` is in the future.
- On fresh API success — fire-and-forget upsert (`void writePriceCache(...)`).
- Cache write failure is swallowed; never crashes the scan.

**3. Supabase client passed from scan route**  
`app/api/scan/route.ts` passes the existing `supabase` client to `searchEbayItemPrices`. No new client instantiation needed.

**4. "Recent listings" section in `ResultCard.tsx`**  
Shows up to 10 active fixed-price listing prices as pill badges. Falls back to "price data temporarily unavailable" when `recentSales` is empty and no average is available. Clearly labelled as active listings, not confirmed sales (eBay Browse API limitation — sold history requires Marketplace Insights API tier).

### eBay API scope used
`https://api.ebay.com/oauth/api_scope` (public Browse, no seller/buyer data).

### Why active listings, not sold prices
The Browse API (`/buy/browse/v1/item_summary/search`) returns live fixed-price listings. Actual sold history requires the Marketplace Insights API, which needs a separately approved scope. Current data is clearly labelled "active listings — not confirmed sold prices."

### Env vars required
| Variable | Purpose |
|---|---|
| `EBAY_APP_ID` | OAuth client ID |
| `EBAY_CERT_ID` | OAuth client secret |

### Manual step required
Run `supabase-card-prices.sql` in the Supabase dashboard before deploying to production.

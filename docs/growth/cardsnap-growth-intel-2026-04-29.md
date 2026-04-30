# CardSnap Growth Intel Board — 2026-04-29

This is the first working growth-intel board for deciding what CardSnap should build next across SEO pages, UGC ads, internal links, and product-led content.

## Inputs Used

- Google Search Console screenshots from 2026-04-29.
- Live production checks for `https://getcardsnap.com/sitemap.xml`, `robots.txt`, `/cards`, and one example card page.
- Existing repo inventory: 25 `/cards/[slug]` pages, category pages, calculator pages, tier-one programmatic templates, and sitemap generation.
- Existing keyword seed list: `seo-engine/distro/cardsnap-intent-keywords-latest.md`.
- Public market-language checks from Reddit/search results around grading fees, PSA 9 risk, raw vs graded math, and “worth grading” questions.

## GSC Snapshot

From the screenshots:

- Indexed pages: 7.
- Not indexed pages: 76.
- Largest issue: 72 pages marked `Discovered - currently not indexed`.
- Redirect rows:
  - `Page with redirect`: 3 homepage variants (`http://`, `http://www`, `https://www`).
  - `Redirect error`: 1 URL, `https://getcardsnap.com/sitemap.xml`.

Live checks on 2026-04-29 show:

- `https://getcardsnap.com/sitemap.xml` returns `200 OK` and `content-type: application/xml`.
- `https://getcardsnap.com/robots.txt` returns `200 OK` and points to the sitemap.
- `https://getcardsnap.com/cards` returns `200 OK`.
- Example card page `/cards/anthony-edwards-2020-panini-prizm-258-value` returns `200 OK`, has `index, follow`, and has a canonical URL.

Interpretation: the sitemap redirect error is likely stale Search Console state from an older deployment. The `Discovered - currently not indexed` bucket is the real growth bottleneck: Google knows about the pages but has not crawled/indexed most of them yet.

## Priority Board

The detailed board lives at:

- `data/growth/cardsnap-growth-intel-2026-04-29.csv`

Top priorities:

1. **Get discovered card pages crawled**
   - Asset: recrawl workflow, internal links, submit important URLs in GSC.
   - Why: Google has discovered many card URLs but has not crawled them.

2. **Own “should I grade my card” harder**
   - Asset: homepage copy/FAQ refresh plus UGC.
   - Why: this is the core product job-to-be-done.

3. **Refresh PSA 9 vs PSA 10 content**
   - Asset: page refresh plus UGC cluster.
   - Hook: “PSA 10 comps are lying to you if you ignore PSA 9.”

4. **Expand raw-vs-graded card pages**
   - Asset: expand `/raw-vs-graded/[slug]` from 3 cards to more existing high-interest cards.
   - Hook: “The best move was selling raw.”

5. **Make the PSA grading calculator the conversion hub**
   - Asset: internal CTA modules from guides/card pages to calculator.
   - Why: calculator intent is closest to product conversion.

## Recommended Build Queue

### Week 1

- Validate the sitemap fix in Search Console.
- Request indexing for 5-10 strongest URLs:
  - homepage
  - `/cards`
  - `/psa-grading-calculator`
  - `/psa-9-vs-psa-10-worth-it`
  - `/what-cards-are-worth-grading`
  - top 3-5 `/cards/[slug]` pages
- Refresh `/psa-9-vs-psa-10-worth-it` with more examples and stronger internal links.
- Create 3 UGCs:
  - PSA 10 tunnel vision
  - Raw was better than graded
  - Grading fee ate the upside

### Week 2

- Expand `/raw-vs-graded/[slug]` pages from 3 to 10 cards.
- Add internal links from `/cards/[slug]` to:
  - matching raw-vs-graded page
  - matching PSA 10 page
  - calculator
- Create guide: `/is-it-worth-grading-cheap-cards`.

### Week 3

- Add 25 more card pages in one batch if indexing improves.
- Refresh category pages:
  - `/grade-or-skip/baseball`
  - `/grade-or-skip/basketball`
  - `/grade-or-skip/pokemon`
- Build sport-specific UGCs for baseball, basketball, and Pokemon.

## UGC Ideas From Market Language

1. **PSA 10 tunnel vision**
   - Hook: “I kept checking PSA 10 comps and almost ignored the part that mattered.”
   - CTA: “Check the PSA 9 downside first.”

2. **Cheap card grading trap**
   - Hook: “This card looked worth grading until I added the fee.”
   - CTA: “Run the grading math before you submit.”

3. **Raw was better**
   - Hook: “Selling raw would’ve made more sense than chasing a 10.”
   - CTA: “Compare raw vs graded first.”

4. **Rare card exception**
   - Hook: “This is the kind of card where grading actually can make sense.”
   - CTA: “Don’t guess. Check the spread.”

5. **Condition reality check**
   - Hook: “It looked perfect until I checked the corners.”
   - CTA: “Only grade if the math works at PSA 9.”

## Weekly Workflow

Use `data/growth/gsc-keyword-watch-template.csv` as the import shape.

Each week:

1. Export Search Console queries by page.
2. Add rows to the keyword watch sheet.
3. Label each query by cluster:
   - `grading_decision`
   - `grading_roi`
   - `raw_vs_graded`
   - `calculator`
   - `card_value`
   - `pokemon`
   - `baseball`
   - `basketball`
4. Promote opportunities where:
   - impressions are rising,
   - average position is 8-20,
   - CTR is weak,
   - or the query has no exact-fit landing page.
5. Create the next asset:
   - SEO page,
   - page refresh,
   - internal link update,
   - UGC script/video,
   - or calculator CTA.

## Notes

- Do not chase generic head terms first. Build around high-intent grading decisions.
- The best next assets are not necessarily the highest-volume keywords. They are the ones where CardSnap solves the exact anxiety: “Will this grading fee make or lose money?”
- Avoid saying “scan” in ads/pages unless a real upload/photo flow is being promoted. Use “analyze” or “check the math.”

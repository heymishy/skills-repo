## Story: Remove the sidebar N+1 query, the duplicate nav read and the product page weight

**Status:** DEFERRED (decided 2026-11-15, see decisions.md): not worth building now; revisit if a tenant has dozens of products or the sidebar shows up in a slow-page measurement. Short-track, domain [web-ui].

**Why:** the same read-only measurement and code read that found the main cause also found smaller costs that every page pays or that make the product page heavy.

## Scope (to become acceptance criteria at test-plan)

1. `getProductsNavSummary` (`src/web-ui/routes/products.js`) runs one query for products, then one `SELECT journey_id, created_at FROM journeys WHERE product_id = $1` per product (fetching every journey row only to count them and find the newest date), then one more for no-product journeys: N+2 queries on every page that shows the sidebar. Replace with a constant number of queries (one grouped `COUNT(*)` and `MAX(created_at)` by product) returning byte-identical output (same fields, newest product first, same last-updated value). Real-database test against the throwaway Postgres pattern from tabf-s1 (lesson D63).
2. `handleGetProductsList` (pls-s1) reads the nav summary twice per request (once itself, once inside `renderShellWithNav`); make it once.
3. The skills-framework product page HTML is 2.9 MB (2,535 links, about 20,000 inline `style` attributes, 232 KB for the reactive decisions section alone). Target under 1 MB by moving repeated inline styles to classes in the shared stylesheet and trimming repeated markup, with no visual change (visual equivalence is a manual check, classified at DoR per CLAUDE.md B2).
4. Per-view log noise: hundreds of log lines per product view (per-feature fetch and skipped-entry logging) cost I/O and bury real errors; log one summary line per view instead.

**Out of scope:** layout or content changes; the 72 direct `renderShell` calls that omit the products list (separate story); the decisions cache (ppp-s1).

**Measure of done (live):** read-only production timing and size of the skills-framework product page after deploy, reported against the ppp-s1 baseline (16.3 s, 2,972 KB).

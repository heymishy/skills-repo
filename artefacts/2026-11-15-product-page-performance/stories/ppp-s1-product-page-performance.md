# ppp-s1: Make the product page and the shared page chrome fast

Status: written, not yet through test-plan/DoR. Track: short-track (bounded performance fix, no new user-facing behaviour). Written 2026-11-15 after a read-only production measurement approved by the operator.

## Problem (measured on production v189, signed-in tab, GET only)

| Page | Time to first byte | HTML size |
|---|---|---|
| `/products` | 0.57 s | 30 KB |
| `/dashboard` | 0.49 s | 38 KB |
| `/products/<skills-framework>` run 1 | 16.3 s | 2,972 KB |
| `/products/<skills-framework>` run 2 | 15.7 s | 2,972 KB |

Run 2 is as slow as run 1, so nothing is cached. About 97% of the wait is the server building the page; the page is also 2.9 MB.

## Root causes found

1. **Live GitHub fetch per feature on every view (the main cost).** `handleGetProductView` (`src/web-ui/routes/products.js`, around the urpv-s3 block) calls `fetchReactiveDecisionsForFeatures`, which fetches `artefacts/<slug>/decisions.md` for every feature slug on the page, six at a time, no cache. The skills-framework product has about 355 features, so about 355 GitHub calls in roughly 60 rounds. About half the slugs have no `decisions.md` (189 files for 388 artefact directories) but each still costs a call. Each view also spends about 355 of the token's 5,000 requests per hour, so a few reloads can hit the rate limit and the section silently disappears.
2. **Sequential independent awaits in the same handler.** Journey rows, rollup, modules, module assignments, artefact counts, session origin, nav summary, default pod, incident store and pod context are awaited one after another although most do not depend on each other. Each adds a database or network round trip to the 16 s.
3. **2.9 MB of HTML.** 2,535 links, about 20,000 inline `style="..."` attributes and 282 decision rows (232 KB for the "Reactive decisions" section alone). Inline style repeated per row is the bulk. Slow to transfer, parse and render, especially on mobile.
4. **Sidebar navigation summary is an N+1 query on every page.** `getProductsNavSummary` runs one query for products, then one `SELECT journey_id, created_at FROM journeys WHERE product_id = $1` per product, fetching every journey row only to count them and find the latest date, then one more query for no-product journeys. For N products that is N+2 queries on every page that shows the sidebar. A single grouped query (`COUNT(*)`, `MAX(created_at)`, `GROUP BY product_id`) would do it in one or two.
5. **The new `/products` list page calls the nav summary twice** (pls-s1: `handleGetProductsList` calls `getProductsNavSummary`, then `renderShellWithNav` calls it again). My own duplication, small but free to remove by building the list from the shell's data or passing the result through.
6. **Log noise per view.** Hundreds of log lines per product view (per-feature fetch and skipped-entry logging) cost I/O and bury real errors.

## Proposed scope (acceptance criteria)

AC1. Decisions for a product's features are cached in server memory per `owner/repo/slug` with a time limit (default 5 minutes), including "file not found" results, so a repeat view makes zero GitHub calls for decisions. A failed fetch is not cached as "not found".
AC2. The product page no longer waits for decisions: the page is sent without the "Reactive decisions" section content and that section loads afterwards from a small endpoint (tenant-scoped, same authorisation as the page), showing the same items as today. If the endpoint fails the section shows a short message, not a blank.
AC3. Independent reads in `handleGetProductView` run in parallel (`Promise.all`); results and error handling unchanged.
AC4. `getProductsNavSummary` uses a constant number of queries regardless of the number of products, returning identical output (same fields, same ordering by newest product first, same last-updated value).
AC5. `handleGetProductsList` makes one nav-summary read per request.
AC6. The product page HTML for the skills-framework product is under 1 MB, or the story records why not and what the measured size is (candidate: move repeated inline styles to CSS classes in the shared stylesheet; lazy rendering of long lists).
AC7. On production after deploy, the operator-approved read-only timing of the skills-framework product page shows first byte under 3 s cold and under 1.5 s warm.

## Out of scope

- Changing what the page shows or its layout.
- Switching the data source for decisions (an alternative is to read the already-synced rollup instead of GitHub; noted for a later story).
- The 72 direct `renderShell` calls that omit `products` (separate story: sidebar Products section disappearing).

## Test notes

- Unit: cache hit, cache expiry, 404 cached, error not cached; nav summary returns identical output to the old implementation on the same fixture and issues a fixed number of queries (assert on the mock pool's call count); handler makes parallel calls (assert all started before any resolves).
- Real-database check for the grouped nav query (same throwaway Postgres pattern as tabf-s1; lesson D63: test SQL against the real database).
- Live: AC7 by the same read-only timing used above, with approval.

## Dependencies and risks

- Cache is per server process, so each of multiple Fly machines warms its own; acceptable. Memory is bounded (cap entries).
- A stale decisions section for up to the time limit; acceptable for a read-only reactive-work list; the limit is a named constant.

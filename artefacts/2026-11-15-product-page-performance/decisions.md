# Decisions: product page performance

**2026-11-15 | FINDING | Product page takes about 16 s because of per-feature GitHub reads, not the database**
**Evidence (read-only, operator-approved, production v189):** `/products` 0.57 s and `/dashboard` 0.49 s; the skills-framework product page 16.3 s then 15.7 s to first byte, 2,972 KB. The page handler fetches `artefacts/<slug>/decisions.md` from GitHub for about 355 slugs on every view, six at a time, with no cache; about half of those files do not exist. HTML holds 2,535 links, about 20,000 inline style attributes and 282 decision rows (232 KB).

**2026-11-15 | ARCH | Stale-while-revalidate in-memory cache, not a deferred section**
**Context:** the first idea was to render the page without decisions and load that section afterwards. Reading the handler showed the same decisions feed the pod rollup tab (`computePodRollup`), so deferring only the section would leave the rollup wrong or require a bigger redesign.
**Decision:** cache per `owner/repo/slug` in process memory (TTL 5 minutes, cap 2000), serve stale entries immediately and refresh in the background, cache not-found, never cache failures, never store the token; raise the cold-path concurrency from 6 to 16.
**Rationale:** no UI change, the same data on every render, repeat views cost no GitHub calls. Accepted cost: the first view after each deploy stays slow, and each server machine warms its own cache.

**2026-11-15 | SCOPE | Split into ppp-s1 and ppp-s2**
**Decision:** ppp-s1 covers the 16-second load (cache and parallel reads). ppp-s2 covers the sidebar N+1 query, the duplicate nav read on `/products`, the 2.9 MB HTML and the log noise; written, not yet taken through the pipeline.

**2026-11-15 | SCOPE | ppp-s2 deferred, items dropped or absorbed**
**Context:** after ppp-s1 was built, each ppp-s2 item was re-checked against measurements instead of the first read of the code.
**Evidence (read-only, production v189):** compressed transfer of the 2,972 KB product page is 154 KB (Fly's proxy already applies zstd), 25,412 DOM nodes; `/dashboard` (which pays the sidebar query) is 0.49 s and `/products` 0.57 s with 5 products, so the sidebar's N+1 is about 7 small queries per page. The per-view log noise came from the per-feature fetches, which ppp-s1's cache removes (failures now log once per refresh, not once per view).
**Decision:** (1) page weight: dropped, 154 KB on the wire does not justify a styling refactor with visual risk; (2) log noise: absorbed by ppp-s1; (3) sidebar N+1 and the duplicate nav read on `/products`: deferred, because changing the SQL shape touches mocks in about 50 test files for a saving too small to measure at this size.
**Revisit when:** a tenant has dozens of products, or a measurement shows the sidebar query among the slow parts of a page. At that point the grouped query (COUNT and MAX by product, tested against a real Postgres per learning D63) is the fix.
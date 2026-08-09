## Story: Scope the Roadmap tab's early-stage artefact scan to the product actually being viewed

**Epic reference:** None — short-track (bug fix, found via live Chrome-browser exploration of the operator's real staging environment)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **user viewing a specific product's Roadmap tab**,
I want **it to show only early-stage (discovery/ideate-only) work that actually belongs to that product**,
So that **I don't see identical, unrelated content on every product's roadmap, and can trust the tab reflects the product I'm actually looking at**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — found live on `wuce-staging.fly.dev` (2026-08-09): two completely different real products (`test product`, `skills-framework`) rendered byte-identical Roadmap content — the same six entries, word for word — despite having no relationship to each other. A third product's roadmap was independently observed to show 33 duplicate entries all sharing one generic title.

**How:** Root-caused via direct source read of `src/web-ui/routes/products.js`'s `handleGetProductRoadmap` (~line 885-916) and `src/web-ui/modules/roadmap-scan.js`. `scanRoadmapArtefacts` was built (story `a5`) to surface early-stage artefact folders (`artefacts/<slug>/discovery.md` or `ideate.md`) that have no `pipeline-state.json` entry yet — a genuinely useful feature. But it scans the whole repo-wide `artefacts/` directory with no awareness of which product a folder belongs to, and `a5`'s own design never added that scoping (the story predates most of this app's per-product journey/artefact tracking). The fix: cross-reference each candidate artefact folder's slug against the `journeys` table's `feature_slug` → `product_id` mapping (already correctly populated by `jrf-s2`'s fix), and only include entries whose journey's `product_id` matches the product actually being viewed.

## Architecture Constraints

- **Reuse the existing `journeys` table and the `_pool` already in scope** in `handleGetProductRoadmap` — no new table, no new adapter, no D37 concern.
- **Fail closed, not open.** If the journeys lookup query itself fails for any reason, the roadmap must render as empty for that request (matching `scanRoadmapArtefacts`'s own existing AC4 "missing/unreadable input → empty array, not an error" convention), never fall back to the old unscoped behaviour.
- **Do not change `scanRoadmapArtefacts` itself** (`roadmap-scan.js`) — it remains a pure, product-agnostic filesystem scan; the product-scoping filter is applied by its caller (`handleGetProductRoadmap`), keeping the module's own existing tests (`check-a5-roadmap-tab.js`, product-agnostic by design) valid and unchanged.
- **An artefact folder with no matching journey row at all is excluded from every product's roadmap** (a conservative default — it cannot be attributed to any specific product without a journey record, and showing it everywhere is the exact bug being fixed).

## Dependencies

- **Upstream:** None (this fixes already-shipped `a5` roadmap-tab code).
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given two different products, each with at least one early-stage artefact folder on disk whose journey has that product's own `productId`, When each product's Roadmap tab is viewed, Then each shows only its own entries — not the other product's.

**AC2:** Given an artefact folder on disk with no corresponding row in the `journeys` table at all, When any product's Roadmap tab is viewed, Then that folder does not appear on any product's roadmap.

**AC3:** Given the journeys-lookup query throws for any reason (e.g., a transient DB error), When the Roadmap tab is requested, Then it renders the existing empty state cleanly (fail closed) rather than erroring or falling back to the old unscoped, show-everything behaviour.

**AC4:** Given a product with zero early-stage artefacts genuinely belonging to it, When its Roadmap tab is viewed, Then the existing empty-state message renders exactly as before — this story must not regress the already-tested empty-state path (`check-a5-roadmap-tab.js`'s existing AC4 coverage).

**AC5:** Given a product WITH at least one genuinely-belonging early-stage artefact, When its Roadmap tab is viewed, Then that entry's title/stage/date render exactly as before — this story must not regress the already-tested happy-path rendering (`check-a5-roadmap-tab.js`'s existing AC1 coverage).

## Out of Scope

- **Any change to `scanRoadmapArtefacts` itself** — stays a pure, unscoped filesystem scan; only its caller changes.
- **Retroactively attributing already-orphaned artefact folders to a product** — if a folder has no journey row, this story does not attempt to recover or infer which product it might have belonged to.
- **The separate, already-logged "no E2E teardown" root cause** — that's why so many stale artefact folders exist on the deployed container's disk in the first place; this story only fixes which product(s) they can incorrectly appear under, not the underlying accumulation.

## NFRs

- **Correctness:** Closes a real data-attribution bug — a product's roadmap must only ever show data that actually belongs to it.
- **Performance:** Negligible — one additional indexed query (`WHERE product_id = $1`) per roadmap page view, same pattern already used elsewhere in this file.

## Complexity Rating

**Rating:** 2 — the fix itself is a small, additive filter, but correctly reasoning about the fail-closed behaviour (AC3) and the no-matching-journey edge case (AC2) requires care, and the existing `check-a5-roadmap-tab.js` suite's own ACs must be verified as unregressed since this story extends a file that test already covers.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)

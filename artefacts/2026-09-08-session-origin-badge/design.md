# Design: Session-Origin Badge

**Status:** Complete
**Feature:** 2026-09-08-session-origin-badge
**Contributors:** Hamish King — Platform Owner; Claude (Sonnet 5) — design drafting, grounded in direct reads of the real rendering/query code for all three surfaces
**Date:** 2026-09-08
**Prior artefacts:** discovery.md, benefit-metric.md

---

## Summary

Add a small tri-state icon (fully session-backed / mixed / no session) to each feature row on the product feature-list page, `/journey`, and org kanban, so an operator can tell at a glance whether a feature's completed stages were driven through a real web chat session (resumable) or authored directly by an agent/CLI (nothing to resume) — without opening the feature. This is a pure read-time derivation over data these pages already load or can load with a one-column addition to an existing query; no new tables, no new writes, no new backend service.

---

## Solution Architecture

### Overview

- One new small pure function (`deriveSessionOrigin(completedStages)`) computes the tri-state from a journey's existing `completedStages[].sessionId` values. Colocated with, or extracted alongside, the existing `_resolveResumeLinksForFeature` logic in `src/web-ui/routes/features.js` so the "what counts as session-backed" rule has one home, not three.
- Each of the three render paths (`products.js`'s `handleGetProductView`, `journey.js`'s `_renderJourneyHome`, `products.js`'s `handleGetOrgKanban`) calls this function once per row, using `completedStages` data that either already flows into that render (`/journey`) or needs one additional JSONB column selected in an existing SQL query that already runs once per page render (product page, org kanban).
- No new bulk-fetch infrastructure needed — verified directly against the real code this session, not assumed. This is a materially simpler build than discovery's stated performance risk implied (see Key technical decisions below).

### Integration points

| System | Interaction type | Direction | Notes |
|--------|-----------------|-----------|-------|
| Postgres `journeys` table | SQL SELECT (existing queries, one added column) | in | Product page's per-product query (`products.js` ~line 2368) and org kanban's per-product-loop query (~line 2912) both already run once per page render; each gains `data->'completedStages' AS completed_stages` |
| `journey-store.js` (`_journeyStore.listJourneys()`) | in-process function call | in | `/journey`'s existing call already returns full journey objects with `completedStages` intact (confirmed by reading `journey-store.js` and `journey-store-pg.js` directly) — no change needed beyond consuming a field already returned |

### Data and state

No new data created, no schema change, no new writes. The tri-state is computed at render time from `completedStages[].sessionId` presence and discarded — never persisted.

### Hosting and runtime

Same as the three pages already touched — existing Node.js request handlers in `src/web-ui/routes/products.js` and `src/web-ui/routes/journey.js`. No new service, no client-side computation (rendered server-side into the existing HTML like every neighbouring indicator on these pages).

### Key technical decisions

| Decision | Choice made | Rationale |
|----------|-------------|-----------|
| Where the tri-state rule lives | One new pure function, single source of truth, called from all three render paths | Avoids reimplementing "what counts as session-backed" three times with a risk of drift between surfaces |
| Product page data source | Extend the existing per-product SQL query to also select `completedStages` | Zero new round trips — the query already runs once per render |
| Org kanban data source | Extend the existing per-product-loop SQL query the same way | Same reasoning; org kanban already queries `journeys` once per product in its existing loop |
| `/journey` data source | No query change | `_journeyStore.listJourneys()` already returns full journey objects |
| Rows with no real journey at all | Only representable where a page already merges a non-journey source — the product page's existing `mergeFeatureSources(taxonomy, features)` (taxonomy-only items carry no `journey_id`). Org kanban and the journeys-table portion of the product page query `FROM journeys` directly, so every row shown there already has a real journey by construction — "no session" cannot occur for those rows today, only "fully" or "mixed" | Verified directly against the real queries in `products.js`, not assumed — see Open Questions and Deferred Decisions |

### Non-functional requirements

| Requirement | Target | Source |
|-------------|--------|--------|
| No per-row query | Zero additional queries beyond the one-column addition to two already-once-per-render queries | Discovery's own stated constraint; resolved by this design, not deferred |
| Graceful degradation | If the completed-stages data is unavailable for a render, omit the icon for that row rather than failing the page | Matches this repo's existing `_enrichColumnsWithArtefactCounts` AC5 precedent (kanban artefact-count badges degrade the same way) |

---

## UX / Interaction Design

### Entry point

No new navigation — the icon sits inline on rows the operator is already viewing on all three existing pages.

### Primary flow

1. Operator opens the product feature-list page (or `/journey`, or org kanban).
2. Each feature/story row shows a small icon alongside its existing stage/health indicators: one glyph for "fully session-backed", a visually distinct glyph for "mixed", and either a neutral/greyed glyph or no icon at all for "no session" (open question #1 below).
3. Hovering/focusing shows a text tooltip naming the exact state (e.g. "All completed stages driven through a live session — resumable" / "Some stages authored via CLI/agent — partially resumable" / "No live session — authored via CLI/agent").
4. No click/drill-down interaction in this story's MVP — it's a glance-only signal; the operator still opens the feature normally to actually resume a stage.

### Edge cases and error states

| Scenario | User-facing behaviour |
|----------|-----------------------|
| Feature has zero completed stages yet (still on Idea/ideation) | No icon shown — nothing to classify yet; this is distinct from "no session" |
| No real journey at all (taxonomy-only row, product page) | Icon shows "no session" — this feature has real pipeline progress, just none of it session-backed |
| Bulk data unavailable (query failure, adapter not wired) | Icon omitted entirely for that render — never blocks or breaks the page |

### Design system

Reuse this repo's existing small-icon/pill conventions already present on these same rows (the health dot, the artefact-count badge from `s2.2`) rather than introducing a new visual language — same font-size, spacing, and `sw-pill`-class treatment as its neighbours.

### Accessibility

The icon must carry a text-equivalent (`title`/`aria-label`), never colour alone — matches this repo's own established fix for the health dot (`pdt-s3`), which already pairs colour with a text label for exactly this reason.

---

## Constraints

- No new Postgres writes or schema change (from discovery).
- Must not introduce a per-row query on list pages (from discovery) — resolved during this design; see Key technical decisions.

---

## Open questions

| # | Question | Owner | Blocking definition? |
|---|----------|-------|----------------------|
| 1 | Exact icon glyphs/visual treatment for the three states — distinct icons, fill-level variants of one icon, or icon + short text label? | Hamish King | No — `/definition` can propose a concrete default; refined at implementation review |
| 2 | Should org kanban and the product page's journeys-table rows eventually surface CLI-authored features with zero journey at all (they're currently invisible on those two surfaces, a separate and larger gap this design surfaced but does not fix)? | Hamish King | No — out of this story's scope; candidate for a future story if wanted |

---

## Deferred decisions

- Extending org-kanban's and the product page's journeys-only SQL queries to also surface CLI-authored features with zero real journey — a bigger, separate visibility gap this design's investigation surfaced (see Key technical decisions and Open Question #2), not something this story fixes. Deferred to a future story if the operator wants it.
- Any click/drill-down interaction on the icon itself — deferred; MVP is glance-only per discovery's MVP scope.

# Decisions: Taxonomy-to-Module Classification

## ARCH — Join key is `feature_slug`, not `journey_id` (2026-07-22)

**Context:** a1/a2 built module classification against `journeys.module_id`. For any product with a connected repo, the real feature/story history lives in `product_rollups.taxonomy` — a JSONB cache computed by `computeTaxonomyRollup()` from `pipeline-state.json` and fully overwritten (not diffed/merged) on every `/product-sync` run. Taxonomy items are never rows in `journeys` — confirmed live on `skills-framework` in staging: the `journeys` table held only 2 auto-generated placeholder rows, 0 of the product's real ~115 features.

**Decision:** The new `feature_module_assignments` table is keyed by `(product_id, feature_slug)`, where `feature_slug` is the same field `computeTaxonomyRollup` already uses as each item's stable identity (`story.slug || story.id` for epic-nested stories, `feature.slug` for top-level features).

**Rationale:** `feature_slug` is the only identity available for a taxonomy item that survives a re-sync, since the JSONB blob containing it is rewritten wholesale each time. A join keyed by `journey_id` would only ever work for the small, mostly-placeholder set of rows that happen to exist in `journeys` — which is exactly the gap this story exists to close. This generalizes to any product with a connected repo, not just `skills-framework`, since every such product's taxonomy is computed the same way.

**Source:** Direct staging investigation this session (`list-features.js` run via `flyctl ssh console` against the real `skills-framework` production data) plus a2's own `decisions.md` ARCH entry and a4's own Task 0 notes, both of which had already flagged this gap without resolving it.

---

## SCOPE — Short-track, with explicit multi-tenant/scale NFRs (2026-07-22)

**Context:** Operator was asked whether to build the missing taxonomy-to-module join now (bigger scope) or treat it as a documented gap. Operator's answer reframed the ask: "we need to ensure that new products are able to have their features classified and viewed by modules... whichever path is right in that context" — followed by a direct instruction to run this as a short-track story, explicitly scoped to cater to NFRs and scale to multi-tenant, multi-product orgs with products with hundreds of features and hundreds of users.

**Decision:** Proceeding via the short-track pipeline (`/test-plan → /definition-of-ready → coding agent`, with a lightweight story + self-review preceding both, per this repo's own established short-track precedent — pcr-s1, stis-s1, jlc-s1, tst-s1). Scale/multi-tenancy/security NFRs are captured explicitly in the story's ACs (AC2-AC4, AC7) and this feature's own `nfr-profile.md`, rather than left implicit.

**Rationale:** This is genuinely new architecture (a new persisted table, a new adapter surface, a render-path change affecting every current and future product) — CLAUDE.md's Artefact-first rule requires a story artefact for exactly this class of change. Short-track (rather than a full discovery→definition→review cycle) is appropriate because the root cause is already fully diagnosed via direct investigation and the fix pattern (D37 adapter extension, chained migration, CSRF-guarded route) is a direct application of conventions already proven in a1/a2/d4 — the genuine novelty is the NFR bar (scale + multi-tenancy), which is addressed by making those NFRs first-class ACs rather than by running a heavier outer-loop process.

**Source:** Operator instruction, this session, 2026-07-22.

---

## IMPLEMENTATION — tmc-s1 build summary (2026-07-22)

**What was built:**
- `feature_module_assignments` table (`server.js`, chained inside `product_modules`'s own migration `.then()`, per the ARCH decision above and this epic's own documented migration-race precedent).
- 4 new `modules-adapter.js` functions: `getFeatureModuleAssignments` (1 query, AC2), `bulkAssignFeaturesToModule` (1 query via `INSERT ... SELECT ... FROM UNNEST($4::varchar[])` with an inline `WHERE EXISTS` module-ownership guard, AC3/AC4), `assignFeatureToModule` (thin single-slug wrapper), `unassignFeature`.
- `deleteModule` extended to null out `feature_module_assignments.module_id` before deleting the module row (AC6), same ordering convention as the existing `journeys` reassignment.
- `groupTaxonomyByModule()` added to `product-rollup.js` — pure join function, taxonomy groups/ungrouped × assignment map × modules list → per-module buckets + Unclassified bucket.
- `_renderProductView` (`products.js`) branches on `hasAnyFeatureModuleAssignments`: zero assignments → byte-identical existing Epics/Other-features render; any assignments → new "Features by module" render via `groupTaxonomyByModule`.
- New route `POST /products/:id/modules/bulk-assign`, CSRF-guarded (AC7), tenant-scoped, wired in `server.js`.

**Test result:** New file `tests/check-tmc-s1-persist-feature-module-classification.js` — 19/19 passing, covering AC1-AC7. Existing a1 (26/26), a2 (11/11), a4 (11/11), pr-s2 (37/37) suites re-run with zero regressions.

**Deviation from test plan:** The test plan's IT1 originally proposed asserting `syncProductRollup` behavior via a mock pool; the actual test built a combined pool (assignment-adapter pool + a `product_rollups` INSERT interceptor) so a single `syncProductRollup` call could be exercised twice with two different mock `pipeline-state.json` payloads in one test, rather than two separate tests — functionally equivalent coverage of AC1, consolidated for clarity.

---

## REVISION — Unify journeys.module_id and feature_module_assignments into a single mechanism (2026-07-22)

**Context:** Post-implementation design review (operator asked "is this the optimal design from scratch?") surfaced three real gaps in the shipped tmc-s1 design:

1. Two parallel module-assignment mechanisms now exist doing the same conceptual job: `journeys.module_id` (a1/a2, keyed by `journey_id`) and `feature_module_assignments` (tmc-s1, keyed by `feature_slug`). `deleteModule` has to null out both tables; `reassignEpic` (a2) and `bulkAssignFeaturesToModule` (tmc-s1) are two separate write paths for one concept.
2. `journeys` already carries a `feature_slug` column (`NOT NULL`, populated by `journey-store-pg.js` on every write) — the exact identity `feature_module_assignments` is keyed by. There was no structural reason for two tables; this was missed during tmc-s1's own implementation because the story was scoped narrowly to the taxonomy gap without re-examining `journeys`' existing schema.
3. The product-view taxonomy section's render gate (`hasAnyFeatureModuleAssignments`) was a *new*, inconsistent convention — a4's own existing epics/journeys section already solved the identical "when to switch from flat to module-grouped" problem using `modules.length === 0` as the gate (module-grouped view appears as soon as any module exists, with an Unassigned/Unclassified bucket for anything not yet assigned — no separate "has anything been assigned yet" condition). tmc-s1's taxonomy section used a different, stricter gate, producing an abrupt one-assignment-flips-the-whole-section jump that a4's own established pattern avoids.
4. No cleanup path for orphaned assignments: since taxonomy is a recomputed JSONB blob (not real rows), an assignment could reference a `feature_slug` no longer present after a resync (feature renamed/removed upstream) and would sit in `feature_module_assignments` indefinitely with nothing to prune it.

**Decision:** Refactor to a single mechanism before merging PR #544 (still draft, unmerged — safe to redesign in place rather than shipping the flawed version and patching later):

- `feature_module_assignments` (keyed by `product_id, feature_slug`) becomes the *only* place module assignment is persisted, for both taxonomy-sourced and journey-sourced features.
- A one-time, idempotent backfill migration copies any existing `journeys.module_id` data into `feature_module_assignments` using `journeys.feature_slug` as the join key (chained after both tables are confirmed created).
- `reassignEpic` (a2) is rewritten to look up the epic's `feature_slug` from `journeys`, then delegate to the same underlying single-row upsert `assignFeatureToModule` uses — one write path, not two.
- `deleteModule` drops its now-redundant `UPDATE journeys SET module_id = NULL` write (the column becomes inert going forward; left in place in the DB for rollback safety, not dropped this story — dropping a column is a heavier, separate migration decision).
- The product-view render gate for the taxonomy section changes from `hasAnyFeatureModuleAssignments` to `modules.length > 0`, mirroring a4's own existing epics-section convention exactly, so both sections in the same page use one consistent "show module view once modules exist at all" rule.
- The journeys/epics render block (a4) is changed to read module assignment via the same `feature_module_assignments` map (keyed by `feature_slug`) instead of `journeys.module_id` directly — one read path for both sections.
- `syncProductRollup` gains an orphan-prune step: after computing the fresh taxonomy, delete any `feature_module_assignments` row for the product whose `feature_slug` is present in neither the new taxonomy nor the product's current `journeys` rows.

**Rationale:** This is the design that should have shipped originally — one join table, one write path, one render-gate convention, and no unbounded accumulation of dead rows. Doing it now (pre-merge) avoids a second migration later once real assignment data exists in production for both mechanisms.

**Scope note:** This revision changes behavior already merged and live in production via a1/a2/a4 (specifically: `reassignEpic`'s internal write path and the epics-section's module-read path) — not just the unmerged tmc-s1 draft. Per this repo's Artefact-first rule, this is recorded here as an explicit, reviewed design decision rather than a silent fix-forward, and ships in the same PR (#544) since it directly supersedes tmc-s1's own initial (flawed) implementation before that PR has merged.

**Source:** Operator instruction, this session, 2026-07-22: "Let's refactor it based on the best robust design."

**Implementation result:** All 4 changes shipped in the same PR (#544, still draft):
- Backfill migration (`server.js`, chained after `feature_module_assignments` table creation) — idempotent `INSERT ... ON CONFLICT DO NOTHING` from `journeys.module_id` into `feature_module_assignments`.
- `reassignEpic` rewritten to look up the journey's `feature_slug`, check the current assignment via `feature_module_assignments`, and delegate the actual write to `bulkAssignFeaturesToModule` — one write path.
- `deleteModule` drops its now-redundant `journeys` UPDATE; only nulls `feature_module_assignments`.
- Taxonomy render gate changed from `hasAnyFeatureModuleAssignments` to `modules.length > 0`; `groupTaxonomyByModule` now pre-seeds a bucket for every module (even empty), matching a4's `featuresHtml` convention exactly — both sections switch together and neither invents a separate "has anything been assigned" condition.
- `pruneOrphanedFeatureModuleAssignments()` added to `product-rollup.js`, called at the end of `syncProductRollup` (best-effort, wrapped in try/catch so a prune failure never blocks the sync write itself); checks both the fresh taxonomy and the product's current `journeys` rows before deleting anything, so a journey-sourced assignment is never mistaken for orphaned just because it's absent from the taxonomy JSONB.

**Test result:** tmc-s1's own test file grew from 19 to 29 tests (added AC8 unification tests and AC9 orphan-cleanup tests). a1 (26/26), a2 (11/11, fake pool and all assertions rewritten to model the unified table instead of `journeys.module_id`), a4 (11/11, one integration test's fake pool updated to model `feature_module_assignments` instead of a `module_id` column on the journeys row) all re-verified passing after the refactor. Full 359-file suite re-run: 37 failed, identical to the established baseline — zero regressions.


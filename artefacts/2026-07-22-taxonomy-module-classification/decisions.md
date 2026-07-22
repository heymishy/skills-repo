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


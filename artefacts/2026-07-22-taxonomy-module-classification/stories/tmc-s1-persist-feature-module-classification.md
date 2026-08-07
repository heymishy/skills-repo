# Story: Persist a feature-to-module join so any product's real synced features can be classified and rendered by module, at multi-tenant/multi-hundred-feature scale

**Epic reference:** None — short-track (per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`), directly follow-on from the `2026-07-21-web-ui-experience-redesign` epic's Epic A (Product View Redesign) stories a1/a2/a4.
**Discovery reference:** None — short-track skips discovery. Root cause was confirmed by direct investigation this session (see Background) rather than a formal discovery pass.
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below.

## Background

a1/a2/a4 (web-ui-experience-redesign epic) built a real Modules primitive (`product_modules` table) and module-grouped rendering, but the join only ever attaches to `journeys.module_id`. For any product connected to a real GitHub repo (the normal case), the actual feature/epic/story history — ~100+ entries for an established product — lives entirely in `product_rollups.taxonomy`, a JSONB cache computed by `computeTaxonomyRollup()` (`src/web-ui/modules/product-rollup.js`) from that repo's `pipeline-state.json` and **rewritten wholesale on every `/product-sync` run**. The `journeys` table, by contrast, holds only manually-created placeholder rows (confirmed live on `skills-framework` in staging: 2 journeys, both auto-generated placeholders, 0 module assignments) — it is not where a synced product's real features live.

Net effect: module-grouped rendering works only for a product's placeholder journeys, never for its real, GitHub-synced feature history — the exact set of things an operator actually wants to classify. This is a real, general gap (confirmed already flagged but not resolved in a2's own `decisions.md` ARCH entry and a4's own Task 0 notes) affecting every current and future product with a connected repo, not just `skills-framework`.

## User Story

As **an operator (or admin) managing a product with a connected repo — potentially one of many products across many tenants, each with hundreds of real synced features**,
I want **each real feature/story from that product's synced taxonomy to be assignable to a Module, with the assignment surviving every future re-sync**,
So that **the module-grouped view reflects a product's actual feature history, not just a handful of unrelated placeholder journeys — and this works the same way for any product, not as a one-off patch for a single product**.

## Benefit Linkage

**Metric moved:** Usability of the Modules primitive shipped in Epic A — today it renders correctly but classifies nothing meaningful for any repo-synced product, making the whole feature effectively inert for real usage.
**How:** Without this fix, the module-grouped view stays permanently empty (or classifies only placeholder journeys) for every product that syncs from a real repo — which is the normal, intended use of this platform. This directly blocks the stated goal of Epic A ("view features grouped by module") for its actual target users. Fixing it makes the whole a1/a2/a4 investment usable in practice, for every current and future product/tenant, not just as a demo.

## Architecture Constraints

- Checked against `.github/architecture-guardrails.md` — no conflicting ADR found.
- Follows this repo's existing D37 injectable-adapter pattern (`modules-adapter.js` already owns the `product_modules` domain — this story extends that same adapter rather than introducing a new one).
- Follows the existing chained-migration convention (`server.js`'s `.then()`-chained `CREATE TABLE` → dependent `ALTER TABLE`/FK) — this story's new table has an FK to `product_modules(id)`, so its migration must be chained after a1's own `product_modules` migration completes, not fired as an independent `_creditsPool.query()` call (see CLAUDE.md's own documented migration-race incident, repeated 3 times already this epic).
- **New ARCH decision this story must record in `decisions.md`:** the join key is `(product_id, feature_slug)`, not `journey_id` — because taxonomy features are never rows in `journeys`, only ephemeral JSONB computed from `pipeline-state.json`. `feature_slug` (already the field `computeTaxonomyRollup` uses as each item's stable identity — `story.slug || story.id` for epic-nested stories, `feature.slug` for top-level features) is the only identity that survives a taxonomy re-sync, since the JSONB blob itself is fully overwritten (not diffed/merged) on every sync.

## Dependencies

- **Upstream:** a1 (`product_modules` table + CRUD adapter), a4 (`computeTaxonomyRollup` groups/ungrouped shape) — both merged and in production.
- **Downstream:** None yet, but this becomes the mechanism any future per-feature classification/reporting story would build on.

## Acceptance Criteria

**AC1 (persistence, survives re-sync):** Given a new `feature_module_assignments` table keyed by `(product_id, feature_slug)` with a `module_id` FK to `product_modules(id) ON DELETE SET NULL`, When a feature is assigned to a module and `/product-sync` (which fully overwrites `product_rollups.taxonomy`) is run again afterward, Then the feature's module assignment is unchanged — proven by a test that assigns, re-runs `syncProductRollup`, and re-reads the assignment.

**AC2 (single-query scale, no N+1):** Given a product with hundreds of taxonomy features, When the product view is rendered, Then exactly one query (`SELECT feature_slug, module_id FROM feature_module_assignments WHERE product_id = $1`) fetches every assignment for that product — never one query per feature — verified by a test asserting query count against a mock pool with 300+ synthetic feature slugs.

**AC3 (bulk assign, not one-by-one):** Given an operator wants to classify many features at once (realistic at 100s-of-features scale — assigning individually is not viable), When a bulk-assign request is submitted with a list of `feature_slug`s and one target `module_id`, Then all listed features are assigned in a single adapter call (one transaction/round-trip, not N sequential calls) — verified by a test asserting exactly one query is issued regardless of list length (tested at 2 and at 250 slugs).

**AC4 (multi-tenant isolation):** Given two different tenants each with their own product and their own feature-module assignments, When tenant B's session attempts to read or bulk-assign against tenant A's `product_id`, Then the request is rejected (product/tenant scoping check fails, matching this repo's existing `product_id`+`tenant_id` WHERE-clause convention already used in `modules-adapter.js`) and zero rows are read or written for tenant A — verified by a dedicated cross-tenant isolation test, same shape as `tests/check-bri-s3.4-cross-tenant-isolation.js`.

**AC5 (rendering, module-grouped taxonomy, consistent gate):** Given a product's taxonomy (from `computeTaxonomyRollup`) and its feature-module assignment map, When the product view renders, Then taxonomy items are grouped by their assigned module (module name as heading) with a distinct "Unclassified" bucket for any feature with no assignment row — and the section switches from the existing epic-phase grouping to module-grouped rendering using the **same gate a4's own epics/journeys section already uses** (`modules.length > 0`, not "at least one assignment exists") so both sections on the page follow one consistent rule and a product with zero modules created renders exactly the existing, unchanged taxonomy/epic-phase grouping (no visual regression).

**AC6 (module deletion reassigns, doesn't orphan, single write path):** Given a module with existing feature assignments is deleted, When `deleteModule` runs, Then every `feature_module_assignments` row referencing it (covering both taxonomy-sourced and journey-sourced features, since both now share the same table per AC8) is explicitly set to `module_id = NULL` (Unclassified) via an explicit `UPDATE` issued *before* the module row is deleted — never left orphaned or silently cascade-deleted.

**AC7 (CSRF-protected mutation):** Given the new bulk-assign route mutates state, When a request is submitted without a valid CSRF token (matching this session's own `csrfGuard` convention, applied to every module-mutating route in a1's fix-forward), Then it is rejected with 403 and no assignment rows are written.

**AC8 (unified mechanism — journeys and taxonomy share one table):** Given `journeys` already carries a `feature_slug` column (`NOT NULL`, populated on every write), When an epic (journey) is reassigned to a module via `reassignEpic`, Then the write goes through the same `feature_module_assignments` table and upsert logic `bulkAssignFeaturesToModule`/`assignFeatureToModule` use — keyed by the journey's `feature_slug`, not a separate `journeys.module_id` write — so there is exactly one persisted module-assignment mechanism for the whole product view, not two. A one-time idempotent migration backfills any pre-existing `journeys.module_id` data into `feature_module_assignments` before this code path goes live.

**AC9 (orphan cleanup on sync):** Given a product's taxonomy is a recomputed JSONB blob (not real rows) that can drop a feature slug across a resync (rename/removal upstream), When `syncProductRollup` runs, Then any `feature_module_assignments` row for that product whose `feature_slug` is present in neither the freshly computed taxonomy nor the product's current `journeys` rows is deleted — no assignment row accumulates indefinitely for a feature that no longer exists anywhere.

## Out of Scope

- Pagination/virtualization of the "Unclassified" bucket UI at extreme scale (1000s of features) — flagged as a likely follow-on if a real product hits that scale; this story's AC2 already ensures the *query* layer scales, only the render-layer list length is deferred.
- Dropping the now-inert `journeys.module_id` column itself — left in place for rollback safety; retiring it is a separate, lower-risk future cleanup once the unified mechanism (AC8) has run in production without issue.
- Auto-classification/suggestion (e.g. inferring a module from feature name/epic) — this story only builds the manual assignment mechanism and its persistence; any "suggest a module" UX is separate future scope.
- Retroactively classifying `skills-framework`'s own real ~115 features — that is a one-off data-seeding action an operator can perform once this mechanism exists, not part of this story's code scope.

## NFRs

- **Performance:** Single indexed query per product render (AC2) — primary key `(product_id, feature_slug)` on the new table serves both the point-lookup and the full-map-fetch pattern with no additional index needed.
- **Scale:** Explicit bulk-assign path (AC3) sized for products with hundreds of features; verified at a 250-slug fixture size, not just 2-3.
- **Multi-tenancy:** Every query/mutation scoped by `(product_id, tenant_id)` (AC4), with a dedicated cross-tenant isolation test — same bar as this repo's existing `bri-s3.4` isolation gate.
- **Security:** New mutating route is CSRF-protected (AC7), reusing the existing `csrfGuard` middleware rather than introducing a new mechanism.
- **Accessibility:** Bulk-assign UI (checkboxes + module-select + submit) must be keyboard-operable and screen-reader labelled — same bar already applied to a1's module CRUD forms.

## Complexity Rating

**Rating:** 2 — some ambiguity (multi-tenant/scale NFRs are new emphasis for this codebase's Modules domain), but the pattern (new table, D37 adapter extension, chained migration, CSRF-guarded route) is a direct application of conventions already proven in a1/a2/d4.
**Scope stability:** Stable — bounded by the ACs above; explicitly excludes pagination and auto-classification scope creep.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

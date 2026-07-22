## Definition of Ready: Persist a feature-to-module join for taxonomy-sourced features

**Story reference:** `artefacts/2026-07-22-taxonomy-module-classification/stories/tmc-s1-persist-feature-module-classification.md`
**Test plan reference:** `artefacts/2026-07-22-taxonomy-module-classification/test-plans/tmc-s1-test-plan.md`
**Assessed by:** Claude (agent)
**Date:** 2026-07-22

---

**CONTRACT REVIEW:** Contract Proposal (see `tmc-s1-dor-contract.md`) reviewed against all 7 ACs and the test plan. No mismatches found — every AC has a named test approach consistent with its Given/When/Then wording, and the contract's "assumptions" section explicitly surfaces the `feature_slug`-stability assumption for scrutiny rather than leaving it implicit. ✅ Contract review passed.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is As/Want/So with a named persona | ✅ | "an operator (or admin) managing a product with a connected repo — potentially one of many products across many tenants, each with hundreds of real synced features" |
| H2 | At least 3 ACs in Given/When/Then | ✅ | 9 ACs (AC8, AC9 added post-implementation per the design-revision addendum in review-1.md) |
| H3 | Every AC has at least one test | ✅ | AC1–AC9 all covered — AC1-AC7 per the original test plan (U1-U7, IT1-IT4); AC8/AC9 covered by the 10 additional tests added during the revision (unified reassignEpic path, orphan-prune) |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage references a named metric | ✅ | "Usability of the Modules primitive shipped in Epic A" |
| H6 | Complexity rated | ✅ | Rating 2 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS, Run 1, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies list a1/a4 (upstream, both merged) — no `schemaDepends` field declared since this story reads `product_modules`/`computeTaxonomyRollup`'s existing JS return shapes, not `pipeline-state.schema.json` fields; no schema mismatch risk exists at that layer |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 3 constraints incl. the new ARCH decision (feature_slug as join key, not journey_id) — carried forward into `decisions.md` below |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs — bulk-assign UI reuses a1's existing form/checkbox rendering class |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-07-22-taxonomy-module-classification/nfr-profile.md` |
| H-NFR-profile | NFR profile presence check | ✅ | Story declares real NFRs (not "None") — profile created above, satisfies the gate |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFRs apply (`regulated: false`) |
| H-NFR3 | Data classification not blank | ✅ | "Internal" (NFR profile) |
| H-ADAPTER | New adapter functions have wiring/scoping ACs | ✅ | AC2 (single-query fetch), AC3 (bulk), AC4 (tenant scoping) all directly address the new adapter surface |

**All hard blocks pass.**

**H-MIG applicability check:** This story's pipeline-state entry does not set `hasMigrationTrack: true` — the new `feature_module_assignments` table is additive-only (`CREATE TABLE IF NOT EXISTS`, no alteration of existing columns, no backfill of existing data), matching the same threshold a1's own `product_modules` table creation used without triggering H-MIG. H-MIG is skipped per its own documented trigger condition.

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | Stable |
| W3 | MEDIUM findings acknowledged | ✅ | — | None raised in review |
| W4 | Verification script reviewed by domain expert | ⚠️ | Script not yet reviewed by a human before coding begins | Operator to review `tmc-s1-verification.md` before/alongside coding — proceeding per operator's own explicit "short track" instruction this turn |
| W5 | No uncertain gap-table items | ✅ | — | Gap table's one LOW item (pagination at 1000+ scale) is explicitly deferred, not uncertain |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Persist a feature-to-module join for taxonomy-sourced features — artefacts/2026-07-22-taxonomy-module-classification/stories/tmc-s1-persist-feature-module-classification.md
Test plan: artefacts/2026-07-22-taxonomy-module-classification/test-plans/tmc-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- New table `feature_module_assignments`, primary key (product_id, feature_slug),
  FK module_id -> product_modules(id) ON DELETE SET NULL. Create it via a
  migration in server.js CHAINED inside product_modules' own .then() (it already
  exists in production) -- do NOT fire it as a second independent
  _creditsPool.query() call. This exact unchained-migration mistake has already
  caused two confirmed live-staging failures this epic (a1, d2/d3) -- do not
  repeat it a third time.
- Extend the EXISTING src/web-ui/adapters/modules-adapter.js -- do not create a
  new adapter file. New functions: getFeatureModuleAssignments,
  assignFeatureToModule, bulkAssignFeaturesToModule, unassignFeature. Extend
  deleteModule to also null out feature_module_assignments rows referencing the
  deleted module, via an explicit UPDATE issued BEFORE the DELETE (same ordering
  convention already used for journeys.module_id in the same function).
- bulkAssignFeaturesToModule MUST issue exactly one query regardless of batch
  size (tested at 2 and 250 slugs) -- use a multi-row upsert, not a loop of
  single-row calls.
- getFeatureModuleAssignments MUST issue exactly one query per call -- tested
  with 300 synthetic slugs.
- Every new adapter function takes and enforces (product_id, tenant_id) scoping,
  matching the existing modules-adapter.js convention exactly.
- The new bulk-assign route (POST /products/:id/modules/bulk-assign) MUST use
  the existing csrfGuard middleware (src/web-ui/middleware/csrf.js), same
  pattern already applied to the other 4 module-mutating routes.
- The product-view render path must fall back to TODAY'S EXACT EXISTING
  taxonomy render when a product has zero feature_module_assignments rows --
  this must be byte-identical (tested), not just visually similar. Module-
  grouped rendering only activates once at least one assignment exists.
- All feature slugs and module names rendered through _escapeHtml.
- Read .github/architecture-guardrails.md and this story's own Architecture
  Constraints section before implementing -- it already records the ARCH
  decision (feature_slug, not journey_id, is the join key) that decisions.md
  needs an entry for.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only (this repo's solo-operator context: the operator IS the tech lead)
**Signed off by:** Hamish King (Founder/Operator) — awareness confirmed via explicit "short track" instruction this turn, with NFR scope (multi-tenant, multi-hundred-feature scale) directly dictated by the operator and captured in this story's ACs/NFR profile before sign-off

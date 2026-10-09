# Definition of Ready Checklist

## Definition of Ready: Feature-to-stage mapping: save mapping with metric key selection

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s2.md
**Test plan reference:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep2-s2-test-plan.md
**Contract proposal:** artefacts/2026-10-05-customer-journey-as-first-class/dor/ep2-s2-dor-contract.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-09

---

## Contract review

✅ **Contract review passed** — the proposed implementation (metric-key sub-view extending `ep2-s1`'s own modal, a transactional upsert handler matching `handlePatchJourneyStagesOrder`'s established pattern, one new route) aligns with all 5 ACs and the test plan's own coverage table. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner (PO / SME / discovery lead)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | All 5 ACs covered, no gaps |
| H4 | Out-of-scope section populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | M2 — Feature-to-stage mapping adoption; M3 — Journey-level metric coverage |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | `review/ep2-s2-review-2.md` — PASS, 0 HIGH findings |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete, gap table "None" |
| H8-ext | Cross-story schema dependency check | ✅ | **schemaDepends:** `prStatus`, `dodStatus` (both present in `pipeline-state.schema.json`) — dependencies `ep2-s1` and `ep5-s1` both show `prStatus: "merged"`, `dodStatus: "complete"` — satisfied |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Story cites ADR-025 (tenant scoping on every insert) and ADR-016 (pipeline-state.json read-only) directly — both genuinely applicable; no HIGH findings in the current review run |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC matches any trigger pattern — confirmed in the test plan's own Step 3a analysis |
| H-NFR | NFR profile exists | ✅ | Story's own NFR section populated inline |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No dedicated NFR profile file required beyond story's own inline NFRs |
| H-NFR-profile | NFR profile presence | ✅ | Story's NFR section fully populated inline — same established handling as every prior story in this feature |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — Approved By: Hamish King — Product Owner / Operator — 2026-10-08 |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | Story's own NFR line ("Injectable adapter for Postgres calls") does not describe anything genuinely new — every write handler in `journeys.js` already receives `pool` as an ordinary dependency-injected parameter, the established non-D37 convention throughout this file. No `setX`/`getX` adapter is introduced. Confirmed at `/test-plan` grounding, not assumed. |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent — no schema change; `feature_customer_journey_stage_mappings` already exists from `ep5-s1`'s own migration |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent; the metric-key sub-view reuses existing CSS custom properties, no new hardcoded colors |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ | `review/ep2-s2-review-2.md` — 0 MEDIUM findings outstanding (review run 2, prior findings from run 1 already resolved) | — |
| W4 | Verification script reviewed by a domain expert | ✅ | Reviewed and signed off by the operator this session, after a correction removing an incorrect stage-card-badge assumption (see Sign-off below) | Hamish King |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table states "None" | — |

No RISK-ACCEPTs required.

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- "Injectable adapter pattern (D37 / ADR-009)" — confirmed NOT applicable: this story's own NFR line referencing D37 is imprecise boilerplate; no new `setX`/`getX` adapter is introduced (see H-ADAPTER above).
- Tenant scoping — every column write (`tenant_id`) and every read-before-write ownership check in the new handler is scoped by `req.session.tenantId`, never request-body-supplied data, matching ADR-025 and this file's own established convention throughout `handlePostJourneyStage`/`handlePatchJourneyStage`/`handlePatchJourneyStagesOrder`.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Feature-to-stage mapping: save mapping with metric key selection -- artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s2.md
Test plan: artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep2-s2-test-plan.md

Goal:
Make every test in the test plan pass (7 tests: 2 unit, 5 integration).
No E2E spec is required for this story. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS -- no new npm dependencies.
- Modify ONLY: src/web-ui/routes/journeys.js (handleGetJourneyCanvas
  gains metricKeys embedding; a NEW handler handlePostFeatureMapping;
  the feature-picker modal's second script block gains a feature-click
  handler, metric-key sub-view toggle, and a Save handler), src/web-ui/server.js
  (ONE new dispatch entry for POST /journeys/:id/stages/:stageId/feature-mappings),
  and a NEW test file tests/check-ep2-s2-feature-mapping-save.js.
- CRITICAL -- AC5 cross-tenant response is 404, NOT 403 (the story's own
  AC5 text was corrected at grounding time -- see decisions.md D13).
  Check journey+stage ownership via req.session.tenantId BEFORE opening
  any transaction, matching handlePatchJourneyStagesOrder's own exact
  precedent (journeys.js, function handlePatchJourneyStagesOrder).
- CRITICAL -- the mappings table (feature_customer_journey_stage_mappings,
  already created by ep5-s1's migration) has NO unique constraint on
  (journey_stage_id, feature_slug). Do NOT attempt INSERT ... ON CONFLICT
  -- it will not work. AC4's "exactly one row, latest wins" requirement
  MUST be implemented as: pool.connect() -> BEGIN -> SELECT id FROM
  feature_customer_journey_stage_mappings WHERE journey_stage_id = $1
  AND feature_slug = $2 AND tenant_id = $3 FOR UPDATE -> if a row is
  found, UPDATE its metric_keys; if not, INSERT a new row -> COMMIT,
  with ROLLBACK in the catch branch and client.release() in finally --
  matching handlePatchJourneyStagesOrder's own transactional pattern
  exactly (same file, read it directly for the precedent).
- CRITICAL -- no new D37 injectable adapter. Use the existing pool
  parameter already passed into every handler in this file, exactly
  like every other write handler here. Do not add a new setX/getX
  module.
- CRITICAL -- this story adds NO visible stage-card UI change after a
  successful save (no badge, no annotation). That is a separate, later
  story's own scope (Delivery view annotation rows). After a successful
  save, simply close the modal -- same close behaviour ep2-s1 already
  built for closing without selecting.
- The metric-key sub-view reads each feature's own optional metricKeys
  array (string[]) from pipeline-state.json -- a NEW field nothing
  currently writes (decisions.md D12). When absent or empty, render the
  exact text "No metrics recorded", never an empty/blank list.
- journeyId and csrfToken (already available in ep2-s1's FIRST script
  block's own closure) must be duplicated into the SECOND script block
  ep2-s1 added (separate IIFE, no shared scope) -- do not try to share
  them across the two <script> tags.
- The target stageId for a save comes from the data-stage-id attribute
  already present on the .sw-stage-map-feature trigger button -- capture
  it when fpOpen(trigger) runs (already exists from ep2-s1), store it in
  a new fpStageId variable in the same script block.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. ADR-025 (tenant_id scoping on every insert) and ADR-016
  (pipeline-state.json read-only, metric keys sourced from it, never
  written back) both apply.
- Open a draft PR when all tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for
  review.

Oversight level: High
```

---

## Sign-off

**Oversight level:** High (per the parent epic's own "Human Oversight Level: High" declaration — `artefacts/2026-10-05-customer-journey-as-first-class/epics/feature-mapping-and-delivery-view.md`)
**Sign-off required:** Yes — named human sign-off before assigning to the coding agent.
**Signed off by:** Hamish King — Product Owner / Operator — 2026-10-09. Confirmed the corrected AC verification script (`artefacts/2026-10-05-customer-journey-as-first-class/verification-scripts/ep2-s2-verification.md`) correctly describes the intended behaviour and approved proceeding to the coding agent.

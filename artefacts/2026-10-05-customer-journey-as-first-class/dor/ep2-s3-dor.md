# Definition of Ready Checklist

## Definition of Ready: Delivery view: feature and metric annotation rows on stage cards

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s3.md
**Test plan reference:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep2-s3-test-plan.md
**Verification script:** artefacts/2026-10-05-customer-journey-as-first-class/verification-scripts/ep2-s3-verification.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-10

---

## Contract review

✅ **Contract review passed** — the proposed implementation (a new 3-way view-toggle control, a new mappings query joined against `pipeline-state.json` features, a new narrow `DELETE` route for orphaned mappings) aligns with all 4 ACs and the test plan's own coverage table. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Tech lead / squad lead" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | All 4 ACs covered, no gaps |
| H4 | Out-of-scope section populated | ✅ | 4 items, one corrected at grounding time (D16) to carve out the orphaned-mapping removal exception |
| H5 | Benefit linkage references a named metric | ✅ | M2 (Feature-to-stage mapping adoption — AC1 (Acceptance Criterion 1): Delivery view shows mapped features and metric values); M3 (Journey-level metric coverage — metric values displayed at the relevant stage) |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | `review/ep2-s3-review-1.md` — PASS, 0 HIGH findings |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete, gap table "None" |
| H8-ext | Cross-story schema dependency check | ✅ | **schemaDepends:** `prStatus`, `dodStatus` — dependency `ep2-s2` shows `prStatus: "merged"`, `dodStatus: "complete"` — satisfied |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Story cites the client-side view-toggle design decision (`design.md`) directly; no HIGH findings in the current review run |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | AC3's view toggle is a pure CSS-class swap, no visual-alignment/breakpoint/pixel assertion — confirmed in the test plan's own Step 3a analysis; covered by a jsdom behavioral test |
| H-NFR | NFR profile exists | ✅ | Story's own NFR section populated inline |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No dedicated NFR profile file required beyond story's own inline NFRs |
| H-NFR-profile | NFR profile presence | ✅ | Story's NFR section fully populated inline — same established handling as every prior story in this feature |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — Approved By: Hamish King — Product Owner / Operator — 2026-10-08 |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | The new `DELETE` handler receives `pool` as an ordinary parameter, matching every other handler in this file. No `setX`/`getX` adapter introduced. |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent — no schema change; this story only reads/deletes existing rows in `feature_customer_journey_stage_mappings` |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent; the view toggle and annotation rows reuse existing CSS custom properties (`var(--surface)`, `var(--ink)`, etc.), no new hardcoded colors |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ | `review/ep2-s3-review-1.md` — 0 MEDIUM findings outstanding | — |
| W4 | Verification script reviewed by a domain expert | ✅ | Reviewed and signed off by the operator this session (see Sign-off below) | Hamish King |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table states "None" | — |
| W6 | New scope added at grounding time (D15, D16) acknowledged | ✅ | D15 (new optional `feature.metricValues` field, mirrors D12) and D16 (narrow `DELETE` route for orphaned mappings, increasing scope over the story's original Out of Scope wording) both operator-confirmed on 2026-10-10 | Hamish King |

No RISK-ACCEPTs required.

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- "Injectable adapter pattern (D37 / ADR-009)" — confirmed NOT applicable: no new `setX`/`getX` adapter introduced (see H-ADAPTER above).
- Tenant scoping — the new `DELETE` route's ownership check (journey + stage scoped by `req.session.tenantId`, before any mutation) matches ADR-025 and this file's own established convention, reusing `handlePostFeatureMapping`'s own precedent exactly.
- 404-not-403 cross-tenant policy (D13) — the new `DELETE` route returns 404 for a cross-tenant mapping id, not 403, matching every other mutating handler in `journeys.js`.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Delivery view: feature and metric annotation rows on stage cards -- artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s3.md
Test plan: artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep2-s3-test-plan.md

Goal:
Make every test in the test plan pass (9 tests: 3 unit, 6 integration).
No E2E spec is required for this story (AC3's view toggle is a pure CSS-class
swap, covered by a jsdom behavioral test). Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS -- no new npm dependencies.
- Modify ONLY: src/web-ui/routes/journeys.js (handleGetJourneyCanvas gains:
  a new mappings query joined against the already-read pipeline-state.json
  features list; a 3-way view-toggle control (Canvas/Customer
  experience/Delivery); per-stage annotation-row markup; a NEW handler
  handleDeleteFeatureMapping), src/web-ui/server.js (ONE new dispatch entry
  for DELETE /journeys/:id/stages/:stageId/feature-mappings/:mappingId), and
  a NEW test file tests/check-ep2-s3-delivery-view.js.
- CRITICAL -- the mappings query is `SELECT id, journey_stage_id,
  feature_slug, metric_keys FROM feature_customer_journey_stage_mappings
  WHERE journey_id = $1`. No separate tenant filter is needed on this
  query -- the journey's own tenant ownership is already verified earlier
  in handleGetJourneyCanvas (the existing customer_journeys ownership
  SELECT that 404s before any stage data is read). Do NOT add a redundant
  tenant_id filter here; do NOT skip the existing earlier check either.
- CRITICAL -- join each mapping's feature_slug against the ALREADY-READ
  features array (from pipeline-state.json, read earlier in this same
  handler for the feature picker). If no feature in that array has a
  matching slug, render "Feature not found (slug)" with a Remove button
  (data-mapping-id, data-stage-id) -- do NOT make a second file read.
- Each feature's own optional metricValues field (string/number values
  keyed by metric key, decisions.md D15) is read the same way metricKeys
  already is (ep2-s2) -- embed it alongside metricKeys for each feature,
  keyed by real slug. When a mapping's own metric_keys entry has no
  matching metricValues key, render "No value recorded" for that one key
  specifically -- do not fail the whole annotation row.
- CRITICAL -- the DELETE route: check ownership (journey_stage_id's own
  journey tenant_id == req.session.tenantId) via a SELECT BEFORE any
  DELETE statement runs, returning 404 (not 403) if ownership fails --
  matching handlePostFeatureMapping's own exact precedent (same file,
  read it directly). Delete by mapping id (`DELETE FROM
  feature_customer_journey_stage_mappings WHERE id = $1`), not by
  feature_slug (a stage could theoretically have a future second mapping
  to the same feature after a remap -- deleting by id is unambiguous).
- The view toggle: build 3 buttons (Canvas/Customer experience/Delivery),
  each setting a CSS class on the canvas container (e.g.
  sw-journey-canvas--view-delivery) on click, no fetch/network call.
  Annotation rows are shown/hidden via that class alone. "Customer
  experience" view currently reveals no extra content (ep3-s1's own
  future scope) -- the button and class-switch must still work without
  error, just with nothing new to show yet.
- CRITICAL -- no new D37 injectable adapter. Use the existing pool
  parameter already passed into every handler in this file.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. ADR-025 (tenant_id scoping) and ADR-016 (pipeline-state.json
  read-only) both apply.
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
**Signed off by:** Hamish King — Product Owner / Operator — 2026-10-10. Confirmed proceeding to the coding agent.

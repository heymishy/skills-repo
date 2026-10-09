# Definition of Ready Checklist

## Definition of Ready: Customer experience view: emotion, pain points, opportunities annotation rows

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep3-s1.md
**Test plan reference:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep3-s1-test-plan.md
**Verification script:** artefacts/2026-10-05-customer-journey-as-first-class/verification-scripts/ep3-s1-verification.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-10

---

## Contract review

✅ **Contract review passed** — the proposed implementation (a new annotation block reusing `ep2-s3`'s own existing view-toggle CSS pattern, reading already-existing `emotion`/`pain_points`/`opportunities` columns, no new query or route) aligns with all 4 ACs and the test plan's own coverage table. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner (PO / SME / discovery lead)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | All 4 ACs covered, no gaps |
| H4 | Out-of-scope section populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | M1 (Journey adoption) |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | `review/ep3-s1-review-1.md` — PASS, 0 HIGH findings |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete, gap table "None" |
| H8-ext | Cross-story schema dependency check | ✅ | **schemaDepends:** `prStatus`, `dodStatus` — dependencies `ep1-s3` and `ep2-s3` both show `prStatus: "merged"`, `dodStatus: "complete"` — satisfied |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Story cites the client-side view-toggle design decision and MC-A11Y-02 (colour-chip-plus-text-label) directly; no HIGH findings in the current review run |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC matches any trigger pattern — AC3's toggle reuses `ep2-s3`'s own already-proven-generic CSS-class mechanism |
| H-NFR | NFR profile exists | ✅ | Story's own NFR section populated inline |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No dedicated NFR profile file required beyond story's own inline NFRs |
| H-NFR-profile | NFR profile presence | ✅ | Story's NFR section fully populated inline |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — Approved By: Hamish King — Product Owner / Operator — 2026-10-08 |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter — pure read of already-existing columns, no new write path |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent — `emotion`/`pain_points`/`opportunities` columns already exist from `ep1-s3`'s own migration |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent; emotion chip colors reuse existing semantic CSS custom properties (`--success`/`--danger`/`--warn`/`--ink-2`), no new hardcoded colors |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ | `review/ep3-s1-review-1.md` — 0 MEDIUM findings outstanding | — |
| W4 | Verification script reviewed by a domain expert | ✅ | Reviewed this session; no corrections needed (unlike `ep2-s2`'s/`ep2-s3`'s own verification scripts, no scope-boundary assumption errors found) | — |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table states "None" | — |

No RISK-ACCEPTs required.

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- "Injectable adapter pattern (D37 / ADR-009)" — confirmed NOT applicable: no new adapter, no new write path.
- MC-A11Y-02 (colour not used alone) — the emotion annotation row must render both a colour-coded chip element AND the literal enum text label, confirmed as a dedicated AC (AC4) and a dedicated test.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Customer experience view: emotion, pain points, opportunities annotation rows -- artefacts/2026-10-05-customer-journey-as-first-class/stories/ep3-s1.md
Test plan: artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep3-s1-test-plan.md

Goal:
Make every test in the test plan pass (4 tests: 3 unit, 1 jsdom behavioral).
No E2E spec is required for this story. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS -- no new npm dependencies.
- Modify ONLY: src/web-ui/routes/journeys.js (handleGetJourneyCanvas's
  stagesHtml map gains a new sibling annotation block per stage; the
  existing <style> block gains new CSS rules; NO new query, NO new
  route, NO new <script> handler needed -- the view toggle and its
  click handler already exist from ep2-s3 and are already fully
  generic), and a NEW test file
  tests/check-ep3-s1-customer-experience-view.js.
- CRITICAL -- emotion/pain_points/opportunities are already selected
  by the existing stages query (journeys.js, the SELECT ... FROM
  customer_journey_stages query) -- do NOT add a new query or touch
  that SELECT statement. Read s.emotion/s.pain_points/s.opportunities
  directly from the already-fetched stage row inside the existing
  stages.map(...) callback.
- CRITICAL -- the "Customer experience" view-toggle button
  (data-view="customer-experience") and its click handler already
  exist in the first <script> block (built by ep2-s3, Task 2) and are
  already fully generic (work for any data-view value via
  getAttribute). Do NOT add a second click handler or duplicate toggle
  markup -- only add the new CSS rule pairing
  .sw-journey-canvas--view-customer-experience with a new
  .sw-stage-annotations--customer-experience class, exactly mirroring
  ep2-s3's own .sw-journey-canvas--view-delivery /
  .sw-stage-annotations--delivery pair.
- Emotion enum values (STAGE_EMOTION_VALUES, already defined in this
  file): ['positive', 'neutral', 'negative', 'mixed']. Render a colour
  chip (reuse --success for positive, --danger for negative, --warn
  for mixed, --ink-2 for neutral -- all already-defined CSS custom
  properties in this codebase) PLUS the literal enum text as a visible
  label -- never colour alone (MC-A11Y-02, this story's own AC4). When
  emotion is null, render "Not set" instead (no chip).
- pain_points and opportunities: render the raw text value, or the
  exact text "Not set" when null/empty -- never omit the row entirely
  (AC2).
- Architecture standards: read .github/architecture-guardrails.md
  before implementing. No new ADR applies beyond what ep2-s3 already
  established for this canvas page.
- Open a draft PR when all tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for
  review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium (per the parent epic's own "Human Oversight Level: Medium" declaration — `artefacts/2026-10-05-customer-journey-as-first-class/epics/journey-health-and-customer-experience-views.md`)
**Sign-off required:** No — Medium oversight requires only that the DoR artefact be shared with the tech lead before assigning to the coding agent; no formal named sign-off. This repo's own `context.yml` has no `roles.tech_lead` configured (solo/small-operator repo), so this reduces to the operator's own confirmation that they've reviewed this DoR before proceeding.
**Confirmed by:** Hamish King — Product Owner / Operator — 2026-10-10. Confirmed proceeding to the coding agent.

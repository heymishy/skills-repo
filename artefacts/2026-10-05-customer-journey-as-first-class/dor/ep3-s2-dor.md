# Definition of Ready Checklist

## Definition of Ready: Journey health indicators: per-stage health state and summary bar

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep3-s2.md
**Test plan reference:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep3-s2-test-plan.md
**Verification script:** artefacts/2026-10-05-customer-journey-as-first-class/verification-scripts/ep3-s2-verification.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-10

---

## Contract review

✅ **Contract review passed** — the proposed implementation (health computation reusing `ep2-s3`'s own already-fetched mapping data, new SVG icon constants matching the established design-system pattern, a `window.location.reload()` addition to two previously-shipped handlers) aligns with all 6 ACs and the test plan's own coverage table. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Tech lead / squad lead" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 6 ACs |
| H3 | Every AC has ≥1 test | ✅ | All 6 ACs covered (AC5 via AC1/AC2/AC3's own assertions), no gaps |
| H4 | Out-of-scope section populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | M3 (Journey-level metric coverage) |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | `review/ep3-s2-review-1.md` — PASS, 0 HIGH findings |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete, gap table "None" |
| H8-ext | Cross-story schema dependency check | ✅ | **schemaDepends:** `prStatus`, `dodStatus` — dependencies `ep2-s2` and `ep3-s1` both show `prStatus: "merged"`, `dodStatus: "complete"` — satisfied |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Story cites "icon + label, not colour alone (MC-A11Y-02)" and "server-side at render time" directly; no HIGH findings in the current review run |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC matches any trigger pattern — confirmed in the test plan's own Step 3a analysis |
| H-NFR | NFR profile exists | ✅ | Story's own NFR section populated inline |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No dedicated NFR profile file required beyond story's own inline NFRs |
| H-NFR-profile | NFR profile presence | ✅ | Story's NFR section fully populated inline |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — Approved By: Hamish King — Product Owner / Operator — 2026-10-08 |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter — pure computation over already-fetched data, no new write path |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent — no schema change |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent; new icons follow the established 20×20/1.5px-stroke SVG pattern and reuse existing semantic CSS custom properties (`--success`/`--warn`/`--danger`), no new hardcoded colors |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ | `review/ep3-s2-review-1.md` — 0 MEDIUM findings outstanding | — |
| W4 | Verification script reviewed by a domain expert | ✅ | Reviewed this session | — |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table states "None" | — |
| W6 | New scope touching previously-shipped code, acknowledged | ✅ | AC6's `window.location.reload()` addition modifies `ep2-s2`'s Save-mapping handler and `ep2-s3`'s Remove-mapping handler, both already merged. Operator-confirmed 2026-10-10 (preferred over correcting AC6 to describe a manual refresh instead) | Hamish King |

No RISK-ACCEPTs required.

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- "Injectable adapter pattern (D37 / ADR-009)" — confirmed NOT applicable: no new adapter.
- MC-A11Y-02 (colour not used alone) — each health state's icon must be paired with a real accessible label, confirmed as a dedicated AC (AC5) and asserted within AC1/AC2/AC3's own tests.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Journey health indicators: per-stage health state and summary bar -- artefacts/2026-10-05-customer-journey-as-first-class/stories/ep3-s2.md
Test plan: artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep3-s2-test-plan.md

Goal:
Make every test in the test plan pass (6 tests: 4 unit, 2 integration/
jsdom behavioral). Do not add scope, behaviour, or structure beyond what
the tests and ACs specify.

Constraints:
- Node.js, CommonJS -- no new npm dependencies.
- Modify ONLY: src/web-ui/routes/journeys.js (handleGetJourneyCanvas gains
  a health-computation helper, new CHECK_ICON/CLOSE_ICON constants
  alongside the existing MOMENT_OF_TRUTH_ICON/ARROW_UP_ICON/
  ARROW_DOWN_ICON/WARNING_ICON, a per-stage health indicator in the
  stage card markup, a summary bar, and a window.location.reload() call
  added to the existing Save-mapping and Remove-mapping client-side
  success handlers), and a NEW test file
  tests/check-ep3-s2-journey-health.js. Do NOT touch server.js -- no new
  route or query.
- CRITICAL -- health computation uses ONLY the already-fetched
  mappingsByStage data (built by ep2-s3, from the existing
  feature_customer_journey_stage_mappings query). Do NOT add a new
  query. Per stage: zero mappings => none (❌); >=1 mapping, none with
  metric_keys.length > 0 => partial (⚠️); >=1 mapping with at least one
  having metric_keys.length > 0 => covered (✅).
- CRITICAL -- use SVG icons, not unicode glyphs, per DESIGN.md's own
  "no unicode glyphs in new work" rule (already enforced twice this
  session). Define CHECK_ICON and CLOSE_ICON matching the existing
  MOMENT_OF_TRUTH_ICON/WARNING_ICON style exactly (20x20 viewBox,
  1.5px stroke, round caps/joins). REUSE the existing WARNING_ICON
  constant (already defined by ep2-s3) for the ⚠️ state -- do not
  redefine it. Colour each icon via the existing --success/--warn/
  --danger CSS custom properties.
- CRITICAL -- every health indicator must pair its icon with a real
  accessible label (aria-label or equivalent visible text), never an
  icon alone (MC-A11Y-02, AC5).
- CRITICAL -- the summary bar text must be the exact string
  "X of Y stages have metric coverage" where X counts ONLY covered
  (✅) stages and Y is the total stage count regardless of health state.
- CRITICAL -- AC6: add window.location.reload() to the EXISTING
  Save-mapping success handler (ep2-s2, after the existing fpCloseFn()
  call) and the EXISTING Remove-mapping success handler (ep2-s3, after
  the existing row-removal code). This is a deliberate, operator-
  confirmed modification to two already-shipped handlers -- do not
  skip it or treat it as out of scope. Do not add any OTHER behavioural
  change to either handler.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. No new ADR applies beyond what ep2-s3 already
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

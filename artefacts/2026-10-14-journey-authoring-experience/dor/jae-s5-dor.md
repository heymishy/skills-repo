# Definition of Ready: Restructure the Delivery view from a per-stage card stack into a swimlane grid

**Story reference:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s5.md
**Test plan reference:** artefacts/2026-10-14-journey-authoring-experience/test-plans/jae-s5-test-plan.md
**Contract reference:** artefacts/2026-10-14-journey-authoring-experience/dor/jae-s5-dor-contract.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-10-15

---

## Contract review

Contract Proposal (see `jae-s5-dor-contract.md`) checked against all 8 story ACs and the test plan's AC coverage table — no mismatches found. ✅ **Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "outer loop practitioner (PO / SME / discovery lead) reviewing delivery coverage for a journey" — named, not generic. |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 8 ACs, all Given/When/Then. |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC8 all covered; see AC Coverage table in the test plan. |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 5 items. |
| H5 | Benefit linkage field references a named metric | ✅ | M3 — Operator CX judgment of the authoring flow (broadened per epic's own benefit-metrics section). |
| H6 | Complexity is rated | ✅ | Rating 2 (raised from 1 at `/review` run 1, finding 1-H2, to reflect the CX-refactor regression surface). |
| H7 | No unresolved HIGH findings from the review report | ✅ | `review/jae-s5-review-2.md` — PASS, 0 findings. Run 1's 2 HIGH findings both resolved and verified in run 2. |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | Test plan: "No gaps." |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block names `jcx-s6`/`jcx-s7` (not "None"); `schemaDepends: []` declared in the contract with rationale — the dependency is on shipped code, not a `pipeline-state.json` schema field. No field to check against the schema. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated (ADR-026, ADR-028); `/review` run 2 Category E score 5, 0 findings. |
| H-E2E | If any AC is `CSS-layout-dependent` AND no E2E tooling AND no RISK-ACCEPT — block | ✅ | AC1 (partial) and AC8 are CSS-layout-dependent; Playwright is configured (ADR-018) and real E2E tests are written for both (test plan). Condition for blocking does not apply. |
| H-NFR | NFR profile exists or story has `NFRs: None` | ✅ | `artefacts/2026-10-14-journey-authoring-experience/nfr-profile.md` exists; jae-s5 rows added (Performance, Security, Accessibility). |
| H-NFR2 | Compliance NFR with named regulatory clause has documented sign-off | ✅ (N/A) | NFR profile Compliance section: "None" — `meta.regulated: false`, no framework applies. |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | "Internal — non-public but low sensitivity" — checked. |
| H-NFR-profile | NFR profile presence check (B1-enforce) | ✅ | Story NFR section is populated (not None/blank); feature NFR profile exists. |
| H-GOV | `## Approved By` section has ≥1 non-blank, non-engineering-only entry | ✅ | `discovery.md`: "Hamish King — Platform Owner — 2026-10-14" — non-engineering role. Positive M1 signal recorded. |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ (N/A) | This story introduces no injectable adapter (`setX()` function) — skip. |
| H-INF | Infra-plan gate (inf.4) | ✅ (N/A) | `hasInfraTrack` absent on this feature — skipped. |
| H-MIG | Migration-review gate (mig.3) | ✅ (N/A) | `hasMigrationTrack` absent on this feature — skipped. |
| H-DESIGN | Design-token compliance gate (dsa.5) | ✅ (N/A) | `hasDesignSystemTrack` absent on this feature — skipped. |

**All hard blocks pass. 15/15 (4 N/A, correctly skipped per their own trigger conditions).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified (or "None — confirmed") | ✅ | — | N/A — populated |
| W2 | Scope stability declared | ✅ | — | N/A — "Stable" |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | N/A — `/review` run 2 has zero findings of any severity |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No second reviewer — solo-operator repo | Hamish King (Platform Owner), via the repo-wide W4 RISK-ACCEPT posture (`architecture-guardrails.md`), logged in `decisions.md` 2026-10-15 — first W4 log for this feature, applies to all its stories |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — | N/A — test plan: "No gaps" |

---

## Standards injection

Domain tags: `[web-ui, ui]`

(Checked against `.github/standards/index.yml` — see Coding Agent Instructions below for the resolved standards files, if any matched.)

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Restructure the Delivery view from a per-stage card stack into a swimlane grid — artefacts/2026-10-14-journey-authoring-experience/stories/jae-s5.md
Test plan: artefacts/2026-10-14-journey-authoring-experience/test-plans/jae-s5-test-plan.md
Contract: artefacts/2026-10-14-journey-authoring-experience/dor/jae-s5-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Sequencing (mandatory — not folded into one task):
1. FIRST: refactor buildCustomerExperienceSwimlaneGrid in src/web-ui/routes/journeys.js
   to extract buildSwimlaneGridShell per the Architecture Constraints. Run
   check-jcx-s6-swimlane-grid.js and tests/e2e/jcx-s6-swimlane-grid.spec.js
   and confirm both pass UNCHANGED before writing any Delivery-specific code.
   This establishes the refactor is behaviour-preserving in isolation.
2. THEN: build buildDeliverySwimlaneGrid calling the shared builder, remove
   #sw-journey-stages and its stagesHtml card-loop and its two display:none
   CSS rules, wire the Delivery view toggle to the new function.
3. THEN: write tests/check-jae-s5-delivery-swimlane-grid.js (7 unit + 1
   integration per the test plan) and tests/e2e/jae-s5-delivery-swimlane-grid.spec.js
   (modelled on tests/e2e/jcx-s6-swimlane-grid.spec.js).

Constraints:
- Match this codebase's existing conventions in journeys.js exactly (string-
  concatenation HTML building, escHtml() on all interpolated values, existing
  naming conventions for sw-* classes).
- Do not modify the feature-picker modal, placeholder-add-form fields, the
  reorder endpoint, or any mapping/placeholder route — read-only reuse only.
- Do not change buildCustomerExperienceSwimlaneGrid's own rendered output —
  its existing test suite is the regression gate for the refactor.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing, specifically ADR-026 and ADR-028 (cited in this story's own
  Architecture Constraints). Do not introduce a second independent grid-
  mechanics derivation.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: High (solo-operator repo-wide posture — see Sign-off below)
```

---

## Sign-off

**Oversight level:** High — per `architecture-guardrails.md`'s "Solo operator / W4 RISK-ACCEPT posture" (human oversight defaults to High in this operating context, superseding the epic's own Medium label, which was set before that repo-wide posture was applied here).
**Sign-off required:** Yes
**Signed off by:** _Pending — awaiting Hamish King's "Proceed: Yes"._

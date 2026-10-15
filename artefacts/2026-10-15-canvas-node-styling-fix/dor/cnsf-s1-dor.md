# Definition of Ready: Override drawflow's vendor-default node/port/connector colours with the app's own design tokens

**Story reference:** artefacts/2026-10-15-canvas-node-styling-fix/stories/cnsf-s1-canvas-node-token-styling.md
**Test plan reference:** artefacts/2026-10-15-canvas-node-styling-fix/test-plans/cnsf-s1-test-plan.md
**Contract reference:** artefacts/2026-10-15-canvas-node-styling-fix/dor/cnsf-s1-dor-contract.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-10-15

---

## Contract review

Contract Proposal checked against all 6 ACs and the test plan's AC coverage table — no mismatches. ✅ **Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "an operator viewing a journey's Canvas view" |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 6 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1–AC5 each have unit (+integration for AC1–AC4); AC6 is a classification note |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | Operational/design-quality fix, stated directly (short-track) |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | `review/cnsf-s1-review-1.md` PASS, 0 findings |
| H8 | Test plan has no uncovered ACs | ✅ | Test plan: "No gaps" |
| H8-ext | Cross-story schema dependency | ✅ (N/A) | Dependencies: "None" — not triggered |
| H9 | Architecture Constraints populated; no Cat. E HIGH | ✅ | Populated, reviewed PASS (score 5) |
| H-E2E | CSS-layout-dependent AC without tooling/RISK-ACCEPT | ✅ (N/A) | AC6 confirms no layout dependency — condition does not apply |
| H-NFR | NFR profile or `NFRs: None` | ✅ | Story: "None — confirmed" |
| H-NFR2 | Compliance NFR sign-off | ✅ (N/A) | No compliance NFR named |
| H-NFR3 | Data classification populated | ✅ (N/A) | No NFR profile needed (story NFRs are "None") |
| H-NFR-profile | NFR profile presence | ✅ (N/A) | Story NFR section is "None" — check does not trigger |
| H-GOV | Discovery `## Approved By` | ⚠️ **See `decisions.md` GAP entry (2026-10-15)** | No discovery artefact — short-track skips `/discovery` by design, same precedent as `pcr-s1`/`stis-s1` (3rd occurrence of this known skill gap) |
| H-ADAPTER | D37 adapter wiring | ✅ (N/A) | No injectable adapter introduced |
| H-INF | Infra-plan gate | ✅ (N/A) | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ (N/A) | `hasMigrationTrack` not set |
| H-DESIGN | Design-token compliance | ✅ (N/A) | `hasDesignSystemTrack` not set |

**All hard blocks pass — with the H-GOV note recorded transparently, per established precedent.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | N/A |
| W2 | Scope stability declared | ✅ | — | N/A — "Stable" |
| W3 | MEDIUM review findings acknowledged | ✅ | — | N/A — 0 findings of any severity |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No second reviewer — solo-operator repo | Covered by the standing W4 RISK-ACCEPT posture already logged once for `2026-10-14-journey-authoring-experience`; this is a different feature slug, so logging a fresh, feature-scoped entry below rather than assuming it carries over |
| W5 | No UNCERTAIN gap-table items | ✅ | — | N/A — "No gaps" |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Override drawflow's vendor-default node/port/connector colours with the app's own design tokens — artefacts/2026-10-15-canvas-node-styling-fix/stories/cnsf-s1-canvas-node-token-styling.md
Test plan: artefacts/2026-10-15-canvas-node-styling-fix/test-plans/cnsf-s1-test-plan.md
Contract: artefacts/2026-10-15-canvas-node-styling-fix/dor/cnsf-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Add exactly 4 CSS override rules
to the existing style block in handleGetJourneyCanvas (journeys.js).
Do not add scope beyond what the ACs specify.

Constraints:
- CSS-only change: no markup, no JS, no new file except the test file.
- Do not touch node_modules/drawflow or /vendor/drawflow.min.css.
- Do not change node width, padding, position, or content.
- Use var(--surface)/var(--line)/var(--ink)/var(--accent)/var(--accent-soft)
  only — no new token, no hard-coded hex value.
- Open a draft PR when tests pass — do not mark ready for review.

Oversight level: High (solo-operator repo-wide posture — see Sign-off below)
```

---

## Sign-off

**Oversight level:** High — per `architecture-guardrails.md`'s "Solo operator / W4 RISK-ACCEPT posture": oversight defaults to High for every story in this operating model, explicitly "not because complexity demands it." This story's own low complexity (rating 1) does not create a Low-oversight exception to that uniform policy — corrected here after initially (incorrectly) rating it Low.
**Sign-off required:** Yes.
**Signed off by:** Hamish King (Platform Owner) — 2026-10-15, via direct `AskUserQuestion` reply ("Proceed").

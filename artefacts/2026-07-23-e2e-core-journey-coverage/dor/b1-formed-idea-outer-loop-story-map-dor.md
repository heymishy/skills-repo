## Definition of Ready: Drive the formed-idea outer loop to DoR and assert the /definition story-map canvas, close/resume mid-SSE

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/b1-formed-idea-outer-loop-story-map.md
**Test plan reference:** artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/b1-formed-idea-outer-loop-story-map-test-plan.md
**Contract reference:** artefacts/2026-07-23-e2e-core-journey-coverage/dor/b1-formed-idea-outer-loop-story-map-dor-contract.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-23

---

## Contract Review

✅ **Contract review passed** — the proposed implementation aligns with all 4 ACs, and correctly implements the review-resolved independence from A3's spec. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | Hamish King (Founder/Operator) |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 4 ACs, 4 tests (+2 NFR) |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references named metric | ✅ | m1 |
| H6 | Complexity rated | ✅ | 3 (justified — 6-stage session chain, genuinely more unknowns) |
| H7 | No unresolved HIGH findings | ✅ | Run 2: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | No uncovered ACs | ✅ | No gaps |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: A1 → `schemaDepends: ["dorStatus"]` declared |
| H9 | Architecture Constraints populated; no Cat E HIGH | ✅ | Cites ADR-022, ADR-023, ADR-024; 0 findings |
| H-E2E | CSS-layout-dependent gap check | ✅ | Not triggered |
| H-NFR | NFR profile exists | ✅ | Present |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not applicable |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Approved By populated | ✅ | Hamish King — Founder/Operator — 2026-07-23 (M1 signal recorded) |
| H-ADAPTER | Injectable adapter check | ✅ | Not triggered |
| H-INF | Infra-plan gate | ✅ | Not triggered |
| H-MIG | Migration-review gate | ✅ | Not triggered |

**All hard blocks passed — 19/19.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | — (0 MEDIUM after Run 2) | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Unreviewed script may miss edge cases | RISK-ACCEPT logged in decisions.md, 2026-07-23 (feature-wide) |
| W5 | No UNCERTAIN gap items | ✅ | — | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Drive the formed-idea outer loop to DoR and assert the /definition story-map canvas, close/resume mid-SSE — artefacts/2026-07-23-e2e-core-journey-coverage/stories/b1-formed-idea-outer-loop-story-map.md
Test plan: artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/b1-formed-idea-outer-loop-story-map-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS, Playwright Test under `tests/e2e/`, never in the unit test chain, per ADR-018
- This spec MUST NOT depend on A3's spec file having run first — it creates its own minimal product/tenant context independently (this was a specific finding fixed at /review, [1-M1] — do not reintroduce the coupling)
- Assume one session per skill stage with structured artefact handoff (ADR-022/ADR-023) — do not implement this as a single persistent session across all six stages
- Any journey-state assertion must check the full ADR-024 contract shape (`turns`, `stages`, `completedStages`, `stage`, `ownerId`, `activeSkill`), not a partial shape
- Architecture standards: read `.github/architecture-guardrails.md` before implementing
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment and do not mark ready for review

Oversight level: High
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes
**Signed off by:** Hamish King — Founder/Operator — 2026-07-23

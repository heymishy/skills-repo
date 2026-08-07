## Definition of Ready: Drive Stripe test-mode plan selection on real staging

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/a2-stripe-test-mode-plan-selection.md
**Test plan reference:** artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/a2-stripe-test-mode-plan-selection-test-plan.md
**Contract reference:** artefacts/2026-07-23-e2e-core-journey-coverage/dor/a2-stripe-test-mode-plan-selection-dor-contract.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-23

---

## Contract Review

✅ **Contract review passed** — the proposed E2E-only implementation aligns with all 3 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | Hamish King (Founder/Operator) |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 3 ACs |
| H3 | Every AC has ≥1 test | ✅ | 3 ACs, 3 tests |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references named metric | ✅ | m1 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | 0 HIGH, 0 MEDIUM, 1 LOW |
| H8 | No uncovered ACs | ✅ | No gaps |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: A1 → `schemaDepends: ["dorStatus"]` declared; `dorStatus` present in `pipeline-state.schema.json` epic-nested story schema |
| H9 | Architecture Constraints populated; no Cat E HIGH | ✅ | 1 LOW (cross-origin checkout note, non-blocking) |
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
| W3 | MEDIUM findings acknowledged | ✅ | — (0 MEDIUM) | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Unreviewed script may miss edge cases | RISK-ACCEPT logged in decisions.md, 2026-07-23 (feature-wide) |
| W5 | No UNCERTAIN gap items | ✅ | — | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Drive Stripe test-mode plan selection on real staging — artefacts/2026-07-23-e2e-core-journey-coverage/stories/a2-stripe-test-mode-plan-selection.md
Test plan: artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/a2-stripe-test-mode-plan-selection-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS, Playwright Test under `tests/e2e/`, never in the unit test chain, per ADR-018
- Reuse A1's staging-auth fixture — do not build a second, parallel auth mechanism
- Use only Stripe's documented test-mode card numbers — never real card data or live keys
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

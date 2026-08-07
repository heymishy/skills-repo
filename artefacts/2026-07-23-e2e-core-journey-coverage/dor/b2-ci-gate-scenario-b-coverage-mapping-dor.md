## Definition of Ready: Add Scenario B to the CI-blocking gate and publish the spec-to-journey-step coverage mapping

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/b2-ci-gate-scenario-b-coverage-mapping.md
**Test plan reference:** artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/b2-ci-gate-scenario-b-coverage-mapping-test-plan.md
**Contract reference:** artefacts/2026-07-23-e2e-core-journey-coverage/dor/b2-ci-gate-scenario-b-coverage-mapping-dor-contract.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-23

---

## Contract Review

✅ **Contract review passed** — the proposed implementation aligns with all 4 ACs, reusing A5's gate pattern. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | Hamish King (Founder/Operator) |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 4 ACs, 3 automated + 2 manual |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage references named metric | ✅ | m1 |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | No uncovered ACs (gap explicitly acknowledged) | ✅ | AC1/AC2's branch-protection gap acknowledged (External-dependency) |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: A5, B1 → `schemaDepends: ["dorStatus"]` declared |
| H9 | Architecture Constraints populated; no Cat E HIGH | ✅ | Cites ADR-018, ADR-004; 0 findings |
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
| W3 | MEDIUM findings acknowledged | ✅ | — (0 findings) | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Unreviewed script may miss edge cases | RISK-ACCEPT logged in decisions.md, 2026-07-23 (feature-wide) |
| W5 | No UNCERTAIN gap items | ✅ | — | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add Scenario B to the CI-blocking gate and publish the spec-to-journey-step coverage mapping — artefacts/2026-07-23-e2e-core-journey-coverage/stories/b2-ci-gate-scenario-b-coverage-mapping.md
Test plan: artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/b2-ci-gate-scenario-b-coverage-mapping-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Reuse A5's gate mechanism pattern (config-driven via context.yml, no continue-on-error, required status check) — do not invent a second, different mechanism
- The coverage-mapping document must be cross-checked against real spec file content by an automated test (AC4) — do not accept a hand-authored, unverified document as complete
- Architecture standards: read `.github/architecture-guardrails.md` before implementing (ADR-018, ADR-004 especially)
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment and do not mark ready for review

Oversight level: High
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes
**Signed off by:** Hamish King — Founder/Operator — 2026-07-23

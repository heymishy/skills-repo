## Definition of Ready: Wire Scenario A as a CI-blocking gate

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/a5-ci-gate-scenario-a-blocking.md
**Test plan reference:** artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/a5-ci-gate-scenario-a-blocking-test-plan.md
**Contract reference:** artefacts/2026-07-23-e2e-core-journey-coverage/dor/a5-ci-gate-scenario-a-blocking-dor-contract.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-23

---

## Contract Review

✅ **Contract review passed** — the proposed implementation aligns with all 4 ACs, including the acknowledged External-dependency handling for AC1/AC2. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | Hamish King (Founder/Operator) |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 4 ACs, 3 automated + 2 manual |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references named metric | ✅ | m1 |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | No uncovered ACs (gap explicitly acknowledged) | ✅ | AC1/AC2's branch-protection gap acknowledged (External-dependency), not silent |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: A1, A2, A3, A4 → `schemaDepends: ["dorStatus"]` declared |
| H9 | Architecture Constraints populated; no Cat E HIGH | ✅ | Cites ADR-018, ADR-004; 0 findings |
| H-E2E | CSS-layout-dependent gap check | ✅ | Not triggered — gap type is External-dependency, not CSS-layout-dependent |
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
Story: Wire Scenario A as a CI-blocking gate — artefacts/2026-07-23-e2e-core-journey-coverage/stories/a5-ci-gate-scenario-a-blocking.md
Test plan: artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/a5-ci-gate-scenario-a-blocking-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- The new CI job must apply only to the new Scenario A staging spec — the 29 existing local-mocked specs must remain non-blocking (assert this with a before/after config diff test, per AC3)
- Gate enablement must be config-driven via `.github/context.yml`, not a hardcoded value in the workflow YAML, per ADR-004
- Do not attempt to encode "the merge is actually blocked" as an automated Jest/Node test — that is a real GitHub branch-protection behaviour, verified by the manual scenario in the verification script (see AC1/AC2's acknowledged External-dependency gap). Your automated tests should assert the structural precondition (no `continue-on-error`, check registered as required) only.
- Architecture standards: read `.github/architecture-guardrails.md` before implementing (ADR-018 especially)
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment and do not mark ready for review

Oversight level: High
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes
**Signed off by:** Hamish King — Founder/Operator — 2026-07-23

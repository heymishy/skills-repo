## Definition of Ready: Design and implement a staging test-data cleanup strategy for E2E-generated accounts and records

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/b3-staging-test-data-cleanup.md
**Test plan reference:** artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/b3-staging-test-data-cleanup-test-plan.md
**Contract reference:** artefacts/2026-07-23-e2e-core-journey-coverage/dor/b3-staging-test-data-cleanup-dor-contract.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-23

---

## Contract Review

✅ **Contract review passed** — the proposed manually-triggered purge script implementation aligns with all 3 ACs and the mechanism chosen at /review. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | Hamish King (Founder/Operator) |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 3 ACs |
| H3 | Every AC has ≥1 test | ✅ | 3 ACs, 3 tests (+2 NFR) |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage references named metric | ✅ | m1 (indirect — protects gate reliability) |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Run 2: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | No uncovered ACs | ✅ | No gaps |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: A1, A3 → `schemaDepends: ["dorStatus"]` declared |
| H9 | Architecture Constraints populated; no Cat E HIGH | ✅ | Cites the RISK-ACCEPT resolution reference in decisions.md; 0 findings |
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
| W2 | Scope stability declared | ✅ | Upgraded to Stable at /review once the mechanism was chosen | — |
| W3 | MEDIUM findings acknowledged | ✅ | — (0 MEDIUM after Run 2) | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Unreviewed script may miss edge cases | RISK-ACCEPT logged in decisions.md, 2026-07-23 (feature-wide) |
| W5 | No UNCERTAIN gap items | ✅ | — | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Design and implement a staging test-data cleanup strategy for E2E-generated accounts and records — artefacts/2026-07-23-e2e-core-journey-coverage/stories/b3-staging-test-data-cleanup.md
Test plan: artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/b3-staging-test-data-cleanup-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Build a manually-triggered purge script, NOT a scheduled/nightly job — this mechanism was explicitly chosen at /review (see decisions.md's "Staging test-data accumulation" entry) to avoid scheduled-job infrastructure overhead
- Match on the exact `e2e-test-` prefix only (strict positive allowlist) — never a fuzzy/heuristic match that could catch real data (AC2 is the story's explicit defense against this)
- Use scoped, least-privilege credentials — not full-admin database/Stripe access
- Update `decisions.md`'s "Staging test-data accumulation" entry to confirm the mechanism is implemented and running (AC3)
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

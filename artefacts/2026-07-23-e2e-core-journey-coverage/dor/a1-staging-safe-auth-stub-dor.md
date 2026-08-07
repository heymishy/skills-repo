## Definition of Ready: Stand up a staging-safe GitHub OAuth/email auth stub for real-staging E2E

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/a1-staging-safe-auth-stub.md
**Test plan reference:** artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/a1-staging-safe-auth-stub-test-plan.md
**Contract reference:** artefacts/2026-07-23-e2e-core-journey-coverage/dor/a1-staging-safe-auth-stub-dor-contract.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-23

---

## Contract Review

✅ **Contract review passed** — the proposed implementation (staging-only auth stub gated by an env var absent from production, a shared Playwright fixture, two non-Playwright config-check scripts, and an ADR-018 addendum) aligns with all 4 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As/Want/So format with a named persona | ✅ | Persona: Hamish King (Founder/Operator) |
| H2 | At least 3 ACs in Given/When/Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 4 ACs, 4 tests |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | m1 |
| H6 | Complexity is rated | ✅ | 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 2: 0 HIGH, 0 MEDIUM |
| H8 | Test plan has no uncovered ACs | ✅ | No gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None — no upstream dependencies declared, schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Cites ADR-018 addendum requirement, ADR-025, Mandatory Constraint (Security); 1 LOW (non-blocking) |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ | Not triggered — no CSS-layout-dependent gap type on this story |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-07-23-e2e-core-journey-coverage/nfr-profile.md |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not applicable — no compliance NFRs (regulated: false) |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence given declared NFRs | ✅ | Present |
| H-GOV | Governance approval — Approved By populated | ✅ | Hamish King — Founder/Operator — 2026-07-23. M1 signal: role not clearly non-engineering (solo-operator posture); recorded, not blocking. |
| H-ADAPTER | Injectable adapter wiring check | ✅ | Not triggered — no injectable adapter introduced by this story |
| H-INF | Infra-plan gate | ✅ | Not triggered — `hasInfraTrack` false |
| H-MIG | Migration-review gate | ✅ | Not triggered — `hasMigrationTrack` false |

**All hard blocks passed — 18/18.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | — (0 MEDIUM remain after Run 2) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | RISK-ACCEPT logged in decisions.md, 2026-07-23 (applies to all 8 stories in this feature) |
| W5 | No UNCERTAIN gap-table items | ✅ | — | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Stand up a staging-safe GitHub OAuth/email auth stub for real-staging E2E — artefacts/2026-07-23-e2e-core-journey-coverage/stories/a1-staging-safe-auth-stub.md
Test plan: artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/a1-staging-safe-auth-stub-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS (`require`), no TypeScript, matching this repo's existing web-ui conventions
- Playwright Test (`@playwright/test`) for E2E specs, saved under `tests/e2e/` — never invoked from the unit test chain (`npm test` / `scripts/run-all-tests.js`), per ADR-018
- The staging-only auth stub's enabling env var/credential must be set only in `fly.staging.toml` / staging CI secrets — never in `fly.toml` (production). This is the single most important constraint of this story; violating it is a security regression, not a scope deviation.
- Append the ADR-018 addendum to `.github/architecture-guardrails.md` documenting the mechanism, its staging-only scope, and why it doesn't weaken production auth — do this as part of this story's PR, not deferred.
- Architecture standards: read `.github/architecture-guardrails.md` before implementing. Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs (especially ADR-018, ADR-025).
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: High
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes
**Signed off by:** Hamish King — Founder/Operator — 2026-07-23

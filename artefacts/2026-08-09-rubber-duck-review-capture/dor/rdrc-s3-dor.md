# Definition of Ready: Build the agent-driven Playwright review and validate it against a seeded issue set

**Story reference:** artefacts/2026-08-09-rubber-duck-review-capture/stories/rdrc-s3-agent-driven-review-validation-set.md
**Test plan reference:** artefacts/2026-08-09-rubber-duck-review-capture/test-plans/rdrc-s3-test-plan.md
**Contract proposal:** artefacts/2026-08-09-rubber-duck-review-capture/dor/rdrc-s3-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-09

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "developer/operator running the outer loop" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1/AC4: integration; AC2/AC3: manual |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 named exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Meta Metric 2 |
| H6 | Complexity is rated | ✅ | Rating 3 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review run 1: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | AC2/AC3 gap explicitly acknowledged in test plan's Coverage gaps table |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None — no upstream story declared, schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-018 + skill-turn-executor.js reuse cited and independently verified real; review Category E: 0 findings |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ N/A | No CSS-layout-dependent ACs; Playwright already configured regardless |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-08-09-rubber-duck-review-capture/nfr-profile.md |
| H-NFR2 | Compliance NFR with regulatory clause has sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification field not blank | ✅ | Confidential |
| H-NFR-profile | NFR profile presence (story declares real NFRs) | ✅ | Profile exists at the path above |
| H-GOV | Discovery `## Approved By` has ≥1 non-blank named entry | ✅ | Same as rdrc-s1 — M1 signal already recorded for this feature |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No `setX()` adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | Unstable — epic's own note about deferring Story 4 if this story's signal isn't met | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review had 0 MEDIUM findings | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | Acknowledged — RISK-ACCEPT-1 in decisions.md (covers all 5 rdrc stories) |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | Gap has an explicit handling decision | — |

---

## Standards injection

Domain tags: `[web-ui]` — matched against `.github/standards/index.yml`.
Matched standards files: `.github/standards/web-ui/web-ui-patterns.md`

Appended under a `## Applicable standards` reference in the coding agent instructions below — the coding agent must read this file before implementing.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Build the agent-driven Playwright review and validate it against a seeded issue set — artefacts/2026-08-09-rubber-duck-review-capture/stories/rdrc-s3-agent-driven-review-validation-set.md
Test plan: artefacts/2026-08-09-rubber-duck-review-capture/test-plans/rdrc-s3-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Build on src/modules/skill-turn-executor.js (or its exported functions)
  for the LLM-invocation path — do not build a second, parallel invocation
  mechanism. See the NFR test
  agentDrivenReview_reusesSkillTurnExecutor_notASeparateInvocationPath.
- Playwright specs live under tests/e2e/ per ADR-018; the unit test chain
  (npm test / scripts/run-all-tests.js) must never invoke Playwright directly
  — any Playwright-driving test for this story runs as its own explicit
  script/command, not folded into the main suite.
- Seed the validation set from this repo's own real history: check out the
  commit immediately before gtcl-s1 merged for fixture 1, immediately before
  lcdf-s1 merged for fixture 2, and current master for the clean fixture.
  Do not invent synthetic bugs.
- Every test that invokes the LLM-invocation path must run through the
  mock-LLM-gateway (mgar-s1) — never a real, billed call in automated tests.
- Architecture standards: read `.github/architecture-guardrails.md` before
  implementing.
- Open a draft PR when automated tests pass — do not mark ready for review.
  AC2/AC3's manual detection-rate judgment happens after, using the
  verification script at
  artefacts/2026-08-09-rubber-duck-review-capture/verification-scripts/rdrc-s3-verification.md.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium

## Applicable standards
- .github/standards/web-ui/web-ui-patterns.md (domain: web-ui) — read before implementing
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead (operator) awareness required.
**Signed off by:** N/A — proceed directly per Medium oversight rules.

**PROCEED: Yes**

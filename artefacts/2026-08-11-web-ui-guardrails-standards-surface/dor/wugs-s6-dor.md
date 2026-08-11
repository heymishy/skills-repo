## Definition of Ready: Build the branch + PR creation adapter for guardrail/standard edits

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s6-branch-pr-creation-adapter.md
**Test plan reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s6-branch-pr-creation-adapter-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-11

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 6 ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | tech lead |
| H2 | ≥3 ACs Given/When/Then | ✅ | 6 ACs |
| H3 | Every AC has ≥1 test | ✅ | 8 tests |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage names a metric | ✅ | M1 (indirect) + M2 (via reuse in Epic 3) |
| H6 | Complexity rated | ✅ | 3 |
| H7 | No unresolved HIGH | ✅ | 0 HIGH; 1 MEDIUM resolved at this DoR run |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | Upstream `wugs-s1`, `wugs-s5` — `schemaDepends: [dorStatus, testPlan]` |
| H9 | Architecture Constraints populated | ✅ | Now cites ADR-012 explicitly (resolved this run); D37 all 4 requirements applied |
| H-E2E | Layout-dependent gap check | ✅ | None (external-dependency risk noted separately, not CSS-layout) |
| H-NFR / H-NFR2 / H-NFR3 / H-NFR-profile | ✅ | |
| H-GOV | ✅ | Same as `wugs-s1` |
| H-ADAPTER | Injectable adapter check | ✅ | `setGuardrailPrAdapter` introduced; AC6 scopes production wiring with a differentiating-outcome test (D37 req. 4) |
| H-INF / H-MIG | ✅ | Not triggered |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1, W2, W5 | — | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | 1-M1 resolved directly during this DoR run — no unresolved MEDIUM remains | N/A — resolved, not just acknowledged |
| W4 | Verification script reviewed by domain expert | ⚠️ | Not independently reviewed; scenarios 1-2 require a real sandbox GitHub repo | Acknowledged — Hamish King; sandbox check is a required (not optional) manual pre-merge step per the test plan's own Test Gaps note |

---

## Oversight level

**High** (per Epic 2 — highest-consequence story in the feature: writes real branches/commits/PRs to a tenant's external repo) — named sign-off required.

---

## Standards injection

Domain tags: `[web-ui, security-engineering]`
Matched: `standards/saas-gui/POLICY.md`, `standards/security-engineering/core.md`, `standards/security-engineering/POLICY.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Build the branch + PR creation adapter for guardrail/standard edits — artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s6-branch-pr-creation-adapter.md
Test plan: artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s6-branch-pr-creation-adapter-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Do NOT reuse repo-bootstrap.js's realBootstrapRepo or its direct-to-master
  pattern — this story requires a genuinely new branch-then-PR flow.
- Follow the injectable-adapter pattern (D37): stub throws
  'Adapter not wired: guardrailPrAdapter. Call setGuardrailPrAdapter() with a
  real implementation before use.'
- Wiring test (AC6) must assert a differentiating outcome (two different
  inputs -> two different correct PRs), not just that a setter was called.
- REQUIRED before merge: perform one real, manual test against a sandbox
  GitHub repo confirming the branch/Contents/Pulls API response shapes match
  the mocked test shapes (CLAUDE.md mock-shape-verification rule) — record
  this in the PR description.
- Never log the OAuth token.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing — ADR-012 applies directly to this adapter's design.
- Read standards/saas-gui/POLICY.md and standards/security-engineering/core.md
  + POLICY.md (web-ui, security-engineering domain match).
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity: add a PR comment, do not mark ready for review.

Oversight level: High
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes
**Signed off by:** Hamish King — Platform owner — 2026-08-11

**PROCEED: Yes**

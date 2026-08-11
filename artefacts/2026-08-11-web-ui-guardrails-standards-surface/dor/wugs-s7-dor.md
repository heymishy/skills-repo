## Definition of Ready: Surface pending/merged PR state in the guardrails/standards view

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s7-surface-pr-state-in-view.md
**Test plan reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s7-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-11

---

## Contract Review

✅ **Contract review passed** — no mismatches against the 4 ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | tech lead |
| H2 | ≥3 ACs Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 4 tests |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage names a metric | ✅ | M1 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH | ✅ | |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | Upstream `wugs-s6` — `schemaDepends: [dorStatus, testPlan]` |
| H9 | Architecture Constraints populated | ✅ | Commits to live-status checking per `decisions.md` ARCH entry #4 |
| H-E2E | Layout-dependent gap check | ✅ | None |
| H-NFR / H-NFR2 / H-NFR3 / H-NFR-profile | ✅ | |
| H-GOV | ✅ | Same as `wugs-s1` |
| H-ADAPTER | ✅ | No new adapter (reuses `wugs-s6`'s and a read-only GitHub PR-status check) |
| H-INF / H-MIG | ✅ | Not triggered |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1, W2, W3, W5 | — | ✅ | — | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Not independently reviewed | Acknowledged — Hamish King |

---

## Oversight level

**High** (per Epic 2) — named sign-off required.

---

## Standards injection

Domain tags: `[web-ui]`
Matched: `standards/saas-gui/POLICY.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Surface pending/merged PR state in the guardrails/standards view — artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s7-surface-pr-state-in-view.md
Test plan: artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s7-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Depends on wugs-s6 being merged (consumes its PR number/URL return shape).
- Live PR-status check on each view render — no webhook, no caching layer
  (decisions.md ARCH entry #4).
- New guardrail_pending_prs table — add to schema/migration in the same
  commit as the reading/writing code (ADR-003).
- PR status indicator must convey state via text/label, not colour alone
  (MC-A11Y-02).
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Read standards/saas-gui/POLICY.md (web-ui domain match).
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

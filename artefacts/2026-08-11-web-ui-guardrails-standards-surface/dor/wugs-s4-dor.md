## Definition of Ready: Show org-level guardrails/standards even when a product has no connected repo

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s4-no-connected-repo-fallback.md
**Test plan reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s4-no-connected-repo-fallback-test-plan.md
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
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH | ✅ | |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | Upstream `wugs-s2`, `wugs-s3` — `schemaDepends: [dorStatus, testPlan]`, both present |
| H9 | Architecture Constraints populated | ✅ | Reuses existing connection entry point, `rapp-s2` shell pattern |
| H-E2E | Layout-dependent gap check | ✅ | None |
| H-NFR / H-NFR2 / H-NFR3 / H-NFR-profile | ✅ | Feature `nfr-profile.md` covers this story |
| H-GOV | ✅ | Same as `wugs-s1` |
| H-ADAPTER | ✅ | No new adapter |
| H-INF / H-MIG | ✅ | Not triggered |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1-W3, W5 | — | ✅ | — | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Not independently reviewed | Acknowledged — Hamish King |

---

## Oversight level

**Medium** (per Epic 1) — DoR artefact shared with tech lead (Hamish King, confirmed).

---

## Standards injection

Domain tags: `[web-ui]`
Matched: `standards/saas-gui/POLICY.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Show org-level guardrails/standards even when a product has no connected repo — artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s4-no-connected-repo-fallback.md
Test plan: artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s4-no-connected-repo-fallback-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Depends on wugs-s2 and wugs-s3 being merged first.
- Reuse the existing rpc-s1/prc-s2.1 repo-connection route for the prompt link
  — do not create a new connection entry point.
- The "connect a repo" prompt must be a real, keyboard-accessible link/button.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Read standards/saas-gui/POLICY.md (web-ui domain match).
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity: add a PR comment, do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (awareness only)
**Signed off by:** Hamish King — Platform owner — 2026-08-11

**PROCEED: Yes**

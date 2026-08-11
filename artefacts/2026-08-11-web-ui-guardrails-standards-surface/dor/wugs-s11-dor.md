## Definition of Ready: Remove `smug-s1`'s promote/opt-out routes and old Standards tab rendering

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s11-remove-smug-s1-routes-and-tab.md
**Test plan reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s11-test-plan.md
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
| H3 | Every AC has ≥1 test | ✅ | 3 tests + manual checks (AC3/AC4, hygiene checks not runtime behaviour) |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage names a metric | ✅ | M1 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH | ✅ | |
| H8 | No uncovered ACs | ✅ | AC3/AC4 covered as manual/CI checks, explicitly noted in test plan's Coverage gaps rationale |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies note "Epics 1-3 must be live" (not a single story slug) — `schemaDepends: [stage, health]` used to confirm feature-wide readiness rather than a single story's `dorStatus` |
| H9 | Architecture Constraints populated | ✅ | Clean supersession per `decisions.md` ARCH entry #4 |
| H-E2E | Layout-dependent gap check | ✅ | None |
| H-NFR / H-NFR2 / H-NFR3 / H-NFR-profile | ✅ | |
| H-GOV | ✅ | Same as `wugs-s1` |
| H-ADAPTER | ✅ | No new adapter (removal only) |
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

**Medium** (per Epic 4) — DoR artefact shared with tech lead (Hamish King, confirmed).

---

## Standards injection

Domain tags: `[web-ui]`
Matched: `standards/saas-gui/POLICY.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Remove smug-s1's promote/opt-out routes and old Standards tab rendering — artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s11-remove-smug-s1-routes-and-tab.md
Test plan: artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s11-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- DO NOT START until Epics 1-3 (wugs-s1 through wugs-s10) are merged and
  live — this is a clean supersession, not a soft deprecation.
- Delete handleGetProductStandardsTab, _renderStandardsTab,
  handlePutStandardPromote, handlePostStandardOptout, and standards.js's
  standardsPost/standardsList/standardsPut entirely — do not leave dead code.
- Remove check-smug-s1-standards-tab-and-query-fix.js and
  check-rapp-s2-standards-tab-nav-and-breadcrumb.js from the test suite.
- Repoint the "Standards" nav link — do not duplicate it.
- Run a repo-wide grep for the removed export names before opening the PR;
  zero matches required outside this story's own diff.
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

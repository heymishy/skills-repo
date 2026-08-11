## Definition of Ready: Show a product's own guardrails and standards, read live from its connected repo

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s2-product-level-guardrails-view.md
**Test plan reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s2-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-11

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | tech lead |
| H2 | ≥3 ACs Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | 5 tests |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage names a metric | ✅ | M1 |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH | ✅ | 0 HIGH |
| H8 | No uncovered ACs | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: Upstream `wugs-s1` — `schemaDepends: [dorStatus, testPlan]`; both fields present in `pipeline-state.schema.json`'s story definition |
| H9 | Architecture Constraints populated | ✅ | Cites ADR-025, ADR-012 (indirect via `wugs-s1` reuse), `rapp-s2` regression guard |
| H-E2E | Layout-dependent gap check | ✅ | None |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance NFR sign-off | ✅ | N/A |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | |
| H-GOV | Discovery Approved By non-blank | ✅ | Same as `wugs-s1` |
| H-ADAPTER | Injectable adapter check | ✅ | No new adapter introduced by this story (consumes `wugs-s1`'s) |
| H-INF | Infra-plan gate | ✅ | Not triggered |
| H-MIG | Migration-review gate | ✅ | Not triggered |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1-W3, W5 | — | ✅ | — | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Not independently reviewed | Acknowledged — Hamish King, sole operator |

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
Story: Show a product's own guardrails and standards, read live from its connected repo — artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s2-product-level-guardrails-view.md
Test plan: artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Depends on wugs-s1 being merged first — use its fetch function, do not
  duplicate GitHub API calls.
- Wire getProductsNavSummary and activeProductId exactly per the pattern
  rapp-s2 established — do not reintroduce the missing-nav regression.
- Escape all repo-sourced content before rendering (MC-SEC-01).
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

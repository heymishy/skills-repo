## Definition of Ready: Request a product-level guardrail/standard be promoted to org level

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s8-request-promotion.md
**Test plan reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s8-test-plan.md
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
| H5 | Benefit linkage names a metric | ✅ | M2 |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH | ✅ | |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | Upstream `wugs-s2` — `schemaDepends: [dorStatus, testPlan]` |
| H9 | Architecture Constraints populated | ✅ | New table justified (no existing table fits); data-model diagram marker present |
| H-E2E | Layout-dependent gap check | ✅ | None |
| H-NFR / H-NFR2 / H-NFR3 / H-NFR-profile | ✅ | |
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

**High** (per Epic 3) — named sign-off required.

---

## Standards injection

Domain tags: `[web-ui, data]`
Matched: `standards/saas-gui/POLICY.md`, `standards/data/core.md`, `standards/data/POLICY.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Request a product-level guardrail/standard be promoted to org level — artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s8-request-promotion.md
Test plan: artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s8-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Depends on wugs-s2 being merged.
- New guardrail_promotion_requests table — add to schema/migration in the
  same commit as the reading/writing code (ADR-003).
- content_snapshot is taken at request time, not re-read at approval time.
- Tenant-scoping (AC4) is a hard requirement, matching the existing
  FORBIDDEN-vs-NOT_FOUND convention used elsewhere in products.js.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Read standards/saas-gui/POLICY.md and standards/data/core.md + POLICY.md
  (web-ui, data domain match).
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

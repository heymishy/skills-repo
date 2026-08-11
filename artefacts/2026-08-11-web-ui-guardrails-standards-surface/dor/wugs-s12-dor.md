## Definition of Ready: Remove the `standards`/`standard_product_optouts` DB tables and their references

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s12-remove-db-tables.md
**Test plan reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s12-remove-db-tables-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-11

---

## Contract Review

✅ **Contract review passed** — no mismatches against the 4 ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | future engineer (technical/cleanup framing, per template guidance) |
| H2 | ≥3 ACs Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 3 tests + 1 manual/CI check |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage names a metric | ✅ | M1 (indirect, technical/cleanup framing) |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH | ✅ | |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | Upstream `wugs-s11` — `schemaDepends: [dorStatus, testPlan]` |
| H9 | Architecture Constraints populated | ✅ | ADR-003 applied in reverse; the `handleDeleteProduct` cross-reference is this story's own strongest finding |
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

Domain tags: `[web-ui, data]`
Matched: `standards/saas-gui/POLICY.md`, `standards/data/core.md`, `standards/data/POLICY.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Remove the standards/standard_product_optouts DB tables and their references — artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s12-remove-db-tables.md
Test plan: artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s12-remove-db-tables-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- DO NOT START until wugs-s11 is merged and deployed — sequencing is strict.
- CRITICAL: remove the two DELETE FROM standards / standard_product_optouts
  lines in handleDeleteProduct (products.js, prc-s4.2) — found during this
  feature's own discovery investigation. Leaving them in place after the
  tables are dropped will break every product deletion, not just
  guardrails-related functionality. Write the AC2 test FIRST to prove you've
  found and covered this before writing the removal code (TDD discipline).
- Migration file: remove the CREATE TABLE lines, add explicit
  DROP TABLE IF EXISTS statements so existing deployed databases actually
  drop the tables (ADR-003, schema-first, applied in reverse).
- Run the full products.js regression suite (especially
  check-prc-s4.2-delete-product.js) before opening the PR.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Read standards/saas-gui/POLICY.md and standards/data/core.md + POLICY.md
  (web-ui, data domain match).
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

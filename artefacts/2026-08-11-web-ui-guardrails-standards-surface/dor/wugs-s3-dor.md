## Definition of Ready: Show a tenant's org-level guardrails and standards, read from a designated org repo, seeded on first use

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s3-org-level-guardrails-view-with-seeding.md
**Test plan reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s3-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-11

---

## Contract Review

✅ **Contract review passed** — after resolving the `wugs-s6` cross-epic dependency (see `decisions.md`, 2026-08-11 SLICE entry), the proposed implementation aligns with all 5 ACs. Original review round found a real contract mismatch (AC1's seeding step depended on an Epic-2 story with no recorded dependency) — resolved by adding the explicit upstream dependency, not by weakening the AC.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | tech lead / CoP-domain expert |
| H2 | ≥3 ACs Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | 5 tests |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage names a metric | ✅ | M1 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH | ✅ | 0 HIGH; 1 MEDIUM resolved same-session pre-DoR |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies now list `wugs-s1` AND `wugs-s6` — `schemaDepends: [dorStatus, testPlan]`, both present in schema |
| H9 | Architecture Constraints populated | ✅ | Cites ADR-025, ADR-003, includes data-model diagram marker |
| H-E2E | Layout-dependent gap check | ✅ | None |
| H-NFR / H-NFR2 / H-NFR3 / H-NFR-profile | NFR checks | ✅ | Feature `nfr-profile.md` covers this story |
| H-GOV | Discovery Approved By | ✅ | Same as `wugs-s1` |
| H-ADAPTER | Injectable adapter check | ✅ | No new adapter introduced (consumes `wugs-s1`/`wugs-s6`) |
| H-INF / H-MIG | Not triggered | ✅ | |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1-W3, W5 | — | ✅ | — | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Not independently reviewed | Acknowledged — Hamish King |

---

## Oversight level

**Medium** (per Epic 1) — DoR artefact shared with tech lead (Hamish King, confirmed). Note: this story's real implementation cannot start until `wugs-s6` (High oversight, Epic 2) merges — sequencing constraint, not an oversight-level change for `wugs-s3` itself.

---

## Standards injection

Domain tags: `[web-ui, data]`
Matched: `standards/saas-gui/POLICY.md`, `standards/data/core.md`, `standards/data/POLICY.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Show a tenant's org-level guardrails and standards, read from a designated org repo, seeded on first use — artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s3-org-level-guardrails-view-with-seeding.md
Test plan: artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s3-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- DO NOT START until wugs-s6 (Epic 2's branch+PR write adapter) is merged —
  this story's AC1 seeding step calls that adapter directly, not a
  direct-commit shortcut (decisions.md SLICE entry, 2026-08-11).
- Also depends on wugs-s1's fetch function.
- New tenant_org_repo table — add to the schema/migration file in the same
  commit as the code that reads/writes it (ADR-003).
- Seed content must match AC1's exact verbatim text — do not paraphrase.
- Cross-tenant isolation (AC5) is a hard requirement — write a dedicated test,
  do not rely on the WHERE tenant_id clause alone (ADR-025).
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

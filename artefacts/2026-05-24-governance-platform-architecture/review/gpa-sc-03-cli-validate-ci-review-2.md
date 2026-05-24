# Review Report: Wire CLI validate to CI assurance gate — Run 2

**Story reference:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-03-cli-validate-ci.md`
**Previous review:** Run 1 — `artefacts/2026-05-24-governance-platform-architecture/review/gpa-sc-03-cli-validate-ci-review-1.md` — FAIL
**Date:** 2026-05-24
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## Diff from Run 1

| Finding | Run 1 | Run 2 | Change |
|---------|-------|-------|--------|
| 1-H1 (E/C) — No AC for governance-package H-gate extraction | **HIGH — open** | **Resolved** | AC7 added: exports H-gate functions from `governance-package.js`, names test file `tests/check-gpa-sc03-cli-validate-ci.js` |
| 1-M1 (C) — AC1 missing feature slug resolution mechanism | MEDIUM — open | **Carried forward as 2-M1** | No change to AC1; medium-weight gap remains — implementer must infer from `extractPRSlug` in existing codebase |
| 1-L1 (C) — AC5/AC6 are deployment/process gates | LOW — open | **Carried forward as 2-L1** | No change; flag for test-plan author |

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[2-M1]** C — AC quality — AC1 states CI "calls `node bin/skills validate --story <story-slug> --ci` for each story in the PR's feature" but does not specify how CI identifies which feature and stories are associated with the PR. The existing `extractPRSlug` function handles feature slug resolution from PR body content, but AC1 does not reference this mechanism or define an equivalent. An implementer must infer the resolution strategy from the existing codebase.
  Risk if proceeding: implementer may derive a feature-slug resolution strategy inconsistent with `extractPRSlug`, producing A3 false-positives. AC6's RISK-ACCEPT path catches this if noticed.
  To acknowledge before /test-plan: run `/decisions`, category RISK-ACCEPT, noting that the existing `extractPRSlug` function is the intended resolution mechanism and a test should assert it is used.

---

## LOW findings — note for retrospective

- **[2-L1]** C — AC quality — AC5 ("Given SC-03 is deployed and 10 consecutive PRs pass...") and AC6 ("when the pattern is identified, then a RISK-ACCEPT entry is written") are deployment/process gates, not assertions verifiable by `npm test`. Flag for test-plan author: AC5 maps to a post-deployment observation record, AC6 maps to a `/decisions` log entry — neither is a test file assertion.

---

## Category scores

| Category | Score (1–5) | Change from Run 1 | Notes |
|----------|-------------|-------------------|-------|
| A — Traceability | 5 | unchanged | M2 named in "so that" clause with explicit before/after quantification (0 of 9 → 9 of 9). Discovery → benefit-metric → epic chain complete. Downstream M4 dependency noted. |
| B — Scope | 5 | unchanged | Out-of-scope section correctly excludes historical story re-evaluation, replacing structural checks, automating dorStatus, and merge-blocking H-gates. |
| C — AC quality | 3 | ↑ from 2 | HIGH resolved by AC7. AC7: GWT format ✓, observable ✓, independently testable ✓, named test file ✓. MEDIUM 2-M1 (AC1 slug resolution) and LOW 2-L1 (AC5/AC6 deployment gates) carried forward. |
| D — Completeness | 5 | unchanged | All template fields populated. Named persona. Performance NFR (60s for ≤10 stories) and output format NFR both present. |
| E — Architecture compliance | 5 | ↑ from 4 | AC7 closes the ADR-013 obligation gap. H-gate functions must be exported from `governance-package.js` with a named test assertion — constraint activation is now backed by a verifiable AC. ADR-009 and ADR-011 unchanged. |

---

## Summary

0 HIGH, 1 MEDIUM (2-M1 — carried from run-1, addressable without story rework), 1 LOW (2-L1 — carried from run-1) across 1 story.
**Outcome: PASS**

Proceed to `/decisions` to acknowledge 2-M1 (AC1 slug resolution mechanism) before `/test-plan`, or fix AC1 to reference `extractPRSlug` explicitly.

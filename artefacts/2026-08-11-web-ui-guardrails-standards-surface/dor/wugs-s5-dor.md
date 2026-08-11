## Definition of Ready: Provide a create/edit form for a guardrail or standard

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s5-create-edit-form.md
**Test plan reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s5-test-plan.md
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
| H5 | Benefit linkage names a metric | ✅ | M1, framed as UI-enabler technical dependency |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH | ✅ | |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | Upstream `wugs-s2` only (narrowed at DoR to break a circular dependency via `wugs-s3`→`wugs-s6`→`wugs-s5`) — `schemaDepends: [dorStatus, testPlan]` |
| H9 | Architecture Constraints populated | ✅ | Cites `MC-SEC-01` for validation and rendering |
| H-E2E | Layout-dependent gap check | ✅ | None |
| H-NFR / H-NFR2 / H-NFR3 / H-NFR-profile | ✅ | |
| H-GOV | ✅ | Same as `wugs-s1` |
| H-ADAPTER | ✅ | No new adapter introduced |
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

**High** (per Epic 2 — this epic writes to a tenant's real external repo) — named sign-off required.

---

## Standards injection

Domain tags: `[web-ui]`
Matched: `standards/saas-gui/POLICY.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Provide a create/edit form for a guardrail or standard — artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s5-create-edit-form.md
Test plan: artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s5-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Depends on wugs-s2 only (not wugs-s3 — narrowed at DoR to break a circular
  dependency, see decisions.md). Mock wugs-s6's adapter at the seam for this
  story's own tests.
- Server-side validation is mandatory — never trust client-side-only checks.
- Escape pre-filled content before rendering (MC-SEC-01).
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

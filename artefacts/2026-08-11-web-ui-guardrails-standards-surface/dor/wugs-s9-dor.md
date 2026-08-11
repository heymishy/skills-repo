## Definition of Ready: Admin approves or rejects a promotion request

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s9-approve-reject-promotion.md
**Test plan reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s9-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-11

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs, including AC5's now-explicit atomic-update mechanism.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | admin (per `decisions.md`'s SCOPE entry) |
| H2 | ≥3 ACs Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | 5 tests |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage names a metric | ✅ | M2 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH | ✅ | 0 HIGH; 1 MEDIUM resolved same-session pre-DoR |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | Upstream `wugs-s8`, `wugs-s6` — `schemaDepends: [dorStatus, testPlan]` |
| H9 | Architecture Constraints populated | ✅ | Reuses `wugs-s6`'s adapter and `isEffectivelyAdmin`; atomic-update mechanism now named explicitly |
| H-E2E | Layout-dependent gap check | ✅ | None |
| H-NFR / H-NFR2 / H-NFR3 / H-NFR-profile | ✅ | |
| H-GOV | ✅ | Same as `wugs-s1` |
| H-ADAPTER | ✅ | No new adapter (reuses `wugs-s6`'s) |
| H-INF / H-MIG | ✅ | Not triggered |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1, W2, W5 | — | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | 1-M1 resolved directly pre-DoR — no unresolved MEDIUM remains | N/A — resolved |
| W4 | Verification script reviewed by domain expert | ⚠️ | Not independently reviewed | Acknowledged — Hamish King |

---

## Oversight level

**High** (per Epic 3) — named sign-off required.

---

## Standards injection

Domain tags: `[web-ui, security-engineering]`
Matched: `standards/saas-gui/POLICY.md`, `standards/security-engineering/core.md`, `standards/security-engineering/POLICY.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Admin approves or rejects a promotion request — artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s9-approve-reject-promotion.md
Test plan: artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s9-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Depends on wugs-s8 and wugs-s6 being merged.
- MUST use a single conditional UPDATE ... WHERE request_id = $1 AND
  status = 'pending' RETURNING request_id for resolution — a read-then-write
  (check status, then separately update) pattern is explicitly disallowed
  (race condition risk, see story's own Architecture Constraints).
- Role gate via isEffectivelyAdmin (same mechanism as credits-guard.js) —
  server-side enforced, never client-side only.
- If no tenant_org_repo row exists, block approval with a clear error
  directing to wugs-s3's designation flow.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
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

## Definition of Ready: Audit-log promotion request, approval, and rejection events

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s10-audit-log-promotion-events.md
**Test plan reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s10-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-11

---

## Contract Review

✅ **Contract review passed** — no mismatches against the 4 ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | Hamish King, Platform owner (metric owner) |
| H2 | ≥3 ACs Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 4 tests |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage names a metric | ✅ | M2 — this story IS the measurement mechanism |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH | ✅ | |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | Upstream `wugs-s8`, `wugs-s9` — `schemaDepends: [dorStatus, testPlan]` |
| H9 | Architecture Constraints populated | ✅ | Matches existing PostHog capture convention |
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

Domain tags: `[web-ui]`
Matched: `standards/saas-gui/POLICY.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Audit-log promotion request, approval, and rejection events — artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s10-audit-log-promotion-events.md
Test plan: artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s10-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Depends on wugs-s8 and wugs-s9 being merged.
- Use exactly these event names: guardrail_promotion_requested,
  guardrail_promotion_approved, guardrail_promotion_rejected — matching
  benefit-metric.md's stated measurement method.
- Capture calls must be fail-open — a PostHog failure must never block or
  roll back the underlying state change (AC4 is the core reliability
  guarantee of this story).
- No PII/credential content in event properties — IDs and paths only.
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

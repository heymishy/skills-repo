## Definition of Ready: Invite acceptance is blocked if the tenant is at its member-count cap

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s4-member-count-cap.md
**Test plan reference:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s4-member-count-cap-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-15

---

## Contract Review

✅ **Contract review passed** — the proposed basic count-cap mechanism aligns with all 4 ACs and explicitly does not build full Stripe per-seat billing, matching the story's own scope boundary.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | platform owner |
| H2 | ≥3 ACs Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 4 unit tests |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage names a metric | ✅ | Share of new teammates added via self-serve invite (indirect, honestly labelled) |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH | ✅ | Review run 1: 0 HIGH |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | Upstream `wsi-s2` (redemption logic extended), `tenant-plan.js`'s existing `getPlanState` (already merged, unrelated feature) |
| H9 | Architecture Constraints populated | ✅ | Explicitly scoped as new prerequisite work, correctly citing the /definition-time correction |
| H-E2E | Layout-dependent gap check | ✅ | None |
| H-NFR / H-NFR2 / H-NFR3 / H-NFR-profile | ✅ | Same feature-level `nfr-profile.md` |
| H-GOV | ✅ | Same as `wsi-s1` |
| H-ADAPTER | ✅ | Not triggered — reuses existing `getPlanState`, introduces no new `setX()` |
| H-INF / H-MIG | ✅ | Not triggered |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1-W3, W5 | — | ✅ | — | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Not independently reviewed | RISK-ACCEPT logged in `decisions.md` (2026-08-15, covers all 5 stories) |

---

## Oversight level

**Medium** (per Epic 1)

---

## Standards injection

Domain tags: `[auth]`
Matched: `.github/standards/auth/auth-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Invite acceptance is blocked if the tenant is at its member-count cap — artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s4-member-count-cap.md
Test plan: artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s4-member-count-cap-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Read the tenant's plan tier via tenant-plan.js's existing getPlanState(tenantId) --
  do not invent a second plan-state read path.
- Cap values are simple hardcoded per-tier constants (e.g. trial: 3, paid: 25) --
  not per-tenant configurable, not read from Stripe. Exact numbers are your own
  reasonable choice.
- Member count is a live COUNT(*) FROM team_memberships WHERE tenant_id = $1 query --
  not a cached/denormalized counter.
- This check runs as part of wsi-s2's own redemption logic (same code path as
  expiry and redemption-status checks) -- not a separate route.
- The cap is an inclusive maximum (AC4): count == cap still blocks.
- Do NOT build Stripe per-seat billing, per-tenant configurable caps, or a
  proactive "approaching your limit" UI -- all explicitly out of scope.
- Architecture standards: read .github/architecture-guardrails.md before implementing.
- Read .github/standards/auth/auth-patterns.md (auth domain match).
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity: add a PR comment, do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (awareness only)
**Signed off by:** Hamish King — Platform owner — 2026-08-15

**PROCEED: Yes**

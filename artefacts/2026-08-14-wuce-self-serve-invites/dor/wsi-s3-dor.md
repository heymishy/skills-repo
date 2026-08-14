## Definition of Ready: Expired invites (past 24 hours) are rejected cleanly

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s3-invite-expiry.md
**Test plan reference:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s3-invite-expiry-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-15

---

## Contract Review

✅ **Contract review passed** — the proposed single-condition extension to `wsi-s2`'s own redemption logic aligns with all 3 ACs; no scope beyond the story's own stated bounds.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | teammate who received an invite but didn't act in time |
| H2 | ≥3 ACs Given/When/Then | ✅ | 3 ACs |
| H3 | Every AC has ≥1 test | ✅ | 3 unit tests |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage names a metric | ✅ | Time from invite creation to invitee access |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH | ✅ | Review run 1: 0 HIGH |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | Upstream `wsi-s1` (`expires_at` column), `wsi-s2` (redemption logic extended) — both artefacts exist |
| H9 | Architecture Constraints populated | ✅ | Correctly minimal — explicit "no new table/column" |
| H-E2E | Layout-dependent gap check | ✅ | None |
| H-NFR / H-NFR2 / H-NFR3 / H-NFR-profile | ✅ | Same feature-level `nfr-profile.md` |
| H-GOV | ✅ | Same as `wsi-s1` |
| H-ADAPTER | ✅ | Not triggered |
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
Story: Expired invites (past 24 hours) are rejected cleanly — artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s3-invite-expiry.md
Test plan: artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s3-invite-expiry-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Extend wsi-s2's own redemption check with an expires_at > NOW() condition,
  evaluated together with (not separately from) the existing redeemed_at IS NULL
  atomic check — no separate route, no separate dispatcher branch.
- No new table or column — expires_at already exists on team_invitations from wsi-s1.
- No extend/renew mechanism for an expired invite — a new invite is the only path.
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

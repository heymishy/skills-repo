## Definition of Ready: Invitee accepts the invite and joins the tenant with the assigned role

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s2-invitee-accepts-and-joins.md
**Test plan reference:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s2-invitee-accepts-and-joins-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-15

---

## Contract Review

✅ **Contract review passed** — the proposed 3-way dispatcher extension and reuse-or-create person logic align with all 5 ACs, and explicitly preserve the two existing dispatch branches unchanged, matching AC5's own regression requirement.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | teammate who received an invite email |
| H2 | ≥3 ACs Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | 4 unit + 2 integration tests covering 5 ACs |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage names a metric | ✅ | Both feature metrics named |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH | ✅ | Review run 1: 0 HIGH |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | Upstream `wsi-s1` — `team_invitations` table and `teamInvitationId` payload shape it defines; artefact exists and DoR is being signed off in the same session, sequenced before this story's own implementation begins |
| H9 | Architecture Constraints populated | ✅ | 5 bullets; ADR-025 cited with a real tamper-vector closure |
| H-E2E | Layout-dependent gap check | ✅ | None — backend redemption logic only |
| H-NFR / H-NFR2 / H-NFR3 / H-NFR-profile | ✅ | Same feature-level `nfr-profile.md` |
| H-GOV | ✅ | Same as `wsi-s1` |
| H-ADAPTER | ✅ | No new injectable adapter — extends an existing dispatcher, doesn't introduce a new `setX()` |
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
Story: Invitee accepts the invite and joins the tenant with the assigned role — artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s2-invitee-accepts-and-joins.md
Test plan: artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s2-invitee-accepts-and-joins-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Extend server.js's _combinedMagicLinkVerify to a THIRD dispatch case using
  payload.teamInvitationId. Do NOT modify _verifyInvitationRedemption or
  _verifyClientLogin's own internal logic — both existing branches must be
  regression-tested as unchanged (AC5).
- NEVER call registerMagicLinkStrategy a second time — extend the shared
  strategy via setVerifyCallback only, matching story-4-dual-path-authentication's
  own established pattern exactly.
- Reuse createClientOrgUserAndAdminMembership's resolve-or-create person logic
  (modules/client-invitations.js), but parameterise the role from the invite's
  own stored value instead of hardcoding 'admin'.
- team_memberships' tenant_id comes from the invite record (set at creation in
  wsi-s1), never from the accept-time request (ADR-025).
- Atomic single-use redemption: UPDATE ... WHERE redeemed_at IS NULL RETURNING *,
  matching client-invitations.js's own markInvitationRedeemed convention exactly.
- Depends on wsi-s1's team_invitations table and teamInvitationId payload shape
  already existing.
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

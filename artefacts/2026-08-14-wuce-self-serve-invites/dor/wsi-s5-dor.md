## Definition of Ready: PostHog instrumentation for both benefit metrics

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s5-metrics-instrumentation.md
**Test plan reference:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s5-metrics-instrumentation-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-15

---

## Contract Review

✅ **Contract review passed** — the proposed 3-event instrumentation aligns with all 4 ACs. Note: this story's own review (run 1) flagged that the User Story text and Architecture Constraints don't explicitly name the `team-management.js` cross-feature touch that AC3 requires (findings 1-M1, 1-M2) — both RISK-ACCEPTed rather than fixed. The Contract Proposal above explicitly names this touch point so the coding agent isn't working from the same narrower framing.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | platform owner |
| H2 | ≥3 ACs Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 3 unit + 1 integration test |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage names a metric | ✅ | Both feature metrics named directly (not indirect) |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH | ✅ | Review run 1: 0 HIGH (2 MEDIUM, RISK-ACCEPTed) |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | Upstream `wsi-s1` (creation event), `wsi-s2` (acceptance event) — both artefacts exist |
| H9 | Architecture Constraints populated | ✅ (see review finding 1-M2, RISK-ACCEPTed) | Populated but doesn't name the cross-feature file touch explicitly — Contract Proposal above compensates by naming it |
| H-E2E | Layout-dependent gap check | ✅ | None |
| H-NFR / H-NFR2 / H-NFR3 / H-NFR-profile | ✅ | Same feature-level `nfr-profile.md` |
| H-GOV | ✅ | Same as `wsi-s1` |
| H-ADAPTER | ✅ | Not triggered — reuses existing `_posthog.capture`, no new `setX()` |
| H-INF / H-MIG | ✅ | Not triggered |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1, W2, W5 | — | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ⚠️→✅ | User Story/Architecture Constraints don't name the cross-feature touch | RISK-ACCEPT logged in `decisions.md` (2026-08-15, findings 1-M1/1-M2) |
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
Story: PostHog instrumentation for both benefit metrics — artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s5-metrics-instrumentation.md
Test plan: artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s5-metrics-instrumentation-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Reuse the existing _posthog.capture(distinctId, eventName, properties) pattern
  (modules/posthog-server.js) — no new analytics integration.
- Three events, three insertion points: team_invite_created (in wsi-s1's invite-
  creation path), team_invite_accepted (in wsi-s2's acceptance path, including
  an elapsed-time property computed from the invite's created_at), and
  teammate_added_by_admin (a NEW event added to the EXISTING admin-add path in
  modules/team-management.js's addOrUpdateTeammate — this file belongs to a
  different, already-shipped feature, team-identity-roles; confirm via direct
  file inspection that no such event currently exists before adding it, per
  AC3's own explicit verification requirement).
- Event properties must never include the invitee's raw email address or the
  invite token.
- No dashboard/visualisation, no historical backfill — not built.
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

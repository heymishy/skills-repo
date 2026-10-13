# Definition of Ready Checklist (Short-track)

## Definition of Ready: Persona-save route rejects the client's real POST request, silently no-saving in production

**Story reference:** short-track bug fix (production functional bug)
**Test plan reference:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-hotfix2-test-plan.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-13

---

## Short-track justification

Bug fix, bounded, single-condition change in one file (`src/web-ui/server.js`), root cause confirmed directly against real staging via a live Chrome session (form fill → save → reload → blank form), then confirmed definitively via real network-request inspection (`POST` → 200 vs. a deliberate `PATCH` probe → 403) rather than assumed. Matches CLAUDE.md's own short-track criteria exactly, same pattern as `jcx-hotfix1` earlier in this feature's own history. Skips discovery through review (steps 1-4); `/definition-of-done` still applies after merge.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H3 | Every AC has ≥1 test | ✅ | 1 AC (the persona-save route accepts the client's real POST request and persists), covered by a new real-dispatch test (`check-jcx-hotfix2-persona-route-method.js`) plus live re-verification on staging after deploy |
| H9 | Architecture Constraints — no Category E HIGH | ✅ | Pure bug fix (one `req.method` string literal) — no new pattern, no schema change, no new route, no change to the handler's own logic |
| H-GOV | Production-functional-bug urgency | ✅ | Live-confirmed on `wuce-staging.fly.dev`: real UI save → real page reload → persona not persisted; confirmed via real network-request method/status inspection, not assumed |

**All hard blocks PASS.**

---

## Coding Agent Instructions

```
Proceed: Yes
Goal: Change src/web-ui/server.js line 4125's route match for
/journeys/:id/persona from req.method === 'PATCH' to
req.method === 'POST', matching the client's own already-shipped
jcxSubmitJson request shape (journeys.js) -- the same POST convention
jcx-s1's own two routes already use successfully via the same shared
helper.

Constraints:
- Do NOT change jcxSubmitJson itself (journeys.js) -- it is shared by
  jcx-s1's own two routes, which are correctly wired as POST on the
  server side and have no bug of their own. Changing the shared helper
  to PATCH would break those two working routes instead of fixing this
  one.
- Do NOT change handlePatchJourneyPersona's own internal logic -- the
  handler itself is correct; only the router's method-match condition
  is wrong.
- Add a new regression test (tests/check-jcx-hotfix2-persona-route-method.js)
  that reuses the real server.js router-dispatch harness pattern from
  check-jcx-s5-authorization.js / check-vrne-s4-edge-case-gate.js --
  dispatch a REAL POST request (matching the client's exact shape: JSON
  body, no _csrf header since the client never sends one as a header)
  through the real router and assert the persona actually persists
  (confirmed via a second real GET dispatch showing the saved values,
  not just a 200 status).
- Update tests/check-jcx-s4-persona-card.js only if its own existing
  assertions reference the route's method anywhere (confirm via grep
  before editing -- if its tests call handlePatchJourneyPersona directly,
  as the DoR for jcx-s4 specified, they are unaffected by this fix and
  need no change).
- Deploy to staging and confirm live via a real Chrome session (fill the
  persona form, save, reload, confirm the saved persona renders as a
  read-only card, not a blank form) before considering this done -- this
  is a live, confirmed production bug, not just a code fix.
- Note in decisions.md and in jcx-s4-dod.md's own Follow-up Actions that
  this is a correction to an already-merged, DoD-complete story found by
  live verification after the operator logged into staging.

Oversight level: Low (single-file, single-condition, well-understood fix)
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No — production-functional-bug fast-track, found during operator-initiated live Chrome verification across the full epic (same pattern as `jcx-hotfix1`).

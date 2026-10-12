# Definition of Ready Checklist (Short-track)

## Definition of Ready: Fix ambiguous column reference crashing the placeholder-feature trigger in production

**Story reference:** short-track bug fix (production incident)
**Test plan reference:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-hotfix1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-13

---

## Short-track justification

Bug fix, bounded, single-query change in one file (`src/web-ui/routes/journeys.js`), root cause confirmed directly against real staging logs (`flyctl logs -a wuce-staging`) after reproducing the failure live via a real Chrome click-through — not assumed. Matches CLAUDE.md's own short-track criteria exactly, same pattern as `ic-hotfix1` earlier in this feature's own history. Skips discovery through review (steps 1-4); `/definition-of-done` still applies after merge.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H3 | Every AC has ≥1 test | ✅ | 1 AC (the trigger route no longer 500s on an ambiguous column reference), covered by the existing `check-jcx-s1-placeholder-feature.js` suite (mock-pool regex updated to match) plus live re-verification on staging after deploy |
| H9 | Architecture Constraints — no Category E HIGH | ✅ | Pure bug fix (table-alias qualification on a SELECT list) — no new pattern, no schema change, no new route |
| H-GOV | Production-incident urgency | ✅ | Live 500 confirmed via a real Chrome session on `wuce-staging.fly.dev`, root-caused via `flyctl logs` |

**All hard blocks PASS.**

---

## Coding Agent Instructions

```
Proceed: Yes
Goal: Qualify every column in handleTriggerPlaceholderFeature's own stage
ownership-check SELECT (src/web-ui/routes/journeys.js) with the cjs. table
alias, matching the already-correct style used a few lines above in
handlePostPlaceholderFeature's own near-identical query.

Constraints:
- This is the ONLY query affected -- confirmed by grepping every other
  "SELECT id..." in journeys.js; all others are single-table queries with
  no JOIN, so no ambiguity risk.
- Update the matching mock-pool regex in
  tests/check-jcx-s1-placeholder-feature.js to match the corrected,
  qualified SQL text -- the mock never executed real SQL, so it would not
  itself have failed on the old unqualified query; it needs updating only
  so the test continues to intercept and mock the (now-qualified) query
  correctly, not because it ever caught the bug.
- Deploy to staging and confirm live via a real Chrome click-through
  (create a placeholder, click Trigger, confirm 200 not 500) before
  considering this done -- this is a live incident, not just a code fix;
  the original bug was only caught this way, not by any automated test.

Oversight level: Low (single-file, single-query, well-understood fix)
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No — production-incident fast-track, operator engaged directly in this session (found the gap by asking "did we confirm s1 with chrome" / "on staging").

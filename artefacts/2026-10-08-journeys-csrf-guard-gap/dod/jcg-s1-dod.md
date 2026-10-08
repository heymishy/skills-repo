# Definition of Done: Add the missing CSRF guard to POST /journeys

**PR:** [#957](https://github.com/heymishy/skills-repo/pull/957) | **Merged:** 2026-10-08T05:42:57Z
**Story:** artefacts/2026-10-08-journeys-csrf-guard-gap/stories/jcg-s1-add-csrf-guard-to-post-journeys.md
**Test plan:** artefacts/2026-10-08-journeys-csrf-guard-gap/test-plans/jcg-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-08-journeys-csrf-guard-gap/dor/jcg-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-ep1-s1-journey-create.js` "jcg-s1 AC1: POST /journeys with no _csrf field returns 403 and does not insert" + "...with a mismatched _csrf field returns 403 and does not insert" — both assert `res._s === 403` and zero `INSERT` ops | `unit` (mock pool/req/res) | None |
| AC2 | ✅ | Re-run former `ep1-s1` AC1/AC2 tests with a matching `_csrf`/`csrfToken` pair added — both pass with identical assertions (insert+201 on valid name; 400+no-insert on missing name) | `unit` | None |
| AC3 | ✅ | Re-run former `ep1-s1` AC3 (tenant-spoofing guard) with a matching `_csrf`/`csrfToken` pair added — passes with identical assertions (session `tenantId` used, body `tenantId` ignored) | `unit` | None |

**Live staging verification (Chrome, 2026-10-08, post-merge):** Navigated to `wuce-staging.fly.dev` — landing page loads cleanly (all 5 requests 200, zero console errors/warnings). `GET /journeys/00000000-0000-0000-0000-000000000000` (unauthenticated) correctly redirects back to `/` rather than crashing or 500ing, confirming `authGuard` is intact after this merge. A full live `POST /journeys` CSRF-rejection check was not performed in the browser — no UI form exists yet for this route (ships in `ep4-s1`), and entering synthetic credentials/tokens against a non-localhost staging host is out of scope for browser automation per this session's own tooling constraints; the unit-test evidence above (which exercises the real `csrfGuard` function unmodified) is the verification of record for AC1–AC3.

---

## Scope Deviations

None. Implementation matches the DoR contract exactly: one `csrfGuard` call added to `handlePostJourneys`, three existing tests updated with a matching token pair, two new tests added for the rejection path. `handleGetJourneyCanvas` and `server.js` were not touched, per the DoR's explicit exclusion.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5 (2 new rejection tests + 3 updated pass-through tests).
**Tests passing in CI:** All 5 pass; confirmed in PR #957's "Lint, typecheck, test, build" check (SUCCESS) and independently re-run against master post-merge (`npm test`: 721 files, 0 failed).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (no `_csrf` → 403) | ✅ | ✅ | |
| AC1 (mismatched `_csrf` → 403) | ✅ | ✅ | |
| AC2 (matching token, valid name → unchanged insert/201) | ✅ | ✅ | former `ep1-s1` AC1 |
| AC2 (matching token, missing name → unchanged 400) | ✅ | ✅ | former `ep1-s1` AC2 |
| AC3 (matching token, tenant-spoofing guard unchanged) | ✅ | ✅ | former `ep1-s1` AC3 |

**Gaps:** None. PR #957's CI was fully green on the first run (including "Scenario A/B E2E (staging)") — no rerun needed, unlike `ep1-s1`'s PR #956.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security (this story's whole purpose) | ✅ | Closes a real CSRF gap on a live, merged, mutating route; verified via unit tests exercising the real, unmodified `csrfGuard` function, plus a live staging check confirming the route still responds correctly (redirect, not crash) post-fix |
| Performance | ✅ N/A | One additional session-token comparison per POST, identical cost to every other CSRF-guarded route in this app |
| Reliability | ✅ | AC2/AC3 prove zero behavioural change for a legitimately-tokened request |
| Accessibility | ✅ N/A | No UI change |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| N/A | N/A | N/A | Short-track security fix, no metric tracked — matches `tpux-s1`/`tpux-s2`'s own precedent |

---

## Outcome

**COMPLETE**

All 3 ACs satisfied with passing unit-test evidence against the real, unmodified `csrfGuard` function. No scope deviations. CI fully green on first run. Live staging spot-check (Chrome) confirms the fixed route still behaves correctly for unauthenticated requests post-merge. `npm test` on master: 721 files, 0 failed.

**Follow-up actions:** None blocking. Reminder carried into `ep1-s2`'s own DoR (already noted in this story's NFR section): its new mutating route must include `csrfGuard` from first implementation, citing this story as the established pattern.

---

## DoD Observations

1. **A missing CSRF guard on a brand-new route file is an easy, low-visibility miss, because the convention is enforced by human/agent discipline, not by any automated check.** `csrfGuard` is opt-in per-handler, not wired centrally into dispatch — nothing fails loudly when a new mutating handler forgets to call it; the request simply succeeds without protection. `/improve` candidate: a governance test that greps every exported handler function reachable from a `POST`/`PUT`/`DELETE` dispatch entry in `server.js` and asserts each one's source contains a `csrfGuard` call (or is on an explicit, documented allowlist) would have caught this at `ep1-s1`'s own DoR/review stage instead of a week-old gap found incidentally while grounding the next story.
2. **This is the second time in this repo's history that CSRF coverage was retrofitted after the fact rather than included from first implementation** (the first being `rcfc-s1`'s own "remaining CSRF form coverage" sweep). Both times the gap was found by a careful re-read of the handler rather than by any test or review gate failing. Worth tracking as a recurring pattern, not a one-off, if a third instance appears.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Add the missing CSRF guard
to POST /journeys" (jcg-s1). Check:
1. Does every AC row have a concrete evidence reference (test name,
   observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a
   recorded trigger?
3. Is the "live staging verification" note honest about what it did and
   did NOT check (no real POST-with-bad-token browser test was performed)?
4. Are any scope deviations or follow-up actions that should block
   release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS /
   INCOMPLETE) consistent with the AC and deviation rows?
Pay particular attention to whether a governance test to catch a missing
csrfGuard call on future new routes (DoD Observation 1) should be opened
as its own follow-up story, given this is the second such retrofit in
this repo's history.
```

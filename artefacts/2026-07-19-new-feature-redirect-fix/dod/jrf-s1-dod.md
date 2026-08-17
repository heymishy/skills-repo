# Definition of Done: Fix "New feature" redirecting to the sign-in page for logged-in users

**PR:** #507 (commit `81a16196`, "jrf-s1: Fix new feature redirect to correct route") | **Merged:** 2026-07-19
**Story:** artefacts/2026-07-19-new-feature-redirect-fix/stories/jrf-s1.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 -- redirect target is a real, existing route, HTTP 200 not login page | Yes | `check-jrf-s1-new-feature-redirect.js` IT1 ("Authenticated POST redirects to valid skill chat route") and IT3 ("Route does not use broken /journeys/ pattern") both pass. Production code in `src/web-ui/routes/products.js`'s `handlePostProductFeature` (line ~3054) redirects to `/skills/<startSkill>/sessions/<sid>/chat`, matching the same `/skills/.../sessions/.../chat` pattern already registered and used elsewhere in `server.js` (e.g. line 2629, 2136) -- confirmed by reading the actual router chain, not assumed | Integration test + direct source read | None |
| AC2 -- redirected page shows the newly created journey's discovery stage | Yes | IT2 ("Redirected route shows discovery skill session") passes -- asserts the session created by the fix has `startSkill: 'discovery'` and is linked to the new `journeyId` | Integration test | None |
| AC3 -- genuinely unauthenticated requests still redirect to sign-in | Yes | IT4 ("Unauthenticated request redirects to sign-in endpoint") passes -- asserts a request with `session: null` gets a 302 to `/auth/github`, confirming the fix did not remove the auth guard | Integration test | None |
| AC4 -- no regression across the rest of the router chain | Partially | IT5 ("Regression -- no new failures introduced") passes, but only exercises two independent authenticated calls to the fixed handler in isolation -- it does not run the full existing suite against the documented 67/345 pre-existing-failure baseline that the DoR contract's Coding Agent Instructions explicitly required ("run the existing test suite in full and confirm the baseline failure count is unchanged"). No evidence in this session of that full-suite run having been performed as part of this story | Test named IT5 in the suite, but its scope is narrower than the DoR contract's regression requirement | See Scope Deviations |

---

## Scope Deviations

The DoR contract's Coding Agent Instructions required IT5 to be "a full router-chain regression pass" confirming the pre-existing 67/345 baseline failure count is unchanged. The `IT5` test that actually shipped in `check-jrf-s1-new-feature-redirect.js` only re-invokes the fixed handler twice with different sessions and checks the two resulting redirects differ -- it does not run the full test suite or compare against `tests/known-baseline-failures.json`. This is narrower than what AC4 and the DoR contract specified. No evidence was found in this session that the full-suite regression check was run separately and only omitted from the checked-in test file. This is a real, currently-open gap not covered by any explicit "deferred, no incident" note in the story text.

All other scope items match the story exactly: the fix changed only the redirect target inside `handlePostProductFeature`, reusing the existing `/skills/.../sessions/.../chat` pattern (per the story's stated preference for "fixing the redirect target string over registering a new route"), and did not touch `handleGetJourney` or `/journey/<slug>/resume` internals. The two other staging gaps (repo-connection UX, kanban consolidation) were correctly left out, each with its own story.

---

## Test Plan Coverage

`check-jrf-s1-new-feature-redirect.js`: **5 passed, 0 failed** (freshly re-run this session, 2026-08-17 -- the count supplied in the task brief was `null passed, null failed`, which was not a usable real result, so the suite was re-executed directly: `node tests/check-jrf-s1-new-feature-redirect.js`). All 5 named tests (IT1-IT5) pass. IT1-IT4 map cleanly to AC1-AC3. IT5 exists and passes but, per above, does not fulfil the full-suite regression scope the DoR contract specified for AC4.

---

## NFR Status

Only NFR named by the story is Security (AC3's auth-guard regression check). Confirmed via IT4 -- unauthenticated requests (`session: null`) still receive a 302 to `/auth/github`; the fix does not introduce an auth bypass. Performance, Accessibility, and Audit were all marked "Not applicable" in the story and no evidence contradicts that.

---

## Metric Signal

The story is short-track and states directly that no formal benefit-metric artefact applies ("not a metric target from a formal benefit-metric artefact (short-track)"). The stated benefit was restoring a completely broken core flow (adding a feature to any product); no dashboard or metric instrumentation is referenced by the story to independently confirm real-world usage recovery.

---

## Outcome

**COMPLETE WITH DEVIATIONS**
**Follow-up actions:** Run (or confirm was run and is simply undocumented) a full existing-suite regression pass comparing against `tests/known-baseline-failures.json`'s 67/345 baseline, as the DoR contract's Coding Agent Instructions required for AC4, and record the result. If the baseline is confirmed unchanged, this deviation can be closed with no further code change.

---

## DoD Observations

Core fix (redirect target correction to the existing `/skills/.../sessions/.../chat` pattern) is verified in both test and production source, and matches the story's own stated preference to reuse an existing route rather than add a new one. The only gap is evidentiary/process (missing full-suite regression confirmation), not a defect in the shipped behaviour itself.

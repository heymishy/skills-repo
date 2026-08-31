# Definition of Done: Retry an LLM stream call once when it fails before any content has streamed

**PR:** https://github.com/heymishy/skills-repo/pull/800 | **Merged:** 2026-08-30 (`ee0f7a23b07f3b057d0aa6605d1d8b3eb38bd018`)
**Story:** artefacts/2026-08-31-sse-timeout-retry-resilience/stories/sstr-s1-retry-on-pre-first-chunk-failure.md
**Test plan:** artefacts/2026-08-31-sse-timeout-retry-resilience/test-plans/sstr-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-31-sse-timeout-retry-resilience/dor/sstr-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-31

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | AC1 (pre-first-chunk failure retried once, succeeds silently): adapter called exactly twice; second attempt's content ("Hello") reaches the client with no error message; `session.turns` ends with a real assistant turn | `preFirstChunkFailureIsRetriedOnceAndSucceedsSilently` in `tests/check-sstr-s1-sse-retry-on-pre-first-chunk-failure.js` | None |
| AC2 | ✅ | AC2 (retry also fails -> existing error, no 3rd attempt): adapter called exactly twice, never three times; existing `"Model error — please try again."` message surfaces | `retryAlsoFailsSurfacesExistingErrorNoThirdAttempt`, same file | None |
| AC3 | ✅ | AC3 (failure after content streamed -> never retried, the critical safety boundary): adapter called exactly once when content has already streamed before the failure; both the partial content and the error message reach the client | `failureAfterContentStreamedNeverRetries`, same file | None |
| AC4 | ✅ | AC4 (dangling user turn popped on ultimate failure): `session.turns` length unchanged after an ultimate failure — the pushed user turn was removed, matching the sibling empty-response path's existing behavior | `danglingUserTurnPoppedOnUltimateFailure`, same file | None |
| AC5 | ✅ | AC5 (`sse_retry_succeeded` log event on successful retry): captured pino output contains the `sse_retry_succeeded` event, distinguishable from `llm_complete`/`sse_close` | `successfulRetryEmitsDistinguishableLogEvent`, same file | Required adding a `_setPinoLogger` test seam mid-implementation — the default test-mode pino destination is a no-op sink by design (`src/web-ui/logger.js`), so the test plan's original approach (capturing `process.stdout.write` directly) could never observe any log event regardless of implementation correctness. Not a scope deviation from the story itself, but a test-infrastructure gap discovered and closed during implementation. |

---

## Scope Deviations

None to the story's implementation scope (the retry-loop wrapping, the `_ttfbMs === null` gate, the dangling-turn pop, and the three new log events all match the DoR contract exactly). The one addition — `_setPinoLogger`, an underscore-prefixed test-only seam following this file's own existing convention (`_getHtmlSession`/`_setHtmlSession`) — was necessary purely to make AC5 observable in a test, not a change to production behavior; it defaults to the real logger and is only ever overridden inside this one test.

---

## Test Plan Coverage

**Tests from plan implemented:** 6/6 (AC1–AC5 plus the NFR test)
**Tests passing in CI:** 6/6 story suite; 576/576 full suite at merge time (0 regressions), including every other existing test file that already exercises `handlePostTurnStreamHtml`'s error path

**Gaps (tests not implemented):** None beyond the test plan's own declared Out of Scope (a live test against the real Anthropic API inducing a genuine timeout — correctly judged impractical/non-deterministic; the fake-adapter approach is this codebase's established pattern for this exact seam).

**Layout gap audit:** N/A.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No regression to normal successful-turn timing | ✅ | `noRegressionToNormalSuccessfulTurnTiming`: adapter called exactly once for a normal successful turn, unchanged from pre-fix behavior |
| Worst-case latency bound (~180s, 2× the 90s timeout) | ✅ (by design, not re-measured) | Direct consequence of retrying exactly once with no backoff — a design property stated in the DoR's accepted trade-off, not independently re-derived by this test plan (per its own Out of Scope note) |

---

## Metric Signal

No formal benefit-metric artefact — short-track resilience fix, directly traced to a live production incident (two "model.errorr" reports on `skills-framework.fly.dev`, root-caused via Fly.io logs to a genuine ~90s Anthropic-side stream stall, evidenced as transient by two sibling successful turns in the same session). Real signal: no further unrecovered `sse_error` events for a pre-first-chunk failure should appear in production logs once this fix ships; `sse_retry_succeeded` events appearing in logs would be direct, positive confirmation. Not yet measured post-deploy as of this DoD.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. Watch production Fly.io logs (`flyctl logs -a skills-framework`) after this fix is promoted, for `sse_retry_succeeded` events confirming the retry path is firing in the wild, and for the absence of further unrecovered pre-first-chunk `sse_error` events of the same shape as the original two reports. Operator-run; not automatable from here.

---

## DoD Observations

1. **A test-infrastructure gap was found and closed as part of this fix, not deferred.** The test plan's AC5 approach (capture `process.stdout.write`) assumed pino writes to real stdout in every environment; it doesn't in test mode, by an existing, deliberate design decision (`src/web-ui/logger.js`, to avoid colliding with test assertions). Discovering this only at test-run time (all other ACs passed on the first real run; only AC5 failed) rather than at test-plan-authoring time is a minor gap in that authoring step — a quick grep of `logger.js`'s own test-mode branch before writing the AC5 test approach would have caught it earlier. Not repeated here as a recommendation to add process-wide log-capture tooling; the one-off `_setPinoLogger` seam was the right-sized fix for a single test.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Retry an LLM stream call once
when it fails before any content has streamed (sstr-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable
   behaviour, or CI run)?
2. Is the AC5 deviation (test seam addition) clearly scoped as test-only, with
   no production behavior change implied?
3. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE)
   consistent with the AC and deviation rows?
4. Is Follow-up action #1 (production log watch) tracked somewhere an
   operator will actually see it, not just buried in this file?
Report findings as HIGH / MEDIUM / LOW.
```

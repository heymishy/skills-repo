# Definition of Done: Log a premature SSE client disconnect, distinguishable from a normal completion

**PR:** https://github.com/heymishy/skills-repo/pull/802 | **Merged:** 2026-08-31 (`4d0fecfda561018298bd143c928cf08e84349733`)
**Story:** artefacts/2026-08-31-sse-disconnect-observability/stories/ssdo-s1-log-premature-sse-disconnect.md
**Test plan:** artefacts/2026-08-31-sse-disconnect-observability/test-plans/ssdo-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-31-sse-disconnect-observability/dor/ssdo-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-31

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | AC1 (normal completion emits no new event): `writableEnded` is `true` by the time `'close'` fires on any of the existing `res.end()` paths; listener is a no-op | `normalCompletionEmitsNoDisconnectEvent`, `tests/check-ssdo-s1-sse-client-disconnect-logging.js` | None |
| AC2 | ✅ | AC2 (premature disconnect logs `sse_client_disconnect`): a still-in-flight turn (`writableEnded` false) with `'close'` fired manually produces the event, carrying the turn's `correlationId`/`sessionId`/`turnId` | `prematureDisconnectEmitsClientDisconnectEvent`, same file | None |
| AC3 | ✅ | AC3 (no behavior change to any existing path): the existing retry-exhausted error path still logs `sse_error` exactly as before, and does not additionally log `sse_client_disconnect` (since it too reaches `res.end()` before `'close'` fires); full suite unaffected | `noRegressionToExistingErrorPathBehaviour`, same file, plus full suite run | None |

---

## Scope Deviations

**One implementation-time correction, caught by the full suite run before commit, not a scope change:** the first implementation attached `res.on('close', ...)` unconditionally, which broke 24 existing test files with `res.on is not a function` — this codebase's shared `noopRes()`-style test-mock convention, used broadly across the existing suite, does not implement `.on()`. Fixed by guarding the attachment with `typeof res.on === 'function'` (a real `http.ServerResponse` always has one; only test mocks lack it). This is exactly the scenario `/verify-completion`-equivalent full-suite regression checking exists to catch, and it did — no production impact, since production only ever passes a real `res`.

No deviation to the story's actual scope: the listener is attached in exactly the location specified, uses `writableEnded` exactly as specified, and touches no other code path.

---

## Test Plan Coverage

**Tests from plan implemented:** 3/3 (AC1–AC3)
**Tests passing in CI:** 3/3 story suite; 579/579 full suite at merge time (0 regressions) — including the 24 files that failed against the first, unguarded implementation attempt, now all passing

**Gaps (tests not implemented):** None beyond the test plan's own declared Out of Scope (reproducing the actual production disconnect live — a proxy/network-level condition, not deterministically triggerable in a test harness; the harness instead directly simulates the `writableEnded`-false-at-`'close'` signature the real disconnect would produce, which is the only externally observable behavior this story needed to test).

**Layout gap audit:** N/A.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Negligible performance overhead | ✅ | One additional event listener per request; no polling; conditional log call only on the (rare, abnormal) disconnect path |
| Exception-safety of the listener itself | ✅ | `_turnLog` call wrapped in `try/catch`; attachment itself guarded by `typeof res.on === 'function'` |

---

## Metric Signal

No formal benefit-metric artefact — short-track observability fix, directly traced to an inconclusive production investigation (the `daep-s1`/`rssp-s1` retest, where a failed turn left only a single `sse_open` log line). Real signal: the next time this exact disconnect signature recurs, production logs should show `sse_client_disconnect` instead of silence, giving enough evidence to actually root-cause the connection drop (proxy timeout vs. some other cause) — not yet observed as of this DoD, since it depends on the failure recurring.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. Watch production Fly.io logs (`flyctl logs -a skills-framework`) for `sse_client_disconnect` events. If one appears, that is the trigger to open a genuine root-cause investigation into the disconnect itself (this story only made it diagnosable, per its own declared Out of Scope). Operator-run; not automatable from here.

---

## DoD Observations

1. **The full-suite regression check did exactly its job.** An unguarded first implementation of this exact change broke 24 existing tests; running `node scripts/run-all-tests.js` before commit (per this repo's own standing DoR/plan instruction) caught it immediately, with a one-line fix. Worth citing as a positive example, not just a near-miss: the process worked as designed, not despite it.
2. **This closes a three-part investigation chain from one production incident.** The original "review asks which stories" report led to `rssp-s1` (a real, separate `/review` SKILL.md fix) and `daep-s1` (the actual root cause — a definition-artefact parsing gap), and retesting *those* fixes live surfaced a third, independent issue (`sstr-s1`'s retry logic never engaging for a failure with zero log trace), which this story (`ssdo-s1`) makes diagnosable going forward. Four short-track stories from one operator bug report, each with a genuinely distinct root cause — worth citing in a future `/improve` pass on the value of not stopping at the first plausible-looking fix when live production evidence keeps surfacing.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Log a premature SSE client
disconnect, distinguishable from a normal completion (ssdo-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable
   behaviour, or CI run)?
2. Is the Scope Deviations entry (the res.on guard) clearly framed as a
   caught-before-merge correction, not a silent late scope change?
3. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE)
   consistent with the AC and deviation rows?
4. Is Follow-up action #1 (watching for sse_client_disconnect in production
   logs) tracked somewhere an operator will actually see it, not just buried
   in this file?
Report findings as HIGH / MEDIUM / LOW.
```

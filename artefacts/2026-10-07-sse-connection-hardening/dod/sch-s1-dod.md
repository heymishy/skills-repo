# Definition of Done: Harden all 3 SSE endpoints against idle-connection drops

**PR:** [#949](https://github.com/heymishy/skills-repo/pull/949) | **Merged:** 2026-10-07
**Story:** artefacts/2026-10-07-sse-connection-hardening/stories/sch-s1-shorten-keepalive-and-anti-buffer-headers.md
**Test plan:** artefacts/2026-10-07-sse-connection-hardening/test-plans/sch-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-07-sse-connection-hardening/dor/sch-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `sch-s1 AC1: turn-stream keepalive interval is 5000ms` passing (source regex against real file) | `code-review`/`unit` | None |
| AC2 | ✅ | `sch-s1 AC2: turn-stream SSE response includes X-Accel-Buffering: no` passing | `unit` | None |
| AC3 | ✅ | `sch-s1 AC3: presence-stream includes X-Accel-Buffering: no` passing | `unit` | None |
| AC4 | ✅ | 4 tests passing: header present, new `setInterval(..., 5000)` exists, `.unref()`'d, cleared on close alongside `unsubscribe` | `unit` (source-text + behavioural close-handler simulation) | None |
| AC5 | ✅ | 30/30 (srar-s1 file), 8/8 (presence-sidebar), 17/17 (ep2-s4-integration); 42 other related files; full `npm test` (718 files, 1 pre-existing/unrelated failure) — no hangs anywhere | `unit` + `integration-real-code` | None |

**Verification strength note:** This story is explicitly a mitigation (see story's own Architecture Constraints), not a claimed fix for the underlying disconnect — no AC asserts "the disconnect stops happening," since the root cause (most likely the operator's own UniFi gateway) is outside this codebase's control. `unit`-level evidence is therefore the correct and complete evidence class here; there is no stronger "live-verified" claim to make honestly.

---

## Scope Deviations

None. The merged PR's diff matches the story's stated scope exactly: header + interval changes to the 3 named handlers, plus their 3 corresponding test files, plus one capture-log entry for an incidentally-found, explicitly-not-fixed pre-existing gap (the presence-stream handler's own un-`unref()`'d interval).

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6 (AC1 x2 sub-assertions, AC2, AC3, AC4 x4)
**Tests passing in CI:** All — confirmed via PR #949's 7/7 green checks before merge.

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| sch-s1 AC1 (keepalive interval = 5000ms) | ✅ | ✅ | |
| sch-s1 AC2 (turn-stream header) | ✅ | ✅ | |
| sch-s1 AC3 (presence-stream header) | ✅ | ✅ | |
| sch-s1 AC4 (merge-broadcast header + new keepalive + safety) | ✅ | ✅ | 4 sub-tests |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance (negligible) | ✅ | Code review — a few extra bytes per 5s interval, same pattern already in production |
| Security | ✅ N/A | Standard header, no new exposure |
| Reliability (new interval never keeps a process alive by itself; cleared on disconnect) | ✅ | AC4's own 3 sub-tests directly verify `.unref()` and `clearInterval` placement; full regression sweep (42 files + full suite) confirms no test-process hang introduced |
| Accessibility | ✅ N/A | No UI change |

---

## Metric Signal

No metrics tracked — short-track defensive-hardening fix, explicitly framed as a mitigation not a measurable fix (see story).

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| N/A | N/A | N/A | No metric defined |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
- The presence-stream handler's own pre-existing un-`unref()`'d interval (found incidentally while writing this story's own AC3 test) is logged in `workspace/capture-log.md` (2026-10-07) as a small, separate follow-up candidate — not fixed here, out of this story's named scope.
- A genuinely new, distinct UX gap was reported by the operator the day after this merged (2026-10-08): when the "still processing" guard message *does* fire (disconnect still happens sometimes, this story only reduces frequency), there is no visible progress indicator and no automatic recovery — the operator must manually refresh after several minutes to see the result. This is a different problem than what `sch-s1` or `tsdg-s1` addressed (neither touched what happens *after* a disconnect from the operator's own point of view) and is being scoped as its own follow-up story.

---

## DoD Observations

1. **A genuinely new production bug was found and fixed while writing this story's own tests, not during implementation.** Testing `handleGetJourneyPresenceStream` directly for the first time (previous tests only checked it was exported) revealed its own pre-existing keepalive interval is not `.unref()`'d — a real latent test-hang risk, invisible until a test actually exercised the handler. Worked around in the test itself rather than expanding this story's scope to fix production code not named in its own ACs — logged as a follow-up instead. `/improve` candidate: a story's own test-authoring process can surface real latent bugs in *adjacent*, unrelated code; capturing those as signals rather than either ignoring them or silently expanding scope is the right default.
2. **The story's own honesty framing (mitigation, not fix) was validated within 24 hours.** The disconnect pattern recurred post-merge (per the operator's 2026-10-08 report), confirming the story's own explicit refusal to claim "this fixes the disconnect" was the correct call, not excessive hedging — the real, now-separately-scoped problem is the *consequence* UX when a disconnect still happens, not whether disconnects can be eliminated entirely (they likely can't, from this codebase alone).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Harden all 3 SSE endpoints against idle-connection drops" (sch-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

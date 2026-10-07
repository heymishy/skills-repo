# Definition of Done: Streaming turn endpoint must block a new attemptId while any turn is already in-flight, not just a matching one

**PR:** [#948](https://github.com/heymishy/skills-repo/pull/948) | **Merged:** 2026-10-07
**Story:** artefacts/2026-10-07-turn-stream-duplicate-generation-fix/stories/tsdg-s1-broaden-inflight-turn-guard.md
**Test plan:** artefacts/2026-10-07-turn-stream-duplicate-generation-fix/test-plans/tsdg-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-07-turn-stream-duplicate-generation-fix/dor/tsdg-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-07

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `tsdg-s1 AC1: a DIFFERENT attemptId while another is in-flight (<60s): also blocked, no concurrent LLM call` (tests/check-srar-s1-idempotent-turn-reconnect.js) passing — reproduces the exact production session-state sequence (in-flight attemptId A, incoming request with different attemptId B) and confirms 0 LLM calls, the correct "still processing" event, and the original attempt left undisturbed | `unit` | None |
| AC2 | ✅ | `tsdg-s1 AC2: a DIFFERENT attemptId proceeds normally when the existing in-flight entry is stale (>=60s)` passing | `unit` | None |
| AC3 | ✅ | All 5 pre-existing AC groups (AC1-AC7, 21 tests) in `check-srar-s1-idempotent-turn-reconnect.js` pass unmodified; 39 other test files touching the streaming turn handler (session store, canvas rendering, review split, truncation detection, PostHog wiring, audit log, SSE retry/disconnect logging, multi-story commit, etc.) all pass with zero regressions | `unit` + `integration-real-code` | None |
| AC4 | ✅ | Documented audit in the story's own Architecture Constraints, reproducible via `grep -rl "text/event-stream" src/web-ui` (2 files) and direct code read of `handlePostTurnHtml`'s `journey.turnInProgress` guard — confirmed no equivalent defect exists elsewhere, no further code change required | `code-review` (audit-type AC, not a runtime test — matches the test plan's own stated evidence type for this AC) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found.

### Verification strength note (AC1-AC3)

The underlying production defect (two concurrent LLM generations from a dropped SSE connection + resubmit) cannot practically be reproduced live on demand — it requires forcing a real mid-stream client disconnect at the exact moment a slow generation is in flight, which is not controllable from outside the browser/network stack. The test plan's own Out of Scope section states this explicitly and scopes verification at the unit level instead: reproducing the *exact session-state sequence* observed in the real production incident (an in-flight `_lastAttempt` entry, then a request carrying a genuinely different `attemptId`) and asserting the LLM executor call count is 0, not 1. This is the correct-strength evidence for this defect class — the bug lived entirely in the guard's own conditional logic over session state, not in any browser-observable behaviour, so `unit` evidence here is not a weaker substitute for `live-verified`; it is evidence of the actual mechanism that was wrong.

---

## Scope Deviations

None. The merged PR's diff matches the story's stated scope exactly: `src/web-ui/routes/skills.js`'s `handlePostTurnStreamHtml()` in-flight guard (lines ~4948-4966 as of the story), plus its own test file. No other function, route, or client-side script was touched. The out-of-scope items (retry-architecture redesign, the separate `review_split_verdict_unparseable` parsing gap, any change to the 60s staleness threshold/keepalive/`fly.toml`) were not touched.

---

## Test Plan Coverage

**Tests from plan implemented:** 2 / 2
**Tests passing in CI:** 2 / 2 (plus 21 pre-existing tests in the same file, 25/25 total; plus 39 other related files, all passing)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| tsdg-s1 AC1: different attemptId blocked while another in-flight | ✅ | ✅ | |
| tsdg-s1 AC2: different attemptId proceeds when existing in-flight is stale | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance (net positive — removes wasted concurrent work) | ✅ | Code review — the fix returns early (before any LLM call) for the blocked case; no new work added to the normal, non-duplicate path |
| Security | ✅ N/A | No new input surface; the guard change only tightens an existing concurrency check |
| Accessibility | ✅ N/A | No UI change; the existing "still processing" message text is unchanged |
| Audit/Cost (this fix IS the audit/cost correction) | ✅ | Directly closes the duplicate `$ai_generation` billing and duplicate `TURN_CREDIT_COST` deduction confirmed live in production on 2026-10-07 (see story's Architecture Constraints for the real PostHog cost figures: $0.436 + $0.1095 for one logical turn) |

---

## Metric Signal

No metrics tracked for this feature — short-track story, no `/benefit-metric` run (per the story's own Benefit Linkage section: direct benefit stated inline from a real, live-confirmed incident, not a formally tracked metric).

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| N/A | N/A | N/A | No metric defined for this short-track fix |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
- None blocking. One related-but-separate gap was found during the same live incident and deliberately left out of this story's scope: `review_split_verdict_unparseable`/`review_split_incomplete` for story `ep1-s2` during the per-story review split — not confirmed to be caused by this story's own bug, logged in `workspace/capture-log.md` (2026-10-07) as its own gap signal, with a note that it may become unreproducible once duplicate generations stop happening, or may surface as a genuinely separate `review-artefact-splitter.js` parsing defect worth a dedicated look if it recurs post-fix.

---

## DoD Observations

1. **Root cause was found by correlating two independent data sources, not from either alone.** `flyctl logs` gave the SSE open/close/disconnect timeline and `llm_duration_ms`/`turn_type` fields; PostHog's `$ai_generation` events (queried via the newly-connected PostHog MCP server) gave the per-call cost, token counts, and trace IDs. Neither source alone made the "two full, independent, billed generations for one logical turn" conclusion obvious — the Fly logs showed two `llm_complete` events with plausible-looking distinct `turnId`s (which, taken alone, could be dismissed as a normal continuation-chaining pattern), and only cross-referencing against PostHog's cost/token data (near-identical `$ai_output_tokens` ~5400 for both, both anchored to the same `$ai_trace_id`) made the duplication unambiguous. `/improve` candidate: when investigating a suspected duplicate-work defect involving both server logs and billed LLM calls, correlate both sources from the start rather than trying to conclude from logs alone.
2. **The existing `srar-s1` guard's own test suite had a real coverage gap that let this exact bug ship undetected.** `check-srar-s1-idempotent-turn-reconnect.js`'s AC3 tested "duplicate **same** attemptId while in-flight" but never tested "a genuinely **different** attemptId while another is in-flight" — the actual real-world case (a manual resubmit, or any caller that doesn't reuse the exact same attemptId as an automatic retry). `/improve` candidate: when a concurrency/idempotency guard's test suite covers the "exact duplicate" case, explicitly add a sibling test for the "different identifier, same underlying resource" case — they are easy to conflate as "the same scenario" when they are not.
3. **A better-designed precedent for this exact guard pattern already existed in the same codebase, unused by the vulnerable handler.** `handlePostTurnHtml` (the separate, non-streaming turn endpoint) already used a `journey.turnInProgress`-before-any-work boolean, immune to this entire bug class by construction (it checks "is anything in flight" before even reading the new request's own identifier). The streaming handler's own `attemptId`-matching guard was a weaker, independently-designed mechanism for conceptually the same problem. `/improve` candidate: when two code paths solve the same concurrency problem with two different mechanisms, that divergence itself is worth flagging at review time, even if both appear to work in isolation — one was more robust by design, and only incident investigation surfaced the difference.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Streaming turn endpoint must block a new attemptId while any turn is already in-flight, not just a matching one" (tsdg-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

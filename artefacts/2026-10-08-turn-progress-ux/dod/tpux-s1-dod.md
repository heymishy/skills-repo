# Definition of Done: Show visible progress during hidden continuation turns, and auto-recover from the in-flight "still processing" guard

**PR:** [#951](https://github.com/heymishy/skills-repo/pull/951) | **Merged:** 2026-10-07T19:25:29Z
**Story:** artefacts/2026-10-08-turn-progress-ux/stories/tpux-s1-visible-progress-and-inflight-autorecover.md
**Test plan:** artefacts/2026-10-08-turn-progress-ux/test-plans/tpux-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-08-turn-progress-ux/dor/tpux-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-tpux-s1-turn-progress-ux.js` AC1: all 3 content-event handlers (reasoningChunk/chunk/draftChunk) guard thinkingDiv removal on `!_isContinuation` | `unit` (structural, against real rendered client script) | None |
| AC2 | ✅ | `check-srar-s1-idempotent-turn-reconnect.js` tpux-s1 AC2: in-flight guard SSE payload includes `inFlight: true` | `unit` (behavioural, real handler) | None |
| AC3 | ✅ | `check-tpux-s1-turn-progress-ux.js` AC3: retry cap compared against 12, 5000ms `setTimeout` reusing `_attId` with incremented counter, no `appendBubble`/no re-enabled submit on that path | `unit` (structural) | None |
| AC4 | ✅ | `check-tpux-s1-turn-progress-ux.js` AC4: `window.location.reload()` reached only via the cap's else branch | `unit` (structural) | None |
| AC5 | ✅ | `check-tpux-s1-turn-progress-ux.js` AC5: non-inFlight error path unchanged (red bubble, re-enabled submit, cleared bubbles) | `unit` (structural, regression) | None |
| AC6 | ✅ | `check-srar-s1-idempotent-turn-reconnect.js` 34/34 passing; full `npm test` 719 files, 1 pre-existing/unrelated failure (same as every prior story this session) | `unit` + `integration-real-code` | None |

**Verification strength note:** AC1/AC3/AC4/AC5 are verified structurally (against the real rendered client script text, not a browser/DOM runtime), per this repo's own established convention — see test plan's Coverage gaps. No regression observed; this is the same evidence class used by `srar-s1` AC6/AC7 and `sch-s1` AC1.

---

## Scope Deviations

None. The merged PR's diff matches the story's stated scope exactly: the three `thinkingDiv` guard sites, the `evt.inFlight` branch (with its retry-cap/reload logic) inside `sendTurn`'s `evt.error` handler, the `sendTurn` signature's new retry-count parameter, and the one `inFlight: true` addition to the server-side guard's SSE write — plus the two named test files.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5 (AC1, AC2, AC3, AC4, AC5 — AC6 is a regression check, not a new test)
**Tests passing in CI:** All — confirmed via PR #951's 8/8 green checks before merge, and re-confirmed directly on master post-merge.

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| tpux-s1 AC1 (thinkingDiv survives continuation's first content event) | ✅ | ✅ | |
| tpux-s1 AC2 (server-side inFlight: true payload) | ✅ | ✅ | |
| tpux-s1 AC3 (quiet retry scheduled under cap) | ✅ | ✅ | |
| tpux-s1 AC4 (reload at cap) | ✅ | ✅ | |
| tpux-s1 AC5 (non-inFlight error unchanged) | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | Negligible — an extra `setTimeout`-scheduled fetch every 5s only while the in-flight guard is actively tripping, capped at 60s total |
| Security | ✅ N/A | No new input surface; `inFlight` is server-asserted, not client-supplied |
| Reliability | ✅ | AC4's bounded-retry requirement (12 × 5000ms, matching the server's own 60s staleness window) directly verified; no unbounded-retry risk |
| Accessibility | ✅ N/A | No markup change to the thinking-dots bubble itself, only when it is removed |

---

## Metric Signal

No metrics tracked — short-track UX fix, no `/benefit-metric` run.

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| N/A | N/A | N/A | No metric defined. Qualitative validation is the operator's own next live use of `/review`/`/test-plan`/`/dor` — a continuation turn should now show a persistent thinking indicator throughout, and an SSE-drop-triggered retry should no longer surface a dead-end message within the first 60s. |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
- Qualitative live spot-check of the fix recommended on the next long `/review`/`/test-plan`/`/dor` turn, matching this repo's own convention of verifying UX fixes live in the browser where practical (per the session instructions' UI-change testing guidance) — not yet done, since the bug itself is intermittent (depends on an SSE drop or a long enough continuation actually occurring).
- No other follow-ups; both named out-of-scope items in the story (staleness-window tuning, guard-trigger-frequency reduction) remain correctly out of scope, owned respectively by `tsdg-s1` and `sch-s1`.

---

## DoD Observations

1. **A real, unrelated, repo-wide CI gate failure was found and fixed as a side effect of this story's own PR, not introduced by it.** The Trace Validation workflow scans the entire `pipeline-state.json`/`artefacts/` tree rather than just the current PR's diff, so a pre-existing mismatch in a completely different feature (`2026-10-05-customer-journey-as-first-class`: `pipeline-state.json` claimed `discoveryStatus: complete` while `discovery.md` itself still said `Status: Draft` / `Approved By: Pending`) was silently blocking every open PR's required status checks, not just this one. Confirmed with the operator before touching it, since approving someone's own discovery artefact on their behalf without asking would have been overstepping — the operator confirmed they were in fact approving it now. `/improve` candidate: a periodic (not just PR-triggered) Trace Validation run against master would surface this class of drift before it blocks an unrelated PR, rather than discovering it only when the next PR happens to touch a matched path.
2. **GitHub Actions' path-filtered `pull_request` workflows did not re-trigger reliably on a merge commit or on a `reopened` event, only on a genuine new-content `synchronize` push.** Two attempts to force a re-run (manual `gh run rerun` reusing a stale cached merge-ref snapshot, and closing/reopening the PR) both failed to produce a fresh evaluation against updated master; only a plain non-merge commit touching one of the filtered paths (`.github/pipeline-state.json`) triggered a correct fresh run. Worth noting for any future case where a path-filtered required check needs to pick up a master-side fix after a PR is already open — a trivial real content change, not a rerun or reopen, is the reliable lever.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Show visible progress during
hidden continuation turns, and auto-recover from the in-flight still-processing
guard" (tpux-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
```

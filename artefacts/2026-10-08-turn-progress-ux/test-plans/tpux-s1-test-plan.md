## Test Plan: Show visible progress during hidden continuation turns, and auto-recover from the in-flight "still processing" guard

**Story reference:** artefacts/2026-10-08-turn-progress-ux/stories/tpux-s1-visible-progress-and-inflight-autorecover.md
**Epic reference:** None — short-track
**Test plan author:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

**Real architecture grounding (confirmed by direct code read, 2026-10-08):**
- `src/web-ui/routes/skills.js:4975-4980`: the in-flight guard's `res.write('data: ' + JSON.stringify({ error: '...' }) + '\n\n')` — the write to add `inFlight: true` to. Server-side; testable behaviourally via the existing `mockRes()`/`res._events` harness already present in `tests/check-srar-s1-idempotent-turn-reconnect.js` (it already asserts `res._events[0].error` for this exact guard at lines 144 and 170).
- `src/web-ui/routes/skills.js:~3923-4109`: the client-side `sendTurn()` function, embedded as an array of JS string literals (not executed in Node) rendered into the chat page's `<script>` tag. No existing test exercises this code at runtime (confirmed: no `thinkingDiv`/`_isContinuation` references anywhere in `tests/check-srar-s1-idempotent-turn-reconnect.js` or elsewhere). Verification for this part follows this repo's own established convention for an exact-literal/structural regression guard on generated source text (see `sch-s1` AC1's keepalive-interval regex test) — a source-text assertion against the real file content, not a DOM/runtime harness, since no browser/jsdom test infrastructure exists in this repo today and introducing one is out of scope for a short-track fix.

**E2E/browser-layout detection (Step 3a):** N/A — no CSS/layout-dependent AC; this is JS control-flow and a server SSE field, not rendering.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | thinkingDiv not removed for continuation turns on first content event | 1 test (source-text structural) | — | — | — | — | 🟢 |
| AC2 | In-flight guard SSE payload includes `inFlight: true` | 1 test (behavioural, extends existing harness) | — | — | — | — | 🟢 |
| AC3 | `evt.inFlight` under retry cap: quiet retry scheduled, no red bubble, button stays disabled | 1 test (source-text structural) | — | — | — | — | 🟢 |
| AC4 | `evt.inFlight` at retry cap: `window.location.reload()` called instead of another retry | 1 test (source-text structural) | — | — | — | — | 🟢 |
| AC5 | Non-`inFlight` `evt.error` behaviour unchanged | 1 test (source-text structural, regression) | — | — | — | — | 🟢 |
| AC6 | Existing suite passes unmodified | — | — | — | — | — | 🟢 (regression — reruns existing suites unchanged) |

---

## Coverage gaps

AC1/AC3/AC4/AC5 are verified via source-text structural assertions (regex/substring checks against the real client-script string content in `skills.js`), not a runtime DOM harness — this repo has no jsdom/browser test infrastructure today, and the existing convention for generated/templated source (per `sch-s1` AC1) is a direct literal/structural check against the real file. This gives a weaker guarantee than a true runtime test (it confirms the *code shape* is correct, not that a real browser executing it produces the described behaviour) but matches this repo's own established practice and avoids introducing new test infrastructure for a short-track fix. Residual risk is mitigated by live manual verification in the browser as part of DoD (see story's Benefit Linkage — this bug was itself found via live operator observation, and the fix should be spot-checked the same way before DoD sign-off).

---

## Test Data Strategy

**Source:** Synthetic — plain mock `req`/`res` objects for AC2 (matching `check-srar-s1-idempotent-turn-reconnect.js`'s own existing `mockRes()`/`res._events` convention exactly); raw source text of `src/web-ui/routes/skills.js` read via `fs.readFileSync` for AC1/AC3/AC4/AC5.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Raw source text of `skills.js` | Real file | None | Assert the `thinkingDiv` removal lines inside the `reasoningChunk`/`chunk`/`draftChunk` handlers are each guarded by `!_isContinuation` |
| AC2 | Minimal session with a mocked in-flight `_lastAttempt`, same fixture shape as the existing tsdg-s1 AC1/AC3 tests in `check-srar-s1-idempotent-turn-reconnect.js` | Synthetic | None | Extends the same test, asserts `res._events[0].inFlight === true` |
| AC3 | Raw source text of `skills.js` | Real file | None | Assert the `evt.inFlight` branch exists, schedules `setTimeout(..., 5000)` calling `sendTurn` with an incremented retry-count param, and does not call `appendBubble` or re-enable `submitBtn` on that path |
| AC4 | Raw source text of `skills.js` | Real file | None | Assert a retry-count comparison against `12` guards between the quiet-retry branch and a `window.location.reload()` call |
| AC5 | Raw source text of `skills.js` | Real file | None | Assert the pre-existing non-`inFlight` cleanup/red-bubble/re-enable code is still present and reachable when `evt.inFlight` is falsy |

### PCI / sensitivity constraints

None.

### Gaps

None beyond the structural-vs-runtime gap noted above.

---

## Unit Tests

### thinkingDiv survives the first content event on a continuation turn

- **Verifies:** AC1
- **Action:** Read `src/web-ui/routes/skills.js`'s source text; locate the `reasoningChunk`, `chunk`, and `draftChunk` handler blocks inside `sendTurn`; regex-match each `thinkingDiv` removal condition
- **Expected result:** All three removal conditions include `!_isContinuation` (or equivalent — the removal is conditional on the turn NOT being a continuation)
- **Edge case:** No — direct structural regression guard

### In-flight guard SSE payload includes inFlight: true

- **Verifies:** AC2
- **Precondition:** A session with `_lastAttempt = { attemptId: 'attempt-original', status: 'in-flight', startedAt: Date.now() }` (same fixture as the existing tsdg-s1 AC1 test, `check-srar-s1-idempotent-turn-reconnect.js` ~line 147-173)
- **Action:** Call `handlePostTurnStreamHtml` with a different attemptId while the original is still in-flight
- **Expected result:** `res._events[0].inFlight === true`, `res._events[0].error` unchanged (still contains "still processing"), LLM executor still not called (existing assertion preserved)
- **Edge case:** No

### Quiet retry scheduled under the cap, no dead-end UI shown

- **Verifies:** AC3
- **Action:** Read `skills.js`'s source text; locate the `evt.error` handling block; regex-match the `evt.inFlight` branch
- **Expected result:** The branch (a) compares a retry counter against a cap of `12`, (b) calls `setTimeout` with a `5000` delay recursing into `sendTurn` with the retry counter incremented, (c) does not call `appendBubble` or set `submitBtn.disabled = false` on that branch
- **Edge case:** No

### Retry cap reached triggers reload instead of another retry

- **Verifies:** AC4
- **Action:** Same source-text region as above; regex-match the branch taken when the retry counter is NOT below 12 and `evt.inFlight` is true
- **Expected result:** That branch calls `window.location.reload()` and does not call `setTimeout`/schedule another `sendTurn`
- **Edge case:** Yes — the boundary at exactly 12 prior retries is the case under test

### Non-inFlight errors are unchanged

- **Verifies:** AC5
- **Action:** Same source-text region; regex-match the fallback branch reached when `evt.inFlight` is falsy
- **Expected result:** `thinkingDiv`/`streamDiv` cleanup, `appendBubble` with the red error span, and `submitBtn.disabled = false` are all still present and unconditional on that path (unchanged from the pre-fix source)
- **Edge case:** No — regression guard

### Existing suite regression

- **Verifies:** AC6
- **Action:** Run `node tests/check-srar-s1-idempotent-turn-reconnect.js` directly, then `npm test`
- **Expected result:** All pre-existing tests in that file pass unmodified; no new failures anywhere else in the suite; no hangs
- **Edge case:** No

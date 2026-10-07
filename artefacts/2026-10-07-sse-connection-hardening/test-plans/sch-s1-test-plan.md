## Test Plan: Harden all 3 SSE endpoints against idle-connection drops

**Story reference:** artefacts/2026-10-07-sse-connection-hardening/stories/sch-s1-shorten-keepalive-and-anti-buffer-headers.md
**Epic reference:** None — short-track
**Test plan author:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-07

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`. This story extends 3 existing files: `tests/check-srar-s1-idempotent-turn-reconnect.js` (turn-stream, already has `mockRes()` capturing headers via `res.writeHead`), `tests/check-ep2-s1-presence-sidebar.js` (presence-stream), and `tests/check-ep2-s4-integration.js` (merge-broadcast, already has `makeRes()` capturing `_headers`/`_writes`/`_closeHandlers`).

**Real architecture grounding (confirmed by direct code read, 2026-10-07):**
- `src/web-ui/routes/skills.js:4930`: `var _keepaliveInterval = setInterval(function() { ... }, 15000);` — a literal to change to `5000`.
- `src/web-ui/routes/skills.js:4908-4912`: the `res.writeHead(200, {...})` headers object for the turn-stream — a key to add.
- `src/web-ui/routes/journey.js:3819-3823` (presence-stream) and `:3874-3878` (merge-broadcast): both `res.writeHead(200, {...})` header objects.
- `src/web-ui/routes/journey.js:3880-3883`: the merge-broadcast handler's existing `broadcastModule.subscribe(key, res)` + `res.on('close', function () { broadcastModule.unsubscribe(key, res); })` — the exact point to add the new interval and its own `clearInterval` on close.
- `tests/check-ep2-s4-integration.js`'s own `makeRes()` (lines 94-101) stores close handlers in `res._closeHandlers` rather than invoking them automatically, and this test file does not call `process.exit()` — confirmed real risk requiring `.unref()` on the new interval (see story's own Architecture Constraints).

**E2E/browser-layout detection (Step 3a):** N/A — pure server-side header/interval configuration change, no UI.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Turn-stream keepalive interval is 5000ms | 1 test (source regex) | — | — | — | — | 🟢 |
| AC2 | Turn-stream response includes X-Accel-Buffering: no | 1 test | — | — | — | — | 🟢 |
| AC3 | Presence-stream response includes X-Accel-Buffering: no | 1 test | — | — | — | — | 🟢 |
| AC4 | Merge-broadcast response includes header + new 5s keepalive, unref'd, cleared on close | 2 tests | — | — | — | — | 🟢 |
| AC5 | All existing tests across 3 files pass, no hang | — | — | — | — | — | 🟢 (regression — reruns existing suites unchanged, plus an explicit hang-safety check) |

---

## Coverage gaps

AC1 is verified via source-text inspection (regex against the real file content) rather than a timing-based runtime test, matching this repo's own established convention for asserting an exact numeric/string literal (see `watermark-gate-check`'s own `floor-constant-value-is-0.70` test) — triggering a real 5-second wait in a unit test is unnecessary and would slow the suite for no added confidence over reading the literal directly.

---

## Test Data Strategy

**Source:** Synthetic — plain mock `req`/`res` objects, matching each target file's own existing convention exactly (`mockRes()` in the srar-s1 file, `makeRes()`/`makeReq()` in the ep2-s4 file, whatever `check-ep2-s1-presence-sidebar.js` already uses).
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Raw source text of `src/web-ui/routes/skills.js` | Real file, read via `fs.readFileSync` in the test | None | |
| AC2 | A minimal session/session with a mocked LLM adapter, same as existing srar-s1 tests | Synthetic | None | |
| AC3 | A minimal authenticated req/journey fixture, matching `check-ep2-s1-presence-sidebar.js`'s own existing setup | Synthetic | None | |
| AC4 | `makeReq()`/`makeRes()` from `check-ep2-s4-integration.js`, plus a real journey via `createJourney()` (existing pattern in that file) | Synthetic | None | Must explicitly invoke the stored close handler and assert `clearInterval` behaviour indirectly via no further `res.write` after close, OR assert the interval reference itself is `.unref()`'d if directly inspectable |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Turn-stream keepalive interval is 5000ms

- **Verifies:** AC1
- **Action:** Read `src/web-ui/routes/skills.js`'s source text; regex-match the `_keepaliveInterval = setInterval(function() { ... }, N)` literal
- **Expected result:** `N === 5000`
- **Edge case:** No — direct literal-value regression guard

### Turn-stream SSE response includes X-Accel-Buffering: no

- **Verifies:** AC2
- **Precondition:** Same session/session fixture as the existing srar-s1 AC1 test
- **Action:** Call `handlePostTurnStreamHtml` with a mocked LLM adapter; inspect the headers object passed to `res.writeHead`
- **Expected result:** `headers['X-Accel-Buffering'] === 'no'`, and the pre-existing `Content-Type`/`Cache-Control`/`Connection` headers are unchanged
- **Edge case:** No

### Presence-stream SSE response includes X-Accel-Buffering: no

- **Verifies:** AC3
- **Action:** Call `handleGetJourneyPresenceStream` with a minimal authenticated req; inspect the headers object passed to `res.writeHead`
- **Expected result:** `headers['X-Accel-Buffering'] === 'no'`
- **Edge case:** No

### Merge-broadcast SSE response includes the header and a new keepalive

- **Verifies:** AC4
- **Precondition:** A real journey created via the existing `createJourney()` pattern in `check-ep2-s4-integration.js`
- **Action:** Call `handleGetArtefactMergeStream`; inspect `res._headers['X-Accel-Buffering']`; separately confirm a `setInterval` call was registered for this handler (via source-text inspection of the handler's own function body, matching AC1's convention, since directly observing a real 5s timer firing in a fast unit test is impractical)
- **Expected result:** Header present; source text confirms a new `setInterval(..., 5000)` call exists within `handleGetArtefactMergeStream`'s own function body, immediately followed by a `.unref()` call, and the existing `res.on('close', ...)` callback body now also contains a `clearInterval` call for the same interval variable
- **Edge case:** Yes — this is the one new interval in this story; its safety properties (`.unref()`, `clearInterval` on close) are the specific risk named in the story's own Architecture Constraints

### No test process hang introduced

- **Verifies:** AC5 (specifically the hang-safety half)
- **Action:** Run `node tests/check-ep2-s4-integration.js` directly (not merely assert within it) and confirm the process exits within a bounded time (the test runner's own existing per-file timeout in `scripts/run-all-tests.js` already enforces this — no new timeout logic needed, just confirming this file's own exit behaviour is unaffected)
- **Expected result:** Process exits cleanly, matching its pre-existing behaviour
- **Edge case:** Yes — the specific hang risk this story's own Architecture Constraints names and mitigates via `.unref()`

---

## Integration Tests

None — these are pure handler-level header/interval changes exercised entirely through each target file's own existing direct-handler-invocation convention (no new HTTP route, no new middleware).

---

## NFR Tests

None — the story's own NFR section states Performance is negligible, Security is N/A (a standard header), Accessibility is N/A, and Reliability is covered directly by AC4/AC5's own test coverage (not a separate NFR-labelled test).

---

## Out of Scope for This Test Plan

- Any live reproduction of an actual UniFi-triggered disconnect — not controllable on demand, and the story itself is explicitly framed as a mitigation, not a guaranteed fix, so there is no "prove the disconnect no longer happens" AC to test against.
- Any test of `fly.toml` configuration — unchanged by this story.

---

## Gap table

No gaps.

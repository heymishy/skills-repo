# Contract Proposal: Client-side reconnect-on-resume for a dropped SSE turn, with idempotent server-side replay

**Story reference:** artefacts/2026-09-01-sse-reconnect-on-resume/stories/srar-s1-idempotent-turn-reconnect.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-09-01

---

## What will be built

- **Server** (`handlePostTurnStreamHtml`, `src/web-ui/routes/skills.js`): immediately after session lookup, SSE header write, keepalive setup, and the disconnect-logging listener (all unchanged), parse `var _attemptId = (body && typeof body.attemptId === 'string' && body.attemptId) ? body.attemptId : null;` and insert the guard:
  ```js
  if (_attemptId && session._lastAttempt && session._lastAttempt.attemptId === _attemptId) {
    if (session._lastAttempt.status === 'complete') {
      res.write('data: ' + JSON.stringify({ done: true, resumed: true }) + '\n\n');
      clearInterval(_keepaliveInterval);
      res.end();
      return;
    }
    if (session._lastAttempt.status === 'in-flight' && (Date.now() - session._lastAttempt.startedAt) < 60000) {
      res.write('data: ' + JSON.stringify({ error: 'This turn is still processing — please wait a moment and try again.' }) + '\n\n');
      clearInterval(_keepaliveInterval);
      res.end();
      return;
    }
    // stale in-flight (>60s) -- fall through, treated as a fresh attempt below
  }
  if (_attemptId) {
    session._lastAttempt = { attemptId: _attemptId, status: 'in-flight', startedAt: Date.now() };
  }
  ```
  placed before the existing `__init__`-already-done guard.
- Mark `complete` at the two genuine success points:
  1. The `ssp.1` precomputed-Step-1 early return (`ssdo-s1`/`ssp.1` block, ~line 4730-4741): add `if (_attemptId) { session._lastAttempt = { attemptId: _attemptId, status: 'complete', startedAt: Date.now() }; }` immediately before that block's `res.end()`.
  2. The main end-of-function completion (~line 5397-5407): same one-line update immediately before the final `res.end()`.
- **Client** (`sendTurn`, embedded script string in the same file): generate `var attemptId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now() + '-' + Math.random().toString(36).slice(2));` once per logical `sendTurn` call site (not per retry — passed through when the function re-invokes itself for its one retry), include it in the POST body (`JSON.stringify({answer: answer, attemptId: attemptId})`), add a `resumed` handling branch inside the existing `evt.done !== undefined` block (`if (evt.resumed) { window.location.reload(); return; }`, checked before the existing done/not-done branches), and change the outer `.catch` to auto-retry once (via a closure flag) when `err.message !== 'session-expired'`, reusing the same `attemptId`.

## What will NOT be built

- No replay of mid-stream content (chunks, canvas blocks, assumption cards) for a short-circuited duplicate — the reload-and-resume path handles that via existing infrastructure.
- No change to `htmlSubmitTurn` (non-streaming handler).
- No change to `fly.toml`.
- No cross-machine/distributed attempt tracking — `_lastAttempt` is per in-memory session object, consistent with all other per-session turn state in this file.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | New attemptId, drive one turn, assert unchanged turn/credit/session behaviour | Unit |
| AC2 | Same attemptId after completion, assert no LLM re-call, no re-push, `resumed:true` response | Unit |
| AC3 | Manually seeded in-flight `_lastAttempt` <60s old, assert wait-error response, no LLM call | Unit |
| AC4 | Manually seeded in-flight `_lastAttempt` >60s old, assert treated as fresh | Unit |
| AC5 | No attemptId field, assert `_lastAttempt` never set, unchanged behaviour | Unit |
| AC6/AC7 | Source-inspection of the generated client script string for the retry/reload logic | Unit (source-inspection) |
| AC8 | Run `check-sstr-s1-...` and `check-ssdo-s1-...` unmodified | Regression |

## Assumptions

- Fly's `suspend` mode is a true pause/resume (Firecracker microVM snapshot), not a process restart — confirmed by Fly's own documented behavior for `auto_stop_machines='suspend'`. This is why a naive retry needs a real idempotency guard rather than just "the old request is simply gone."
- The existing session-resume/restore rendering path (already covered by `s0.4`/`wusl-s2` tests) correctly reconstructs the full chat view — including any canvas blocks/assumption cards — from `session.turns` and related session fields after a page reload. This story does not modify that path; it relies on it.
- `window.crypto.randomUUID` is available in all supported browsers for this app (already used elsewhere in this same file for other IDs, e.g. `$ai_span_id` server-side and other client-side ID generation in this codebase's browser-targeted scripts).

## Estimated touch points

Files: `src/web-ui/routes/skills.js` only (both the server function and its embedded client script string). New test file: `tests/check-srar-s1-idempotent-turn-reconnect.js`.

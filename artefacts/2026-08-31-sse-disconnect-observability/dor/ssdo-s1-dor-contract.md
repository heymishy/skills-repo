# Contract Proposal: Log a premature SSE client disconnect, distinguishable from a normal completion

**Story reference:** artefacts/2026-08-31-sse-disconnect-observability/stories/ssdo-s1-log-premature-sse-disconnect.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-08-31

---

## What will be built

- In `src/web-ui/routes/skills.js`'s `handlePostTurnStreamHtml`, immediately after `res.writeHead(200, {...})` (and its adjacent `_turnLog.info({event:'sse_open'}, ...)` call), attach:
  ```js
  res.on('close', function() {
    if (!res.writableEnded) {
      try { _turnLog.warn({ event: 'sse_client_disconnect' }, 'SSE connection closed before the response completed'); } catch (_) {}
    }
  });
  ```
- No other code path changes.

## What will NOT be built

- No fix for the disconnect's actual root cause (unknown/unconfirmed).
- No retry or reconnection logic.
- No change to any other SSE/streaming handler in the codebase.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Real successful turn via existing harness; emit `'close'` afterward; assert no `sse_client_disconnect` in captured log | Unit |
| AC2 | Mock response with `writableEnded` false; emit `'close'`; assert `sse_client_disconnect` present with correlation fields | Unit |
| AC3 | Full suite run, compare pass count to baseline | Regression |

## Assumptions

- `res.writableEnded` (standard Node.js `http.ServerResponse` property since Node 12.9) is a reliable, already-correct signal for "has `.end()` been called on this response" — confirmed by Node's own documentation and by the fact this codebase's Node target (per `package.json`/CI's `node-version: '20'`) is well past that version.

## Estimated touch points

Files: `src/web-ui/routes/skills.js` only. Services: none. APIs: none.

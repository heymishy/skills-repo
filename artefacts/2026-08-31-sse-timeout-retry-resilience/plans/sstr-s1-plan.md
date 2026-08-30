# Retry an LLM stream call once when it fails before any content has streamed — Implementation Plan

> **For agent execution:** Single session — /tdd, one task (this story's change is a single cohesive edit; splitting it further would leave intermediate states that don't compile/behave sensibly).

**Goal:** Wrap the existing streaming try/catch in `skills.js` in a retry-once loop, gated on `_ttfbMs === null` (no content streamed yet), plus fix the dangling-user-turn cleanup on ultimate failure.
**Branch:** `feature/sstr-s1`
**Worktree:** `.worktrees/sstr-s1`
**Test command:** `node tests/check-sstr-s1-sse-retry-on-pre-first-chunk-failure.js`

---

## File map

```
Create:
  tests/check-sstr-s1-sse-retry-on-pre-first-chunk-failure.js — story test suite (AC1-AC5 + NFR)

Modify:
  src/web-ui/routes/skills.js — wrap the streaming try/catch in a retry loop
```

---

## Task 1: Write the failing tests, then implement the retry loop

- [ ] Write all 6 tests from the test plan in `tests/check-sstr-s1-sse-retry-on-pre-first-chunk-failure.js`, using the same real-render harness pattern as `check-csd-s2-canvas-diagram-rendering.js` (`handleGetChatHtml` + extracted client script + `handlePostTurnStreamHtml` via the injected `setSkillTurnExecutorStreamAdapter`).
- [ ] Confirm all 6 fail (the retry loop doesn't exist yet — a pre-first-chunk failure today calls the adapter exactly once and always shows the generic error, with the dangling user turn left in `session.turns`).
- [ ] Locate the try block in `skills.js` (`var fullText = ''; try { ... } catch (err) { ... }`, roughly lines 4777–5089).
- [ ] Wrap it: `var _sseRetried = false; for (;;) { try { ...unchanged body... break; } catch (err) { if (!_sseRetried && _ttfbMs === null) { _sseRetried = true; _turnLog.warn({ event: 'sse_retry_attempt', error_message: err.message }, 'Retrying LLM call after pre-first-chunk failure'); continue; } clearInterval(_keepaliveInterval); if (_sseRetried) { _turnLog.info({ event: 'sse_retry_exhausted' }, 'Retry also failed'); } _turnLog.error({ event: 'sse_error', error_message: err.message }, 'SSE stream error'); var _danglingIdx = session.turns.length - 1; if (_danglingIdx >= 0 && session.turns[_danglingIdx].role === 'user') { session.turns.pop(); } res.write('data: ' + JSON.stringify({ error: 'Model error — please try again.' }) + '\n\n'); res.end(); return; } }`
- [ ] Emit `sse_retry_succeeded` (with `_turnLog.info`) at the point right after the loop breaks successfully, gated on `_sseRetried === true`.
- [ ] Run the story suite — all 6 pass.
- [ ] Run the full suite (`node scripts/run-all-tests.js`) — 0 regressions. Pay particular attention to any other test file that already exercises `handlePostTurnStreamHtml`'s error path (e.g. existing tests asserting the exact "Model error" string) — confirm those still pass unchanged, since AC2/AC3 preserve that exact message for the non-recoverable case.
- [ ] Commit: `fix(sstr-s1): retry LLM stream call once on pre-first-chunk failure (AC1-AC5)`
- [ ] Open draft PR.

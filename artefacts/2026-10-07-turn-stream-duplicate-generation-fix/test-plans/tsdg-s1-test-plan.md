## Test Plan: Streaming turn endpoint must block a new attemptId while any turn is already in-flight, not just a matching one

**Story reference:** artefacts/2026-10-07-turn-stream-duplicate-generation-fix/stories/tsdg-s1-broaden-inflight-turn-guard.md
**Epic reference:** None — short-track
**Test plan author:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-07

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`. This story's own tests extend the existing dedicated test file `tests/check-srar-s1-idempotent-turn-reconnect.js` (not a new file — that file already owns `handlePostTurnStreamHtml`'s in-flight/resume-guard coverage, has the right mock-adapter/session-fixture helpers, and this story fixes a gap in that same guard).

**Real architecture grounding (confirmed by direct code read + live production correlation, 2026-10-07):**
- `src/web-ui/routes/skills.js`'s `handlePostTurnStreamHtml()` guard (lines ~4948-4966) currently requires `session._lastAttempt.attemptId === _attemptId` before checking in-flight/complete status at all. A different attemptId skips the guard entirely.
- The test file already exposes `routes._setHtmlSession`, `routes._getHtmlSession`, `routes.setSkillTurnExecutorStreamAdapter`, and calls `routes.handlePostTurnStreamHtml` directly — no new test infrastructure needed, same `mockRes()`/`freshRequire()` helpers reused.
- AC3 of the existing `srar-s1` test file already covers "duplicate **same** attemptId while in-flight (<60s)" — this story's new tests cover the previously-untested "**different** attemptId while another is in-flight" case, which is the actual bug.

**E2E/browser-layout detection (Step 3a):** N/A — this is a pure Node handler-level fix with mocked LLM adapter and in-memory session state, no rendered UI change, no CSS/layout behaviour.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Different attemptId blocked while another is in-flight (<60s) | 1 test | — | — | — | — | 🟢 |
| AC2 | Different attemptId proceeds when existing in-flight is stale (≥60s) | 1 test | — | — | — | — | 🟢 |
| AC3 | Existing srar-s1 suite (5 AC groups) unaffected | — | — | — | — | — | 🟢 (regression — reruns existing suite unchanged) |
| AC4 | Audit confirms no equivalent fix needed elsewhere | — | — | — | — | — | 🟢 (documented in story's Architecture Constraints; verified by direct `grep` audit reproduced below, not a runtime test) |

---

## Coverage gaps

AC4 is a documentation/audit AC, not a runtime-testable one — its evidence is the `grep` commands in the story's own Architecture Constraints section, reproducible by anyone reviewing this story. No gap: this is the correct test type for "confirm no further code exists to be wrong."

---

## Test Data Strategy

**Source:** Synthetic — plain in-memory session objects built in test setup, matching `check-srar-s1-idempotent-turn-reconnect.js`'s own existing convention (a mocked `skillTurnExecutorStream` adapter, no real Anthropic calls, no real Fly/network involved).
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A session pre-seeded with `_lastAttempt: { attemptId: 'attempt-X', status: 'in-flight', startedAt: Date.now() }`, then a turn request with a **different** `attemptId: 'attempt-Y'` | Synthetic | None | Mirrors the real production sequence (attemptId 51845db7 in-flight, then attemptId 81d0cb15 arriving) exactly |
| AC2 | Same shape as AC1, but `startedAt: Date.now() - 61000` (stale) | Synthetic | None | Confirms the 60s staleness fallback still works for the different-attemptId case too |
| AC3 | `check-srar-s1-idempotent-turn-reconnect.js`'s own existing fixtures (AC1-AC5, AC6/AC7) | Synthetic | None | Regression only, no new fixtures |
| AC4 | N/A — audit evidence, not test data | N/A | N/A | See story's Architecture Constraints |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### A genuinely different attemptId is blocked while another attempt is in-flight (<60s)

- **Verifies:** AC1
- **Precondition:** `routes._setHtmlSession(sid, { ..., _lastAttempt: { attemptId: 'attempt-original', status: 'in-flight', startedAt: Date.now() } })` — mirrors a turn that is still running server-side
- **Action:** Call `routes.handlePostTurnStreamHtml({ ..., body: { answer: 'hi', attemptId: 'attempt-retry' } }, res)` — a **different** attemptId, mirroring a manual resubmit after the client's own single auto-retry already failed
- **Expected result:** The mocked LLM executor adapter is called exactly **0** times for this request (not 1 — this is the precise regression this story closes: the OLD guard would call it once, producing a second, independent, fully-billed generation); exactly one SSE event is written, `{ error: 'This turn is still processing — please wait a moment and try again.' }`; `session._lastAttempt` after the call still shows `attemptId: 'attempt-original'` (not overwritten by `attempt-retry`)
- **Edge case:** Yes — this is the exact production failure mode (two different attemptIds, one genuinely in-flight), reproduced directly

### A different attemptId proceeds normally when the existing in-flight attempt is stale (≥60s)

- **Verifies:** AC2
- **Precondition:** `_lastAttempt: { attemptId: 'attempt-original', status: 'in-flight', startedAt: Date.now() - 61000 }`
- **Action:** Call `handlePostTurnStreamHtml` with a different `attemptId: 'attempt-fresh'`
- **Expected result:** The mocked LLM executor IS called exactly once (the stale entry must not block forever — same safety-valve behaviour the existing AC4 in the srar-s1 file already proves for the same-attemptId case, now confirmed for the different-attemptId case too); `session._lastAttempt` is updated to `attemptId: 'attempt-fresh', status: 'complete'` after completion
- **Edge case:** No — this is the explicit non-regression guard for the staleness fallback

---

## Integration Tests

None — this is a pure handler-level fix with mocked LLM adapter, matching `check-srar-s1-idempotent-turn-reconnect.js`'s own existing test level exactly (no new route/credits/artefact-write integration surface is touched).

---

## NFR Tests

None — the story's own NFR section states Performance is a net positive (removes wasted work) and no other NFR category applies beyond what AC1-AC3's own tests already cover (no new input surface, no UI change).

---

## Out of Scope for This Test Plan

- Any test asserting the real Anthropic API cost or real credit-balance deduction end-to-end — those are covered at the unit level by confirming the LLM executor adapter call count (0 vs 1), which is the root cause of both the duplicate cost and duplicate credit deduction; a full integration test through `credits.js`/`$ai_generation` capture is unnecessary to prove this fix, since both of those only ever fire as a *consequence* of the LLM executor being called.
- A live re-verification against real production staging (e.g. deliberately reproducing the disconnect-and-retry sequence against `wuce-staging.fly.dev`) — not practical to force a real mid-stream client disconnect on demand; the unit-level reproduction of the exact session-state sequence observed in production logs is the correct-strength evidence here.

---

## Gap table

No gaps.

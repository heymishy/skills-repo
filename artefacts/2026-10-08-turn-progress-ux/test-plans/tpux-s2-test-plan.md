## Test Plan: Extend the quiet-retry budget to network-level turn failures, not just the in-flight guard

**Story reference:** artefacts/2026-10-08-turn-progress-ux/stories/tpux-s2-extend-quiet-retry-to-network-level-failures.md
**Epic reference:** None — short-track
**Test plan author:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

**Real architecture grounding (confirmed by direct code read, 2026-10-08):**
- `src/web-ui/routes/skills.js:4121-4138`: `sendTurn()`'s `.catch(function(err) {...})` handler — the block to change.
- `src/web-ui/routes/skills.js:2726`/`:5524`: unrelated save-path call sites (not touched by this story).
- This is client-script string-literal content (embedded in the rendered chat page, never executed in Node) — verification follows this repo's own established convention from `tpux-s1`/`sch-s1`/`srar-s1`: source-text structural assertions against the real rendered script (via `handleGetChatHtml`), not a new DOM/browser harness.

**E2E/browser-layout detection (Step 3a):** N/A — pure JS control-flow, no UI/layout.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | First retry still fires at 2000ms | 1 test | — | — | — | — | 🟢 |
| AC2 | Subsequent retries fire at 5000ms, below cap | 1 test | — | — | — | — | 🟢 |
| AC3 | At cap: no further retry, unchanged dead-end, no reload | 1 test | — | — | — | — | 🟢 |
| AC4 | session-expired: unchanged, no retry at all | 1 test | — | — | — | — | 🟢 (regression) |
| AC5 | Existing suites pass unmodified | — | — | — | — | — | 🟢 (regression) |

---

## Coverage gaps

None beyond the same structural-vs-runtime evidence class already accepted for `tpux-s1`/`sch-s1`/`srar-s1` (see those test plans' own Coverage gaps sections) — no new gap introduced by this story.

---

## Test Data Strategy

**Source:** Synthetic — the real rendered client script text via `handleGetChatHtml`, matching `tpux-s1`'s own test file's precondition/isolation pattern exactly.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Raw rendered script text, isolated to the `.catch()` block | Real rendered HTML | None | Assert the first-retry branch still schedules at 2000ms |
| AC2 | Same isolated block | Real rendered HTML | None | Assert a second branch schedules at 5000ms, gated by the same retry-count comparison `tpux-s1` introduced |
| AC3 | Same isolated block | Real rendered HTML | None | Assert the cap comparison's else branch reaches the unchanged dead-end code, and does NOT call `window.location.reload()` |
| AC4 | Same isolated block | Real rendered HTML | None | Assert the `expired` check still short-circuits before any retry logic, unchanged |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### First retry still fires at 2000ms

- **Verifies:** AC1
- **Action:** Render the chat page via `handleGetChatHtml`; isolate the `.catch(function(err)` block; regex-match the first retry's `setTimeout(..., 2000)` call
- **Expected result:** Present, reusing `_attId`, setting `_isRetry` true
- **Edge case:** No — regression guard for `srar-s1`'s original tuned value

### Subsequent retries fire at 5000ms under the cap

- **Verifies:** AC2
- **Action:** Same isolated block; regex-match a second retry branch gated on a retry-count comparison against `12`, scheduling `setTimeout(..., 5000)`
- **Expected result:** Present and distinct from the first-retry branch
- **Edge case:** No

### At the cap: no further retry, no reload, unchanged dead-end

- **Verifies:** AC3
- **Action:** Same isolated block; confirm the branch reached once the retry-count comparison fails leads to the existing `appendBubble`/`"Error — please try again."`/`submitBtn.disabled = false` code, and that `window.location.reload()` does NOT appear anywhere in this `.catch()` block
- **Expected result:** Dead-end message code present and reachable; no reload call in this block
- **Edge case:** Yes — the exhaustion boundary, and the explicit "no reload here" design decision

### session-expired is unchanged

- **Verifies:** AC4
- **Action:** Same isolated block; confirm the `expired` check precedes any retry-scheduling code, unchanged from today
- **Expected result:** `var expired = err && err.message === "session-expired";` still appears before the retry logic, and the `expired` branch still goes straight to the sign-in message
- **Edge case:** No — regression guard

### Existing suite regression

- **Verifies:** AC5
- **Action:** Run `node tests/check-srar-s1-idempotent-turn-reconnect.js`, `node tests/check-tpux-s1-turn-progress-ux.js`, then `npm test`
- **Expected result:** All pre-existing tests pass unmodified; no new failures
- **Edge case:** No

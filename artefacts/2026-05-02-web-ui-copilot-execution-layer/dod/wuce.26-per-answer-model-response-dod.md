# Definition of Done — wuce.26: Per-answer model response in skill HTML flow

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.26-per-answer-model-response.md
**Test plan:** artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.26-per-answer-model-response-test-plan.md
**DoR artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.26-per-answer-model-response-dor.md
**PR:** https://github.com/heymishy/skills-repo/pull/302
**Merged:** 2026-05-04
**Outcome:** COMPLETE

---

## AC Coverage

| AC | Description | Tests | Result |
|----|-------------|-------|--------|
| AC1 | `_skillTurnExecutor` called on answer submit; response appended to `modelResponses` at correct index | T1, T2 | ✅ SATISFIED |
| AC2 | Adapter throw → answer still recorded, `modelResponses[i]` = null, redirect proceeds without throw | T3, T4 | ✅ SATISFIED |
| AC3 | Question N>1: model response from previous turn rendered in a distinct block above prior Q&A | T5, T6 | ✅ SATISFIED |
| AC4 | Question 1: no model-response block rendered (no empty placeholder) | T7 | ✅ SATISFIED |
| AC5 | Default stub throws `Error('Adapter not wired: skillTurnExecutor...')` before wiring | T8 | ✅ SATISFIED |
| AC6 | Production `skill-turn-executor.js` POSTs to `api.githubcopilot.com/chat/completions` with correct headers, message array, and `max_tokens` | T9, T10 | ✅ SATISFIED |
| AC7 | `htmlGetPreview` includes model responses after each corresponding answer; null responses omitted | T11, T12 | ✅ SATISFIED |

All 7 Acceptance Criteria satisfied.

---

## Test Execution Summary

| Category | Total | Passing | Failing |
|----------|-------|---------|---------|
| Unit (T1–T7, T11–T12) | 10 | 10 | 0 |
| Integration (T9–T10) | 2 | 2 | 0 |
| NFR (T-NFR1–T-NFR2) | 2 | 2 | 0 |
| **Total** | **14** | **14** | **0** |

Test file: `tests/check-wuce26-per-answer-model-response.js`
Run command: `node tests/check-wuce26-per-answer-model-response.js` (chained in `npm test`)
CI result: All 14 PASS on PR #302 merge commit.

---

## NFR Verification

| NFR | Evidence | Result |
|-----|----------|--------|
| Security — token never appears in logs or error messages | T-NFR1: token `'secret-token-abc'` confirmed absent from all captured log output when executor throws. Error messages use generic text only. | ✅ MET |
| Security — model response HTML-escaped before rendering | Code review: `escHtml()` applied to `lastModelResponse` in `handleGetQuestionHtml` before injecting into HTML response body. | ✅ MET |
| Performance — 30-second timeout enforced on Copilot API call | T-NFR2: executor rejects within 200ms when `WUCE_TURN_TIMEOUT_MS=100` mock fires `req.destroy(new Error('...timed out...'))`. AC2 null-path handles the timeout rejection. | ✅ MET |
| Resilience — no unhandled rejections or 500 errors on executor failure | T3, T4: catch block sets `modelResponses[i] = null` and returns `nextUrl` — no throw propagated to route handler, no unhandled rejection. | ✅ MET |

---

## Scope Deviation Report

**Deviations:** None.

Items explicitly out of scope (confirmed not implemented):
- Streaming model response — not implemented
- Loading spinner / client-side polling — not implemented
- Persistent storage of model responses across server restarts — not implemented
- CLI path (`htmlRecordAnswer` via CLI executor) — not implemented
- Token cost tracking or `max_tokens` per-skill override — not implemented
- Response caching — not implemented

---

## Test Plan Gap Assessment

Two gaps were accepted in the test plan before coding began. Both remain as pre-accepted gaps; no new gaps were introduced.

| Gap | Handling |
|-----|---------|
| Real Copilot API call latency and response parsing | Mocked in T9/T10 with a stub `https` module. Manual smoke test required against a real token before production deployment. |
| `max_tokens` cap enforcement (API actually honours the field) | No automated assertion possible without real API. Manual smoke verification only. |

---

## Metric Signal

**Story metric linkage:** P3 — Skill session completion rate (from story artefact).

**Signal:** `not-yet-measured`

No real user sessions have run post-merge. The feature has not been deployed to a production environment. The measurement clock starts at first production deployment. Contribution of wuce.26: enables per-answer Copilot model context within skill sessions, which is expected to improve session completion by surfacing relevant model guidance at each question turn.

---

## Files Changed (PR #302)

| File | Change type |
|------|-------------|
| `src/modules/skill-turn-executor.js` | Created — real Copilot API HTTP executor |
| `src/web-ui/adapters/skills.js` | Modified — added `_skillTurnExecutor` injectable adapter with throwing default stub |
| `src/web-ui/routes/skills.js` | Modified — async `htmlRecordAnswer`, `modelResponses[]` per session, model response in question HTML and preview |
| `src/web-ui/server.js` | Modified — production wiring of real `skillTurnExecutor` in `NODE_ENV !== 'test'` guard |
| `tests/check-wuce26-per-answer-model-response.js` | Created — 14-test TDD suite |
| `package.json` | Modified — test chain extended with `check-wuce26-per-answer-model-response.js` |

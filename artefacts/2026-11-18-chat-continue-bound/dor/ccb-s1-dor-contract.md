# Contract Proposal - The chat page stops sending hidden "continue" turns after a few, and shows the operator what it has

**What will be built:**
- `src/web-ui/routes/skills.js`, the embedded chat-page script only: a page-level counter of consecutive hidden continues and the previous turn's text, checked where the script now schedules `sendTurn("continue", true)`. At the cap (2, or 5 when `evt.truncated`) or on an identical reply it does not schedule the continue, re-enables the send button and appends one notice bubble. The counter resets whenever the operator sends a turn (`answer` is not `"continue"`).
- `tests/check-ccb-s1-continue-bound.js` (T1a to T5c), a `decisions.md` entry and a Definition of Done.

**What will NOT be built:**
- No change to the server-side turn handlers, SSE framing, truncation detection, the mock gateway, the icv-s1 ideate exemption, or the new-turn rate limiting; no new npm dependency; no new control.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1a, T1b | jsdom with the real page script |
| AC2 | T2a, T2b | jsdom |
| AC3 | T3 | jsdom |
| AC4 | T4 | jsdom |
| AC5 | T5a to T5c plus the existing suites and the four lpw-s5 specs | jsdom + regression + E2E |

**Assumptions:** the jsdom harness in `tests/check-icv-s1-ideate-canvas-turn2-render-fix.js` can be reused with a fetch stub that serves scripted replies (read and confirmed: it already stubs `win.fetch` with a `getReader` body); the `answer` passed to `sendTurn` is `"continue"` for hidden continues and the operator's text otherwise; `evt.truncated` is on the final event.

`schemaDepends: []`. **Estimated touch points:** Files: about 4 (skills.js, one test, artefacts). Services: none.

**Exclusion list check (B1/D1):** the excluded areas (turn handlers, SSE framing, gateway, ideate exemption) have no test assertion against them other than the unchanged regression suites.

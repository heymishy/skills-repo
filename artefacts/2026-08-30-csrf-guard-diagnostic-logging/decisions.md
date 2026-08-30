## Decisions — csdl-s1: temporary CSRF guard diagnostic logging

### GAP — H-GOV, short-track has no discovery artefact (2026-08-30)

Same recurring short-track gap as `pcr-s1` / `p35tf-s1` / `cptr-s1` / `jgcc-s1`. No discovery artefact exists — short-track skips `/discovery` by design. Satisfied via the operator's direct in-session instruction to proceed with diagnostic logging as the chosen investigation path (2026-08-30, in response to an `AskUserQuestion` offering: authenticate flyctl / add diagnostic logging / operator checks logs directly / pause). This is now the 5th occurrence of this exact gap — the standing revisit trigger noted in `jgcc-s1`'s own DoR (4th occurrence) is reaffirmed here rather than raised again as a 6th ad-hoc note; a `/definition-of-ready` SKILL.md revision adding an explicit short-track branch to H-GOV is overdue.

### ARCH — Diagnostic-only change, no fix attempted (2026-08-30)

**Context:** `jgcc-s1` (merged, deployed as commit `b4da1eb`) fixed a confirmed-real defect — the in-chat gate-confirm form was missing its `_csrf` field entirely. Live re-validation on `wuce-staging` after that deploy showed the field is now present and the token value is stable/idempotent across repeated fresh page loads (verified via two consecutive same-origin `fetch()` calls returning an identical token). Despite this, a genuine, single, fresh-page real UI click on "Continue to benefit-metric →" still produced `403 Forbidden`.

**Decision:** Do not attempt a second fix based on the untested "multi-machine stale in-memory session cache" hypothesis. Add temporary, non-secret-leaking diagnostic logging to `src/web-ui/middleware/csrf.js` instead, deploy it, reproduce the failure once more, and read the actual server logs before designing any fix.

**Rationale:** This session has already twice had to walk back a fix that was designed before real evidence was gathered (`cptr-s1`'s original SIGTERM-handler design, invalidated by Fly's actual `'suspend'` semantics before any code was written). The same discipline applies here: the stale-session-cache theory is plausible but unconfirmed — `flyctl` is not authenticated in this environment, so real machine IDs/logs were not directly inspectable, and directly forging a replay POST via injected browser JavaScript using the extracted token was correctly blocked by the browser automation tool's own safety guardrail. Diagnostic logging is the lowest-risk way to get real evidence without either granting broader tool access or attempting an unverified fix.

**Required follow-up (tracked, not deferred silently):** Once the log evidence is read and the actual mismatch mechanism is confirmed, (1) implement the real fix as its own short-track story, and (2) remove or reduce this diagnostic logging in the same or an immediately following story — it is explicitly temporary and must not become permanent production log noise.

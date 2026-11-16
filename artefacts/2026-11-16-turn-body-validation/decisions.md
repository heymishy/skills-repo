# Decisions: turn body validation

**2026-11-16 | FINDING | The turn endpoints accept anything and run a model turn**
**Evidence:** on staging (mock model) every one of malformed JSON, an empty answer, `{}`, a number, `null`, a text/plain body, a 2 MB answer, and a wrong skill name in the URL returned 200 with the same canned reply and a `usage` field; `_readBody` turns any parse failure into `null` and the handlers substitute an empty answer. On production each would be a real model call and a credit deduction (credits are deducted after success in the handler).

**2026-11-16 | ARCH | One shared validation step in the two handlers, after the session lookup and before the lock**
**Context:** `handlePostTurnHtml` takes the journey `turnInProgress` lock before reading the body, so an early return after the lock would leave the journey stuck.
**Decision:** read the body with a limited reader and validate after the unknown-session check and before the lock; return fixed JSON error codes (400 INVALID_BODY, 400 INVALID_ANSWER, 413 ANSWER_TOO_LARGE, 404 for a skill mismatch).
**Rationale:** nothing is spent or locked for a rejected request; `_readBody` and every other route are untouched; the unknown-session 404 stays first so existing behaviour is preserved.
**Accepted cost:** the 100000-character cap is the agent's choice (about 25000 tokens); the operator may raise it. An empty answer is now rejected, `__init__` is the only start signal the page sends.

**2026-11-16 | OBSERVATION | Production confirmation of the error chain, from a different bug**
A single POST to `/api/skills/discovery/sessions/<zero-uuid>/answer` on production returned 500 "Adapter not wired: submitAnswer" and produced a resolved PostHog exception (issue id, no processing errors) and GitHub issue #1121 titled `http_5xx: Error at /api/:p/:p/:p/:p/:p` within 13 seconds. That bug is `sub-s1`, separate from this story.

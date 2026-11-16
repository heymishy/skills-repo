# Decisions: production-wiring smoke test (pws-s1)

**2026-11-17 | DECISION | Operator: an unwired adapter fails the check; it does not warn**
**Context:** the agent recommended fail-with-allow-list over warn; the operator agreed ("Ok").
**Decision:** any throwing stub whose setter is not called at boot, and not on the allow-list in `tests/check-pws-s1-production-wiring-smoke.js`, fails CI. A stale allow-list entry fails too.
**Rationale:** warnings in CI go unread, and that is how `submitAnswer` (#1121), `getCommitResult` (scr-s1) and `getCommitPreview` (cpv-s1) reached production.
**Accepted cost:** a new deliberately-unwired adapter needs one reasoned allow-list line.

**2026-11-17 | DECISION | Detect "unwired" from the stub's own message and a call recorder, with no production edit**
**Context:** the stubs live in two modules, and a production-side `isWired()` helper would have meant editing both.
**Decision:** the stub message names its setter (`Call setX()`), the probe wraps every exported `set*` before `server.js` loads and records calls, and the two lists are compared. No production module changes.
**Rationale:** smallest change, nothing in production code to drift out of step. **Known limit:** a setter called inside its own module at load (not by `server.js`) looks unwired, so `setParsePhaseModel` and `setApplyCanvasEdits` are allow-listed with that reason.

**2026-11-17 | DECISION | The allow-list starts with 7 reasoned entries, not empty**
**Context:** the story expected an empty list once sub-s1, cpv-s1 and scr-s1 were fixed. The first real boot found 7 more stubs that `server.js` never calls.
**Entries:** `setSubmitAnswer` (retired by sub-s1), `setSkillTurnExecutor` (superseded: routes/skills.js replaces its copy through `setSkillTurnExecutorAdapter`), `setNextQuestionExecutorAdapter` and `setSectionDraftExecutorAdapter` (no-ops in the model-first flow, mfc.1), `setDbPool` (Postgres only), `setParsePhaseModel` and `setApplyCanvasEdits` (wired inside their own module). Each is verified against the code, not assumed.

**2026-11-17 | FINDING | The first hostile-input sweep: 99 route patterns, 1,188 requests, 21 answers of 5xx, all explained, none a new production defect**
**Evidence:** `POST /api/skills/{id}/execute` starts the Copilot CLI as a subprocess for any name the validator accepts (500 when the CLI is missing, and once a dropped connection): skipped from the sweep, with the reason, so a sweep never starts real processes. `POST /products/{id}/repo/create` answers 502 "Adapter not wired" and `GET`/`POST /agency/clients/{id}/invite` answer 503: both are adapters wired only outside `NODE_ENV=test` (real Postgres or GitHub), recorded on the sweep allow-list with the reason. Every other route answered below 500 for all six hostile values.
**Accepted cost:** those three routes are not covered for hostile input by this check; their own story tests cover them.

**2026-11-17 | FINDING | Observations for follow-up stories (not done here)**
1. `adapters/skills.js` `defaultListSkills` returns `[]` instead of throwing, against the D37 rule that stub defaults must throw. It is wired in production, so it is harmless today, but a missing wiring would show an empty list, not an error.
2. The stub message for `_nextQuestionExecutor` names `setNextQuestionExecutorAdapter()` (the routes/skills.js setter) but the adapter's own exported setter is `setNextQuestionExecutor`; the message points at the wrong function.
3. `POST /api/skills/{unknown name}/execute` answers 500 rather than 404 for an unknown skill name.

**2026-11-17 | CONSTRAINT | What this check does not cover (stated, not claimed)**
Wiring that exists only under a real production environment (Postgres, GitHub, PostHog), adapter modules other than `adapters/skills.js` and `routes/skills.js`, and the three routes above. A later story can widen the scan; that is a cost-benefit call for the operator.

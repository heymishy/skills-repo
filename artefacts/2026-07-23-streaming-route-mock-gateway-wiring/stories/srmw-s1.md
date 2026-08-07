# Story: Wire {stage, scenarioName} into handlePostTurnStreamHtml so MOCK_LLM_GATEWAY actually activates for the real chat UI's streaming turn endpoint

**Epic reference:** None — short-track (bounded wiring bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the live-verified defect documented as a new FINDING in `artefacts/2026-07-23-e2e-core-journey-coverage/decisions.md` (a4's own dispatch, 2026-07-23) and in PR https://github.com/heymishy/skills-repo/pull/559's description.
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below, tied honestly to the parent feature's own benefit metric (m1) rather than fabricating a new metric artefact.

## User Story

As **any staging E2E story (or future non-CI use) that relies on `MOCK_LLM_GATEWAY=true` actually taking effect through the real chat UI's streaming turn endpoint** (already confirmed blocking a4's own re-verification of a3/a4's currently-skipped ACs, and every other model-turn-driven story that drives a turn through the real browser chat UI rather than the unused non-streaming `htmlSubmitTurn` path),
I want **a real streaming turn request, sent the same way the actual browser chat UI sends it, to route through the mock gateway and receive deterministic fixture content when `MOCK_LLM_GATEWAY=true`**,
So that **AC3-class acceptance criteria (asserting canvas/session content produced by a mocked model turn, driven through the real chat UI) can actually pass on real staging, instead of every real browser-driven turn silently calling the real Anthropic API regardless of the flag**.

## Benefit Linkage

**Metric moved:** `2026-07-23-e2e-core-journey-coverage`'s own benefit metric (m1 — real, staging-verified E2E coverage of the core product journey, replacing untested/unverified confidence with live-verified confidence). Not a new metric artefact (short-track) — this fix closes the last remaining gap in this session's mock-gateway-on-staging chain (fixture files shipped in the Docker image, `mgfd-s1`/PR #558; adapter wired unconditionally in `server.js`, also `mgfd-s1`) and directly unblocks m1 for a4's re-verification of its currently-skipped ACs and every other real-chat-UI-driven story.

**How:** `artefacts/2026-07-23-e2e-core-journey-coverage/decisions.md`'s a4 FINDING entry (referenced from PR #559's description) documents that after `mgfd-s1` made `MOCK_LLM_GATEWAY=true` genuinely active on `wuce-staging` (env var set, adapter wired, fixture files shipped), a4's own dispatch found the flag STILL has zero effect on the real chat UI. Root cause, confirmed by direct code inspection (`src/web-ui/routes/skills.js`): `handlePostTurnStreamHtml` (the SSE streaming turn route — the ONLY endpoint the actual browser chat UI calls) built its `_turnOptions` object with `noThinking`, `maxTokens`, `model`, `tenantId`, and `sessionId` — but never `stage` or `scenarioName`. `skillTurnExecutorStream()` (`src/modules/skill-turn-executor.js`) only routes to the mock gateway when `options.stage` is truthy AND `mockLlmGateway.isMockGatewayEnabled()` is true; without `stage`, every real streaming turn fell through to the real Anthropic/Copilot provider regardless of the flag. The non-streaming, UI-unused `htmlSubmitTurn` already builds this exact `{stage, scenarioName}` pair correctly (`_turnMeta`, bri-s3.2) — this story brings the streaming path to parity with it.

## Architecture Constraints

- **This is additive options-wiring only — confirmed a simple oversight, not a structural gap.** `skillTurnExecutorStream()`'s mock-gateway routing check (`if (options && options.stage && mockLlmGateway.isMockGatewayEnabled())`) already exists, is already exercised correctly by `htmlSubmitTurn`'s non-streaming `_turnMeta`, and already has a directly analogous precedent in the SAME function this story touches: `_turnOptions.tenantId`/`_turnOptions.sessionId` (s6.1) are threaded through in exactly the same "one comment block, two assignment lines, right before the executor call" shape this story adds for `stage`/`scenarioName`. No new adapter, no new activation logic, no change to the mock gateway itself, no change to SSE framing/streaming behaviour.
- **Do not change streaming behaviour, SSE event framing, or any other aspect of `handlePostTurnStreamHtml`** beyond adding the two `_turnOptions` assignments. The existing display-buffer/marker-scanning/artefact-accumulation logic in the `onChunk` callback is untouched — it already correctly handles a single large `onChunk` call (which is what the mock gateway's `_streamMockGatewayResponse` produces: one call with the full fixture text) because non-mocked real-model streaming already occasionally delivers large chunks, and the existing marker-scanning code is chunk-size-agnostic by design.
- **`session.mockScenarioName` (bri-s3.2) is the existing, already-correct mechanism for a per-session scenario override** (e.g. deliberately incomplete `/definition-of-ready` runs) — this story reads it exactly as `htmlSubmitTurn` already does (`session.mockScenarioName || 'success'`), it does not introduce a new field or a new override mechanism.
- **No change to `mock-llm-gateway.js`, `skill-turn-executor.js`, `server.js`, `fly.staging.toml`, or any Fly secret** — the defect is entirely in what one route handler passes to an already-correct, already-tested executor function.

## Dependencies

- **Upstream:** `mgfd-s1` (PR #558, merged) — fixed the Docker fixture-shipping gap and the `server.js` unconditional-wiring gap. Both are prerequisites for this fix to have any observable effect on real staging (without them, the mock gateway would still throw "Adapter not wired" or "No fixture found" even with `stage`/`scenarioName` correctly wired here).
- **Downstream:** `2026-07-23-e2e-core-journey-coverage`'s a3 and a4 stories (both already merged, PRs #557/#559) have AC3-class assertions that depend on a real turn through the real chat UI returning mock fixture content; this fix is required before those ACs can be genuinely re-verified against real staging rather than skip-with-reason.

## Acceptance Criteria

**AC1:** Given `handlePostTurnStreamHtml`'s `_turnOptions` object at the point it is passed into `skillTurnExecutorStream()`, When two different sessions with different `skillName` values (e.g. `discovery` and `review`) each submit a streaming turn, Then the resulting `options.stage` value passed to the executor equals each session's own `skillName` — and the two calls' `stage` values differ from each other, proving the value is threaded through per-session rather than hardcoded.

**AC2:** Given a session with no `mockScenarioName` override, When a streaming turn is submitted, Then `options.scenarioName` passed to the executor is `'success'` (the same default `htmlSubmitTurn` already uses); Given a session with `mockScenarioName: 'failure'` set, When a streaming turn is submitted, Then `options.scenarioName` passed to the executor is `'failure'` — the two outcomes must differ, proving the override is genuinely read, not a hardcoded constant that happens to match one case.

**AC3:** Given `MOCK_LLM_GATEWAY=true` is active and the real mock-LLM-gateway adapter is wired (the actual production wiring path established by `mgfd-s1`), When a real streaming turn request is submitted through `handlePostTurnStreamHtml` exactly as the real browser chat UI would send it, Then the SSE stream's content contains the configured fixture file's deterministic text (not an empty response and not a real model's text), and the real network boundary (`https.request`, used by both the Anthropic and Copilot providers) is never invoked for that turn.

**AC4:** Given the full existing test suite (`npm test`), When run after this fix, Then no previously-passing test starts failing, and the count/set of pre-existing baseline failures matches `tests/known-baseline-failures.json` (no new regressions introduced).

**AC5:** Given this fix is deployed to real `wuce-staging` (subject to no concurrent deploy in progress from another agent), When a real turn is driven through the actual streaming endpoint (the same way a real browser would, or via the existing a3/a4 E2E specs), Then the response now genuinely uses the mock gateway (fixture content, not an empty or real-model response) — reported honestly as observed, including if deploy could not be completed this session.

## Out of Scope

- Any change to `mock-llm-gateway.js`'s fixture-lookup logic, `FIXTURE_DIR` path construction, or activation rules (`isMockGatewayEnabled()`).
- Any change to `skill-turn-executor.js`'s mock-gateway routing condition or `_streamMockGatewayResponse`/`_resolveMockGatewayResponse` implementations.
- Any change to `server.js`'s adapter-wiring block (already fixed by `mgfd-s1`).
- Any change to SSE framing, streaming behaviour, chunk-buffering/marker-scanning logic, or any other part of `handlePostTurnStreamHtml` beyond the two `_turnOptions` assignments.
- Re-verifying a3's/a4's already-passing ACs unaffected by this fix, or a4's separately-documented NFR-Security fix.
- The separately-documented, already out-of-scope credits-upsert admin-UI path gap.

## NFRs

- **Performance:** None — two additional object-property assignments per turn; no measurable cost.
- **Security:** No new attack surface — `session.skillName` and `session.mockScenarioName` are both already-existing, already-trusted session-internal fields (not derived from unvalidated request input), and the mock gateway itself remains hard-blocked in `NODE_ENV=production` regardless of this change (`isMockGatewayEnabled()` is untouched).
- **Accessibility:** Not applicable — no UI change.
- **Audit:** Not applicable — no change to any audited code path.

## Complexity Rating

**Rating:** 1 — well understood; root cause independently confirmed by direct code inspection (simple oversight, not a structural gap — see Architecture Constraints), fix shape is a two-line addition mirroring an existing precedent (`tenantId`/`sessionId`, s6.1) in the exact same function, and verification approach (unit wiring test + real end-to-end mock-gateway test + real staging redeploy) is already identified.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic

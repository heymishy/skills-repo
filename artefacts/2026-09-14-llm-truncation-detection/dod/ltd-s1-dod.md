# Definition of Done: Detect max_tokens truncation explicitly and raise the output ceiling

**PR:** https://github.com/heymishy/skills-repo/pull/886 | **Merged:** 2026-09-14T17:38:27Z
**Merge commit:** ef6c1fec6e10dea7e46181353ca981edd4ce731a
**Story:** artefacts/2026-09-14-llm-truncation-detection/stories/ltd-s1-detect-and-surface-truncation.md
**Test plan:** artefacts/2026-09-14-llm-truncation-detection/test-plans/ltd-s1-test-plan.md
**DoR:** artefacts/2026-09-14-llm-truncation-detection/dor/ltd-s1-dor.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-15

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | T1/T2 — `_callAnthropic`'s resolved `usage.stop_reason` reflects the raw response's top-level `stop_reason` in both the `max_tokens` and `end_turn` cases | Automated behavioural test (mocked `https.request`) | None |
| AC2 | ✅ | T3/T4 — `_callAnthropicStream`'s resolved `usage.stop_reason` reflects the `message_delta` event's `delta.stop_reason` in both cases | Automated behavioural test (mocked `https.request`) | None |
| AC3 | ✅ | T5 — captured real `pino` log output for a truncated turn includes `"stop_reason":"max_tokens"` in the `llm_complete` line | Automated behavioural test (real logger, captured stream) | None |
| AC4 | ✅ | T6/T7/T8 — streaming and non-streaming `$ai_generation` captures include `stop_reason`; `$ai_is_error`/`$ai_error` present only when truncated, absent otherwise | Automated behavioural test (mocked PostHog capture) | None |
| AC5 | ✅ | T9/T10 — final SSE `done` event carries `truncated: true`/`false` matching the turn's real `stop_reason` | Automated behavioural test (captured SSE writes) | None |
| AC6 | ✅ | T11 — client-side auto-continue condition confirmed to OR in `evt.truncated` alongside the existing "no `?`" heuristic | Source assertion against the generated client-page JS (lasr-s1 precedent) | None |
| AC7 | ✅ | T12/T13 — `DEFAULT_MAX_TOKENS` is `32768` with no env override; `WUCE_TURN_MODEL_MAX_TOKENS` env override still takes precedence when set | Automated behavioural test (captured outgoing request body) | None |

**All 7 ACs satisfied.** 13/13 tests passing, re-run fresh 2026-09-15 against merged master (commit `ef6c1fec`).

---

## Scope Deviations

None. The merged diff (`src/modules/skill-turn-executor.js`, `src/web-ui/routes/skills.js`, `tests/check-ltd-s1-truncation-detection.js`, 3 new artefacts, `.github/pipeline-state.json`) maps directly to the story. `copilot` provider path and the non-streaming path's client heuristic were left untouched exactly as scoped.

---

## Test Plan Coverage

**Tests passing:** 13/13, re-run fresh 2026-09-15 against merged master (commit `ef6c1fec`) — `tests/check-ltd-s1-truncation-detection.js`.

**Regression coverage:** `check-s6.1-cache-scope-session-threading` (4/4), `check-pla-s2-posthog-wiring` (24/24), `check-ssdo-s1-sse-client-disconnect-logging` (3/3), `check-lasr-s1-llm-agent-keepalive` (6/6), `check-wuce26-per-answer-model-response` (14/14), `check-srmw-s1-streaming-mock-gateway-wiring` — all re-run clean before and after merge.

**Full regression suite (post-merge, fresh on master, both `pao-s1` and `ltd-s1` merged):** 660 files run, 1 failure — `tests/check-p3.5-validate-trace.js`, the pre-existing documented resource-contention flake. No new regressions.

**Gaps:** None against the story's own ACs.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | `stop_reason` capture adds no network calls (already-present API fields); raising the cap has no cost/latency effect on turns that don't need it |
| Cost | ✅ | Bounded — only previously-truncated turns (which already cost an extra silent continue-turn round trip) benefit; no other turn is affected |
| Observability | ✅ | Primary purpose of the story — directly verified by AC3/AC4 |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track feature. Directly closes the observability/correctness gap the same-session PostHog review surfaced, following on from `pao-s1`.

---

## Outcome

**COMPLETE**

No deviations, no test gaps, no NFR gaps. All 7 ACs fully automated-test-covered — no manual/post-deploy verification required for this story (distinct from `pao-s1`, which has two ACs pending production promotion).

---

## DoD Observations

1. This closes the loop on the 2026-09-14 PostHog AI-observability review's findings: the token-max-length gap (this story) and the production always-on gap (`pao-s1`) are both merged. The two remaining findings from that review — `review`'s story-at-a-time behaviour and its auto-fire-on-load symptom — were confirmed working-as-intended / already covered by `pao-s1`'s fix respectively, and recorded as explicit no-action decisions rather than code changes (see this feature's `decisions.md`).
2. Once `pao-s1` is promoted to production, worth a light manual smoke-check that a genuinely long test-plan turn no longer needs the max-tokens continuation path as often (harder to observe directly, but the `stop_reason`/PostHog additions from this story mean any future occurrence will now be visible without another archaeology exercise).

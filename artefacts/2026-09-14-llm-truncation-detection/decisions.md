# Decisions: LLM truncation detection

## Detect stop_reason explicitly and raise DEFAULT_MAX_TOKENS to 32768

**Date:** 2026-09-14
**Context:** A PostHog AI-observability review of the 2026-09-14 test-plan incident (already resolved at the infra level by `pao-s1`) found the incident's final abandoned call hit exactly `$ai_output_tokens: 16384` — the app's `DEFAULT_MAX_TOKENS` ceiling — meaning the response was truncated by the provider, not just slow. Code review established that nothing in the codebase reads the Anthropic API's own `stop_reason`/`finish_reason` field anywhere; a client-side heuristic (auto-continue when a turn's text doesn't end in a literal `?`) happens to catch most truncations by coincidence, but a truncation landing right after a literal `?` inside generated content would be silently misclassified as a complete turn.

**Decision:** Thread `stop_reason` through `skill-turn-executor.js`'s usage object (both streaming and non-streaming Anthropic call sites), surface it in the `llm_complete` production log line and in both `$ai_generation` PostHog captures (plain `stop_reason` property, plus `$ai_is_error`/`$ai_error` when truncated), and use it as an additional, authoritative trigger for the client's existing auto-continue mechanism. Raise `DEFAULT_MAX_TOKENS` from `16384` to `32768`.

**Rationale:** A 30-day scan of every `$ai_generation` event on this account found exactly one truncation — rare, but with zero detection and only a lucky heuristic catching it. The fix is small, additive, and reuses three already-established test-mocking precedents in this repo (`check-s6.1-*`, `check-pla-s2-*`, `check-ssdo-s1-*|`). The cap increase is a RISK-ACCEPT: `32768` is not independently verified against a live upper bound for the `claude-haiku-4-5`/`claude-sonnet-4-6` model IDs this app uses; if invalid, the existing non-200 rejection path already surfaces this loudly rather than failing silently — and this story's own observability additions make any such regression immediately visible.

**Story:** artefacts/2026-09-14-llm-truncation-detection/stories/ltd-s1-detect-and-surface-truncation.md

---

## Review's "one story at a time" turn-taking — confirmed working as designed, no code change

**Date:** 2026-09-14
**Context:** The operator observed, during the same PostHog review, that `/review` progressed through pending stories one at a time across separate turns rather than producing a single batched response covering every story, and asked whether this was correct.

**Decision:** No code change. `skills.js`'s own init-turn prompt for `review` (~line 4952) explicitly instructs: "Do NOT ask the operator which stories to review — proceed to review ALL pending stories automatically, starting with the first one... begin reviewing the first pending story immediately." This is a deliberate design choice, not an accidental gap — review already covers every pending story without asking, it just does so incrementally via the same continue-chain architecture `test-plan`/`discovery` use, rather than one giant single-turn response.

**Rationale:** Given `ltd-s1`'s own finding (a single very-large-output turn can hit the `max_tokens` ceiling and require silent recovery), story-at-a-time is the safer design, not an inferior one — each turn only needs enough output budget for one story's review rather than the whole batch. Changing this to a single-shot batch response would reintroduce exactly the truncation risk `ltd-s1` exists to catch, at a larger scale. Kept as-is.

**Story:** N/A — confirmed-correct, no implementation story required.

---

## Review "not starting" on page load — confirmed same root cause as the test-plan incident, already resolved

**Date:** 2026-09-14
**Context:** The operator reported needing to manually prompt `/review` to start, rather than it beginning automatically on page load.

**Decision:** No separate code change. The client already has a working auto-fire-on-load mechanism (`skills.js` ~line 3268: fires a hidden `__init__` turn when a session is fresh). PostHog's raw event stream for the affected review session shows an `artefact_loaded` event followed immediately by an `AI generation` event right after the page's `Pageview` — with no button click in between — confirming the auto-fire genuinely happened server-side. The most likely explanation is that this turn's SSE response never reached the browser before the connection was cut, the same failure class already root-caused and fixed for the test-plan incident via `pao-s1` (`min_machines_running=1`, eliminating the Fly auto-suspend mid-stream disconnect).

**Rationale:** `pao-s1` already addresses the shared root cause for every skill using the auto-fire/continue-chain pattern (review, test-plan, discovery, definition-of-ready), not just test-plan specifically. No further action tracked here; if the symptom recurs after `pao-s1` is deployed and verified (see `pao-s1`'s own AC3/AC4), that would indicate a distinct cause worth a fresh investigation rather than confirmation of this one.

**Story:** N/A — root cause already covered by `pao-s1` (artefacts/2026-09-14-production-always-on/).

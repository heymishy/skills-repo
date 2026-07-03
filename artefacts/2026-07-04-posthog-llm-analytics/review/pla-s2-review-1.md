# Review Report: pla-s2 — Emit $ai_generation events after Anthropic calls and wire identity and group analytics — Run 1

**Story reference:** artefacts/2026-07-04-posthog-llm-analytics/stories/pla-s2.md
**Date:** 2026-07-04
**Categories run:** A — Traceability, B — Scope, C — AC quality, D — Completeness, E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **1-M1** Category C — AC quality — AC1, AC3, AC4, AC5 lack an explicit "When" clause: they use "Given X completes, then Y" structure. The "When" (the trigger action) is embedded in the Given. For AC1, the correct three-part form is: "Given the Anthropic JSON response body contains a `usage` field, **When** `_callAnthropic` returns successfully, Then the returned object includes `usage.input_tokens`, `usage.output_tokens`, `usage.cache_read_tokens`, `usage.cache_creation_tokens`."
  Risk if proceeding: Test writers may not distinguish setup conditions from trigger actions, leading to tests that don't correctly isolate the causal relationship.
  To acknowledge: run /decisions, category RISK-ACCEPT, or fix before /test-plan.

- **1-M2** Category C — AC quality — AC3 and AC4 are compound assertions listing 12+ individual properties in a single AC ("with all of the following properties: …"). A failure in a test runner will report "AC3 failed" with no indication of which of the 12 properties was missing or incorrect.
  Risk if proceeding: Test writers must either write one assertion per property (12 separate assertions per path) or accept reduced diagnostic signal when a property is missing. The test-plan skill should decompose AC3 and AC4 into grouped sub-assertions.
  To acknowledge: run /decisions, category RISK-ACCEPT, or flag for /test-plan to address via explicit sub-assertion groupings.

- **1-M3** Category C — AC quality — AC8 uses "Given any of the following events is captured — `journey_created`, `stage_started`, `stage_completed`, `journey_completed`…" — the "any of" construct means a test that only checks `journey_created` would satisfy AC8 while leaving the other three events untested.
  Risk if proceeding: Test coverage for `$groups` wiring on `stage_started`, `stage_completed`, and `journey_completed` may be incomplete if AC8 is read as satisfied by a single event check.
  To acknowledge: run /decisions, category RISK-ACCEPT, or restructure AC8 into four separate ACs (one per event type) at /test-plan time.

---

## LOW findings — note for retrospective

- **1-L1** Category C — `$ai_stop_reason` is called out in out-of-scope as "requires parsing `message_delta.stop_reason` from the Anthropic stream; deferred (noted in the instrumentation plan)." This is correctly deferred and well-documented. Worth noting for follow-on: the Anthropic `message_delta` event already carries `stop_reason` in the SSE stream — when deferred work is picked up, no new network call is needed, just an additional field read from the existing stream parsing in `_callAnthropicStream`.

---

## Score Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| A — Traceability | 5 | PASS |
| B — Scope integrity | 5 | PASS |
| C — AC quality | 3 | PASS |
| D — Completeness | 5 | PASS |
| E — Architecture compliance | 5 | PASS |

**Verdict:** PASS — 0 HIGH, 3 MEDIUM, 1 LOW. MEDIUM findings 1-M1, 1-M2, 1-M3 all affect Category C AC quality and should be addressed at /test-plan time: the test-plan skill should write sub-assertions that cover each property in AC3/AC4 individually, test all four event types for AC8, and use explicit When-trigger structure in test case names.

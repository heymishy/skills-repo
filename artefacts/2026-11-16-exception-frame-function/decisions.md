# Decisions: every stack frame carries a function name

**2026-11-16 | FINDING | The most important sweep-2 bug reached PostHog but never became an issue**
**Evidence:** 7 production events for `/skills/:p/:p/:p/:p` stayed `stacktrace.type` `raw` with no issue id. PostHog wrote the reason on each event (`$cymbal_errors`): `serde error: missing field 'function'`. The first frame of each is an anonymous arrow function (`server.js` line 3775) with no `function` key. Older events failed the same way for `filename` (fixed by sff-s1). An earlier hypothesis that the cause was a race between simultaneous events was disproved by a single later request failing identically; a first reading that "unnamed frames" were the whole cause was also incomplete, since any name that is not identifier-shaped is dropped by the scrubber too.

**2026-11-16 | ARCH | Always send a `function`, with a fixed placeholder when there is no safe name**
**Context:** PostHog requires `function` on every frame; the scrubber omits it when the name is not identifier-shaped (privacy rule) or absent.
**Decision:** `scrubFrame` keeps an identifier-shaped name and otherwise sends the fixed string `<anonymous>`, the same pattern as the `[redacted]` filename placeholder.
**Rationale:** the privacy rule is unchanged (nothing new from the input reaches PostHog); the failure was a missing key, not a wrong value; one change covers every anonymous callback and every unusual name.
**Accepted cost:** if PostHog reports another required field, a further story is needed; the `$cymbal_errors` text names it, and the live check proves the end state. Lesson for learnings: after changing what the scrubber sends, check `$cymbal_errors` on the resulting events, not only that events arrive (extends D62).

**2026-11-16 | DECISION | Live check for this story uses a natural 5xx, not a deliberate one**
**Context:** the planned trigger, `/skills/discovery/sessions/<zero-uuid>/result`, always returned 500 until scr-s1 (PR #1119, merged) wired the commit result adapter, so that request no longer produces an error.
**Decision (operator agreed, recommended by the agent):** do not add a route that fails on purpose. The live observation of the fix (a PostHog `$exception` with `stacktrace.type` `resolved`, an issue id, a GitHub issue titled `<code>: <Type> at <route>`) is taken from the next real 5xx the error chain reports. The fix itself is already covered by tests against a real PostHog frame sample.
**Rationale:** shipping a crash route for a test costs more risk than the confirmation is worth.

## Story: Keep a placeholder filename on every scrubbed stack frame so PostHog accepts the error events

**Epic reference:** None - short-track (bounded fix for a defect found by live validation of coha-s5, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery; scope stated directly below. Parent: `artefacts/2026-11-08-cicd-observability-hardening-automation/` (story coha-s5, whose DoD is COMPLETE WITH DEVIATIONS; finding logged in that feature's `decisions.md` on 2026-11-15, entry "coha-s5 scrubber output is rejected by PostHog's issue processor").
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui, observability, privacy]

## User Story

As **the operator relying on production error monitoring**,
I want **every stack frame the coha-s5 scrubber sends to PostHog to carry a `filename`, with a fixed placeholder when the real path must not be sent**,
So that **PostHog's issue processor accepts the events, creates Error Tracking issues, and the alert to GitHub issue to incident record chain (coha-s6, coha-s7) can actually run for a real production error**.

## Benefit Linkage

**Metric moved:** Metric 4 (Production-defect detection latency) of `artefacts/2026-11-08-cicd-observability-hardening-automation/benefit-metric.md`. It cannot start moving while PostHog rejects every event; this story removes that blocker. Also closes the unmet part of coha-s5's own acceptance evidence (an event appearing in Error Tracking).
**How:** On 2026-11-15, PostHog project 10908 held 207 `$exception` events from staging in 3 days, all carrying `$cymbal_errors` = "Invalid properties on event ..., serde error: missing field `filename`", none with an issue id, and the Error Tracking issues list for the last 14 days was empty. Cause: `scrubFrame` in `src/web-ui/modules/error-capture.js` (lines 55 to 57) copies `filename` only when the path starts with `src/` or `node_modules/`, so frames such as the Node internal `process.processTicksAndRejections` (no filename, `in_app: false`) lose the key, and PostHog requires it on every frame.

## Architecture Constraints

- **Fail-closed privacy is not weakened.** The placeholder is one fixed constant (the value `[redacted]`, the same word PostHog's own GitHub template uses). No part of the original path, module name or any other frame text is copied when the path is not repository-relative. All existing canary tests of coha-s5 must still pass unchanged.
- **Keep the key, not the value.** Only the presence of `filename` changes. `abs_path` is not added (not evidenced as required). `function`, `lineno`, `colno`, `in_app` and `platform` keep their current rules.
- **Frames that are not objects** (already scrubbed to an empty object today) must also come out schema-valid (a placeholder `filename` and nothing else), because a bare `{}` frame would be rejected the same way.
- **Do not guess the consumer's whole schema.** The rejection message names one missing field, and that parser reports the first problem it meets. Assert only what is evidenced (`filename` is a string on every frame) and treat any other message PostHog returns after this fix as new information, recorded and handled in a follow-up (see AC6).
- **Mock-shape verification (CLAUDE.md rule):** the test fixture frames must be copied from the real shapes captured from PostHog on 2026-11-15, not invented to suit the fix.
- **Architecture guardrails (.github/architecture-guardrails.md):** ADR-025 (multi-tenancy at the application layer) is why the scrubber must never let tenant text leave the app, so the fail-closed rule above is binding; ADR-011 (artefact-first) is satisfied by this story's own chain; no other Active ADR is engaged (no route, adapter, schema or workflow changes).
- **Zero new npm dependencies.**

## Dependencies

- **Upstream:** coha-s5's merged scrubber (PR 1087). Nothing else.
- **Downstream:** coha-s6 AC9 (the first real production error opens exactly one issue) and the whole chain wait on this story.
- **Operator involvement:** deploy to staging (CI does this on merge) and, after staging proves it, deploy production the way the operator normally does. This story does not deploy production.

## Acceptance Criteria

**AC1:** Given a raw exception whose frames include repository files, Node internal frames with no filename, frames with a `node:` or absolute outside-the-repo path, and an entry that is not an object, When the event is scrubbed, Then every frame in the output has a string `filename`: the repository-relative path when it starts with `src/` or `node_modules/`, otherwise exactly `[redacted]`.

**AC2:** Given the same raw exception seeded with canary text in every filename, module and path field, When it is scrubbed, Then no canary text appears anywhere in the output (every existing coha-s5 canary test passes unchanged; the single existing assertion that a non-repository filename comes out `undefined`, in `scrubEvent_filename_keptOnlyWhenRepoRelative`, is deliberately changed to expect `[redacted]`, and one new case covers a frame with no filename at all).

**AC3:** Given the three real `$exception_list` shapes captured from PostHog on 2026-11-15 (committed as a fixture in `tests/fixtures/`), When their raw equivalents are scrubbed, Then a check function asserting "every frame is an object with a string `filename`" returns true for the new output and false for the old output (a test that fails against the unfixed scrubber).

**AC4:** Given the scrubber is wired the way the real startup wires it, When a request that throws is captured through the real `createApp()` in a child process with a local sink, Then the sink's event has a string `filename` on every frame (the end-to-end version of AC1).

**AC5:** Given the fix is merged and deployed to staging, When the staging E2E run (or a deliberate staging error) produces new `$exception` events, Then within 30 minutes a PostHog query shows those events with no `$cymbal_errors` value, with a `$exception_issue_id`, and the Error Tracking issues list shows at least one issue. Evidence class `live-verified`. This is checked by the operator or by the agent with the PostHog read tools, and recorded in the DoD with the query used.

**AC6:** Given AC5 shows a different `$cymbal_errors` message instead of an empty value, When the DoD is written, Then the story is recorded INCOMPLETE with the exact new message, and a follow-up short-track story is created for it; it is not marked complete on the strength of the `filename` fix alone.

## Out of Scope

- Proving the alert to bridge hop for a real error. The PostHog destination is filtered to `environment = production`, so staging errors can never trigger it; that hop is proven only by the first real production error (coha-s6 AC9) or by a deliberate, separately approved change of the filter. Not done here.
- Deploying production (operator, after AC5).
- The per-minute rate limit on captured events, and the RISK-ACCEPT for identifier-shaped function names (coha-s5 follow-ups, separate decisions).
- Reducing the staging event volume (207 events in 3 days from repeated test traffic) or deleting the 207 existing rejected events.
- Changing coha-s6 or coha-s7 code, or the PostHog destination configuration.
- Any change to what is scrubbed other than the frame `filename` key.

## NFRs

- **Security and privacy:** the privacy guarantee of coha-s5 is unchanged: output is built only from allow-listed fields and fixed constants; a new test proves no input text reaches the placeholder.
- **Performance:** none beyond one extra string assignment per frame; the 200 ms capture bound of coha-s5 is unaffected.
- **Correctness:** the new schema check must fail against the unfixed code (AC3), so it cannot pass vacuously.

## Complexity Rating

**Rating:** 2 - the change is a few lines, but the consumer may reject the events for further reasons that are only visible after a live run (AC5, AC6).
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity (AC5 is a live query with a stated window)
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic

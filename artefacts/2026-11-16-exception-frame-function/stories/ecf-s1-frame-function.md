## Story: Send a function name on every stack frame so PostHog groups the error into an issue

**Epic reference:** None - short-track (bounded defect found by a production sweep, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: `artefacts/2026-11-15-production-error-sweep/reference/error-sweep-2-findings.md`, finding 5, plus the PostHog diagnosis below.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui]

## User Story

As **the operator who relies on the error chain to open a GitHub issue for every server error**,
I want **errors thrown from anonymous callbacks, and frames with unusual function names, to be grouped into a PostHog issue like any other**,
So that **no server error is reported to PostHog and then silently never becomes an issue**.

## Benefit Linkage

**Metric moved:** None formal - short-track convention. Closes the last gap in "every server error becomes an issue" (ecg-s1's purpose): today an error whose first stack frame has no usable function name is stored by PostHog but never grouped, so no alert fires and no GitHub issue opens.
**How:** the error scrubber (`scrubFrame` in `src/web-ui/modules/error-capture.js`) keeps a frame's `function` only when it is identifier-shaped, and otherwise leaves the key out. PostHog's exception processing requires the key: it rejects the event with `serde error: missing field 'function'`, leaves the stack trace unprocessed (`stacktrace.type` stays `raw`), and never assigns an issue id. Always send a `function`: the kept name, or a fixed placeholder (`<anonymous>`) when there is none or it cannot be proven free of tenant text.

## Diagnosis (done before writing this story, from PostHog event data)

- Events with an issue have `stacktrace.type` `resolved`; events without one have `raw` and a `$cymbal_errors` property with PostHog's own reason.
- The 7 production events for `/skills/:name/sessions/:id/result` (the commit result page, always failing) carry `serde error: missing field 'function'`; their first frame is an anonymous arrow function at `server.js` line 3775 with no `function` key. The earlier failures (older events) carried `serde error: missing field 'filename'`, which sff-s1 fixed in the same way for `filename`.
- Names the scrubber drops today: anything that is not identifier-shaped (`RE_IDENT`), for example names containing a space or `@`.

## Architecture Constraints

- **Privacy rule unchanged.** A function name is sent only if it matches the identifier pattern already in use (code-defined, cannot carry tenant text, per the accepted risk recorded in coha-s5 review round 3). The placeholder is a fixed value, never derived from the input.
- **Same pattern as sff-s1** (`filename` placeholder `[redacted]`): the key is always present, the value is the kept one or a fixed one.
- **Change is confined to `scrubFrame`.** Fingerprint, route label, code allow-list, message scrubbing and everything else in `scrubEvent` are unchanged.
- **Real shapes, not invented ones (learning D62).** The test uses the real frame shapes captured from production (an anonymous first frame; a `process.processTicksAndRejections` frame), saved as a fixture beside the sff-s1 fixture.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; no other Active ADR engaged.
- **Zero new npm dependencies.**

## Dependencies

- **Upstream:** coha-s5 and sff-s1 (the scrubber and the filename fix), ecg-s1 (reports every 5xx). All merged.
- **Related:** `scr-s1` (wires the commit result page). Order matters for the live check: this story's live check uses the still-broken `/skills/.../result` route, so run it before `scr-s1` merges.

## Acceptance Criteria

**AC1:** Given a frame with no `function` (an anonymous callback), When the event is scrubbed, Then the output frame has `function` equal to `<anonymous>` and every other kept field (`filename`, `lineno`, `colno`, `in_app`, `platform`) is as before.

**AC2:** Given a frame whose `function` is identifier-shaped (for example `handleGetResultHtml`, `Object.handle`, `process.processTicksAndRejections`), When scrubbed, Then the name is kept unchanged.

**AC3:** Given a frame whose `function` is not identifier-shaped (contains a space, `@`, a path, a newline or tenant-looking text), When scrubbed, Then the output `function` is `<anonymous>` and none of the original text appears anywhere in the output.

**AC4:** Given frames of any shape (missing, null, a string, a number, an array, an object without fields), When an event is scrubbed, Then every output frame is an object with a string `filename` and a string `function`.

**AC5:** Given the real frame shapes captured from production (fixture), When scrubbed, Then every frame has a string `filename` and a string `function`; and the same check run against the previous logic fails (negative control, as sff-s1 did for `filename`).

**AC6:** Given the existing error-capture tests, When the full suite runs, Then they pass, except `scrubEvent_function_identifierShapedOnly`, whose old expectation (`undefined` for a non-identifier name) is replaced by `<anonymous>`; no other test changes.

**AC7 (live, after deploy):** Given a signed-in production session, When `/skills/discovery/sessions/00000000-0000-0000-0000-000000000000/result` is requested once (it fails today with the unwired commit-result adapter), Then the PostHog event has `stacktrace.type` `resolved`, no `$cymbal_errors`, an issue id, and within a few minutes one GitHub issue and one incident-record draft PR appear for `/skills/:p/:p/:p/:p`. Evidence class `production-observed`. This opens a real issue and PR; the operator has approved live checks of this kind for this work.

## Out of Scope

- Making the issue title and body show the route and error type (`eit-s1`).
- Wiring the commit result page (`scr-s1`).
- Reprocessing the 7 events already stored (they stay unprocessed; the live check creates a new one).
- Any other PostHog processing requirement not yet seen (none known; if PostHog reports another missing field it becomes a new story).

## NFRs

- **Security/privacy:** no new text from an error ever reaches PostHog; the only new value is the fixed placeholder.
- **Reliability:** scrubbing never throws (a frame of any type is accepted); a scrub error still drops the event (fail closed, as today).
- **Performance:** none.

## Complexity Rating

**Rating:** 1 - one function, one placeholder, well-understood behaviour.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic

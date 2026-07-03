## Story: Extend posthog-server.js with identify, groupIdentify, captureException, and $groups support

**Epic reference:** artefacts/2026-07-04-posthog-llm-analytics/epics/pla-e1.md
**Discovery reference:** artefacts/2026-07-04-posthog-llm-analytics/discovery.md
**Benefit-metric reference:** artefacts/2026-07-04-posthog-llm-analytics/benefit-metric.md

## User Story

As a **platform operator**,
I want the PostHog server module to support identify, group identify, exception capture, and group attribution on events,
So that **pla-s2 can wire tenant and role context into all LLM analytics events without reimplementing HTTP calls** (M1: per-tenant cost attribution, M4: per-role segmentation).

## Benefit Linkage

**Metric moved:** M1 (per-tenant LLM cost attribution rate) and M4 (per-role LLM cost segmentation) — infrastructure layer.
**How:** This story delivers the PostHog module methods that pla-s2 calls to associate every LLM event with a tenant (`company` group) and a user role. Without these methods, pla-s2 cannot emit group-attributed or role-tagged events. No tenant or role cost data appears in PostHog until these methods exist and are called.

## Architecture Constraints

- **ADR-011 (artefact-first):** This story artefact and DoR must exist before any implementation code is written or merged to master.
- **Zero new npm dependencies:** All HTTP calls in `posthog-server.js` must use Node.js `https` built-in only. The `posthog-node` SDK must not be added. This is a hard product constraint (product/tech-stack.md §Runtime constraints).
- **Node.js CommonJS only:** `require()` syntax throughout. No `import`, no `async/await` on the module export boundary (internal `async` functions are acceptable). No TypeScript.
- **Hand-rolled HTTP pattern:** New methods (`identify`, `groupIdentify`, `captureException`) must follow the identical HTTP request structure used by the existing `capture()` function in `posthog-server.js` — same host, same path, same API key injection, same fire-and-forget error handling.
- **`POSTHOG_PRIVACY_MODE` env var:** Add a module-level constant `const PRIVACY_MODE = process.env.POSTHOG_PRIVACY_MODE === 'true'` that is exported (or readable via a getter) so pla-s2 can gate `$ai_input`/`$ai_output_choices` inclusion without importing `process.env` directly in the route handler.

## Dependencies

- **Upstream:** None — this is the first story in the epic.
- **Downstream:** pla-s2 depends on this story being DoD-complete before implementation begins.

## Acceptance Criteria

**AC1:** Given `posthog.identify(login, { $set: { login, tenantId, role } })` is called with a string `login` and a properties object, then an HTTP POST is made to the PostHog `/capture/` endpoint with `event: "$identify"`, `distinct_id: login`, and `properties: { "$set": { login, tenantId, role } }` in the request body.

**AC2:** Given `posthog.groupIdentify('company', tenantId, { name: tenantId })` is called, then an HTTP POST is made to `/capture/` with `event: "$groupidentify"`, `properties.$group_type: "company"`, `properties.$group_key: tenantId`, and `properties.$group_set: { name: tenantId }` in the request body.

**AC3:** Given `posthog.captureException(new Error('test error'), login, { skillName: 'discovery' })` is called, then an HTTP POST is made to `/capture/` with `event: "$exception"`, `properties.$exception_type: "Error"`, `properties.$exception_message: "test error"`, `properties.$exception_stack_trace_raw` set to the error's stack string, and the additional properties object merged in.

**AC4:** Given `posthog.capture(login, 'stage_completed', { costUsd: 0.05 }, { company: tenantId })` is called with a fourth `groups` parameter, then the event body includes `"$groups": { "company": tenantId }` in the properties.

**AC5:** Given `posthog.capture(login, 'stage_completed', { costUsd: 0.05 })` is called without a `groups` parameter (existing call-site pattern), then the event body does NOT include `"$groups"` (backward-compatible — existing callers are unaffected).

**AC6:** Given `POSTHOG_PRIVACY_MODE` is `"true"` in the environment, then the module exports a truthy `PRIVACY_MODE` constant (or equivalent readable boolean) that callers can read to decide whether to omit LLM content properties.

**AC7:** Given `POSTHOG_KEY` is absent from the environment, then all four methods (`identify`, `groupIdentify`, `captureException`, and the updated `capture`) silently no-op without throwing — matching the existing `capture()` behaviour when the key is absent.

## Out of Scope

- Calling `identify` or `groupIdentify` from any route handler — that is pla-s2.
- Adding `$groups` to any existing `capture()` call site — that is pla-s2.
- `captureException` call sites in error handlers — that is pla-s2 (and Group E, deferred).
- `$ai_generation` event emission — that is pla-s2.
- Any frontend PostHog changes — separate story.

## NFRs

- **Performance:** All four new methods are fire-and-forget (same pattern as existing `capture()`). No method blocks the request/response cycle. HTTP errors are swallowed with a pino `warn` log, not re-thrown.
- **Security:** No PostHog API key or user credential appears in any log output. The POSTHOG_KEY env var is accessed via `process.env` only — not logged.
- **Reliability:** If `POSTHOG_KEY` is absent, methods no-op silently. No method throws in production under any input.
- **Backward compatibility:** The updated `capture()` signature (fourth `groups` parameter) must not break any existing call site that passes only 3 arguments.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

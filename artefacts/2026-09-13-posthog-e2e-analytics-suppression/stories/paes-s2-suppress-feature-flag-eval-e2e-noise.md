## Story: Suppress PostHog feature-flag-evaluation analytics noise for E2E/synthetic test traffic

**Epic reference:** None — short-track, second story in the existing `2026-09-13-posthog-e2e-analytics-suppression` feature
**Discovery reference:** None — short-track skips discovery; scope stated directly below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **the operator of this project's real PostHog analytics**,
I want **feature-flag evaluations for E2E/synthetic test traffic to stop generating `Feature flag called` events**,
So that **PostHog's event stream stays clean of test noise from this second, separate PostHog pathway, closing the gap `paes-s1` deliberately left out of scope**.

## Benefit Linkage

**Metric moved:** None formal — operational hygiene fix, per this story's own short-track Benefit Linkage convention.
**How:** Directly closes a Follow-up Action recorded in `paes-s1`'s DoD (2026-09-13): `paes-s1` suppressed E2E-test analytics for `posthog-server.js`'s hand-rolled capture client, but confirmed via a live PostHog check that a *second*, separate pathway — `posthog-config.js`'s posthog-node-SDK-backed feature-flag evaluation — still auto-emits a `Feature flag called` event on every `isFeatureEnabled()` call, including for `e2e-test-`-prefixed sessions. Dozens of these events were observed for `e2e-test-` persons in a 24-hour window during this session's own live-verification work.

## Architecture Constraints

- **Single point of control**: `src/web-ui/modules/posthog-config.js`'s `evaluateFlag` and `groupIdentify` adapter functions (wired into `posthog-flags.js`'s shared `isEnabled()` via `initPostHogFlagsClient`) are the only place this pathway's PostHog calls originate — no other call site constructs or uses this posthog-node client.
- **Reuse the existing `e2e-test-` identity convention** — the same one `paes-s1` used (`E2E_TEST_EMAIL_PREFIX` pattern from `auth-email.js`, case-insensitive prefix match). Export `isE2ETestIdentity` from `posthog-server.js` (where `paes-s1` already defined it) rather than duplicating the same prefix-check logic a third time in this codebase.
- **`evaluateFlag` must still evaluate the flag correctly for E2E traffic** — do NOT skip or stub the flag evaluation itself. E2E tests rely on real flag evaluation to test feature-flagged behaviour. The fix uses posthog-node's own `isFeatureEnabled(key, distinctId, { sendFeatureFlagEvents: false })` option (confirmed present in `node_modules/posthog-node/dist/client.d.ts`) to suppress only the automatic analytics side-effect, not the evaluation result.
- **`groupIdentify` has no equivalent suppression option** on `groupIdentifyImmediate()` — for an `e2e-test-`-prefixed `groupKey`, skip the real network call entirely (matching `posthog-server.js`'s own no-op behaviour for suppressed calls) rather than attempting a partial suppression.
- **No change to `posthog-flags.js`** — the `isEnabled()`/`_sanitizeContext()`/`_withTenantGroup()` logic is unaffected; this story only touches how `posthog-config.js`'s adapter implementation talks to the real PostHog client.

## Dependencies

- **Upstream:** `paes-s1` (merged, PR #874) — this story reuses its `isE2ETestIdentity` helper, exported for the first time here.
- **Downstream:** None known. `evaluateFlag`'s return value (the flag boolean) is unchanged for all callers; `groupIdentify`'s no-op-for-e2e-test behaviour is invisible to callers (it already returns a Promise either way).

## Acceptance Criteria

**AC1:** Given `evaluateFlag(flagKey, context)` is called with a `context.tenantId` that starts with `e2e-test-` (case-insensitive), When the underlying `client.isFeatureEnabled()` call is made, Then it is called with `sendFeatureFlagEvents: false` in its options.

**AC2:** Given `evaluateFlag(flagKey, context)` is called with a non-`e2e-test-` `context.tenantId` (or no `tenantId` at all, falling back to `'anonymous'`), When the underlying `client.isFeatureEnabled()` call is made, Then `sendFeatureFlagEvents` is NOT set to `false` — behaviour is byte-identical to before this story (existing tests continue to pass unmodified).

**AC3:** Given `groupIdentify(groupType, groupKey)` is called with a `groupKey` that starts with `e2e-test-` (case-insensitive), When invoked, Then `client.groupIdentifyImmediate()` is never called, and the function still returns without throwing.

**AC4:** Given `groupIdentify(groupType, groupKey)` is called with a non-`e2e-test-` `groupKey`, When invoked, Then `client.groupIdentifyImmediate()` is called exactly as before this story (existing tests continue to pass unmodified).

**AC5:** Given `isE2ETestIdentity` is exported from `posthog-server.js`, When `posthog-config.js` imports and uses it, Then no prefix-matching logic is duplicated between the two files.

## Out of Scope

- `posthog-flags.js`'s `isEnabled()`/`_sanitizeContext()`/`_withTenantGroup()` — unchanged.
- Any change to `posthog-server.js`'s own already-shipped `paes-s1` guard, beyond exporting the existing `isE2ETestIdentity` function.
- Retroactively purging already-captured `Feature flag called` events for `e2e-test-` persons.

## NFRs

- **Performance:** N/A — a single cheap string-prefix check per flag evaluation/group-identify call, no new I/O.
- **Security:** N/A — no new external input surface; the check only inspects values already passed to these functions today.
- **Audit:** N/A — no new logging introduced.

## Complexity Rating

**Rating:** 1 — a small, well-scoped guard added to one already-small module, reusing an existing helper and a documented posthog-node SDK option.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic

## Story: Suppress PostHog analytics capture for E2E/synthetic test traffic

**Epic reference:** None — short-track (bounded behavioural fix, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery; scope stated directly below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **the operator of this project's real PostHog analytics**,
I want **E2E and synthetic test traffic to never generate real PostHog events, person profiles, or group-identify calls**,
So that **the operator's real analytics data stays uncluttered by test noise, without adding a hard dependency on any individual call site remembering to skip PostHog when running under test**.

## Benefit Linkage

**Metric moved:** None formal — operational hygiene fix, per this story's own short-track Benefit Linkage convention.
**How:** Directly requested by the operator (2026-09-13) after this session's own live-verification work against `wuce-staging.fly.dev` and its E2E fixtures generated real PostHog events during testing (`tgid-s1`, `wusl-s2` live checks). E2E fixtures and CI-run E2E specs already use a well-established `e2e-test-`-prefixed identity convention (`E2E_TEST_EMAIL_PREFIX` in `src/web-ui/routes/auth-email.js`; synthetic GitHub logins prefixed `e2e-test-gh-` in `src/web-ui/routes/auth-stub.js`) that this fix reuses rather than inventing a new one.

## Architecture Constraints

- **Single point of control**: the fix lives in `src/web-ui/modules/posthog-server.js` — the shared, low-level module every `capture`/`identify`/`groupIdentify`/`captureException` call site in the codebase routes through (confirmed via a call-site survey across `journey.js`, `skills.js`, `settings.js`, `products.js`). Do not add per-call-site skip logic — that would require every current and future call site to remember to check, which is exactly the failure mode this fix avoids.
- **Reuse the existing `e2e-test-` identity convention**, do not invent a new marker, env var, or flag. An identity (person `distinctId`, or PostHog group key) is treated as synthetic test traffic when its value starts with `e2e-test-` (case-insensitive), matching `E2E_TEST_EMAIL_PREFIX`'s own existing comparison shape in `auth-email.js`.
- **`groupIdentify(groupType, groupKey)` checks `groupKey` directly** — it has no `distinctId` parameter. `capture(distinctId, event, properties, groups)` and `identify(distinctId, props)` and `captureException(err, distinctId, extraProps)` all check their own `distinctId` parameter. `capture`'s optional `groups` object may also carry a synthetic value (e.g. `{ company: tenantId }` where `tenantId` is `e2e-test-`-prefixed for a solo-tenant E2E user) — check `groups` values too, not just `distinctId`.
- **No-op behaviour, not an error**: a suppressed call must behave exactly like the existing `POSTHOG_KEY` unset no-op path — return immediately, make no network call, throw nothing. Do not log a warning on every suppressed call (would itself be noise); a single one-line debug-level log is acceptable if this repo's logging convention supports it, but is not required.
- **No change to `src/web-ui/modules/posthog-config.js`** (the separate posthog-node SDK-based feature-flags wiring) or `src/web-ui/modules/posthog-flags.js` — those are a distinct evaluation pathway from the hand-rolled HTTP capture client in `posthog-server.js`, and the operator's request is specifically about "analytics data" (events), not feature-flag evaluation. Out of scope, see below.

## Dependencies

- **Upstream:** None — `posthog-server.js` is a leaf module with no internal dependencies beyond Node's `https`.
- **Downstream:** None. Every existing call site keeps calling `capture`/`identify`/`groupIdentify`/`captureException` exactly as today; the new suppression is entirely internal to those four functions and invisible to callers on real (non-`e2e-test-`) traffic.

## Acceptance Criteria

**AC1:** Given `capture(distinctId, event, properties, groups)` is called with a `distinctId` that starts with `e2e-test-` (case-insensitive), When invoked, Then no HTTP request is made to PostHog and the function returns without throwing.

**AC2:** Given `capture(...)` is called with a `groups` object containing at least one value that starts with `e2e-test-` (case-insensitive), even when `distinctId` itself is not `e2e-test-`-prefixed, When invoked, Then no HTTP request is made to PostHog.

**AC3:** Given `identify(distinctId, props)` or `captureException(err, distinctId, extraProps)` is called with an `e2e-test-`-prefixed `distinctId`, When invoked, Then no HTTP request is made to PostHog.

**AC4:** Given `groupIdentify(groupType, groupKey)` is called with an `e2e-test-`-prefixed `groupKey`, When invoked, Then no HTTP request is made to PostHog.

**AC5:** Given any of the four functions is called with a non-`e2e-test-`-prefixed identity (real traffic), When invoked, Then behaviour is byte-identical to before this change — the existing test suite (`tests/check-pla-s1-posthog-module.js`) continues to pass unmodified.

**AC6:** Given `POSTHOG_KEY` is unset, When any of the four functions is called with an `e2e-test-`-prefixed identity, Then the function still no-ops via the existing unset-key path — the new check must not assume a key is present.

## Out of Scope

- `src/web-ui/modules/posthog-config.js` and `src/web-ui/modules/posthog-flags.js` (feature-flag evaluation via the posthog-node SDK) — a separate pathway, not "analytics data" per the operator's own framing.
- Retroactively purging already-captured E2E events from the real PostHog project (a data-cleanup action, not a code change; the operator already has `scripts/purge-e2e-tenants.js` available if wanted — not modified by this story).
- Any change to the `e2e-test-` naming convention itself, or to `auth-email.js`/`auth-stub.js`.

## NFRs

- **Performance:** the check must be a cheap string-prefix comparison, not a network or filesystem call — must not measurably slow any capture call on the hot path.
- **Security:** N/A — no new external input surface; the check only inspects values already passed to these functions today.
- **Audit:** the existing `N2` test (POSTHOG_KEY never logged) must remain green; this change must not introduce any new logging of identity values beyond what already exists.

## Complexity Rating

**Rating:** 1 — a single well-scoped guard added to one already-small, already-well-tested module, following an existing naming convention with no new infrastructure.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic

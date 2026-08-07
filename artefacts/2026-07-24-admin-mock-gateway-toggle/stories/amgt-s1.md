## Story: Let an admin toggle the mock LLM gateway on/off from an in-app admin page, without a redeploy

**Epic reference:** None — short-track (bounded feature, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the operator's direct observation (2026-07-24, captured in `workspace/capture-log.md`) that no admin UI exists to toggle `MOCK_LLM_GATEWAY` at runtime — it is env-var-only, requiring a redeploy to switch between mocked and real model calls.
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below.

## User Story

As **Hamish King (Founder/Operator, acting as the platform's sole admin)**,
I want **a toggle on an in-app admin page that switches the mock LLM gateway on or off for the current environment, taking effect immediately**,
So that **I can deliberately invoke real model calls for a real spot-check without editing `fly.staging.toml` and redeploying**.

## Benefit Linkage

**Metric moved:** None — pure operator-workflow fix, not tied to a Tier 1 product metric (no benefit-metric artefact exists for this short-track story, per CLAUDE.md's short-track convention). Benefit stated directly: closes a real, confirmed operational gap (redeploy required to flip mock/real model behaviour) at low cost.

## Architecture Constraints

- **`isMockGatewayEnabled()`'s existing production hard-override is non-negotiable and MUST NOT be touched.** Confirmed via direct code read (`src/web-ui/modules/mock-llm-gateway.js`): `if (process.env.NODE_ENV === 'production') return false;` unconditionally disables the mock gateway in production, regardless of any other flag — this is the documented safety guard against accidentally routing real production traffic through canned fixtures. This story's new toggle must be layered so that it can only ever affect the result when `NODE_ENV !== 'production'` — it must never be able to force the gateway on in production, and the story's own tests must include a case proving the toggle has zero effect when `NODE_ENV === 'production'`.
- **Runtime-toggleable, not env-var-only.** The whole point of this story is that the current mechanism (`MOCK_LLM_GATEWAY` env var, checked via `process.env` only) requires a redeploy to change. This story must add a genuinely runtime-settable value that `isMockGatewayEnabled()` also consults — e.g. an in-memory flag settable via a new admin POST endpoint. Given this app runs as a single Fly.io machine per environment (confirmed via this session's own repeated `flyctl` investigation), an in-memory flag is an acceptable MVP as long as its behaviour on restart is explicit and honest (see AC3) — do not silently claim persistence across restarts if the implementation is in-memory-only.
- **Reuse the existing admin page pattern** (`requireAdmin` middleware, `renderShell()` page shell) established by `admin-credits.js` and just extended by `acps-s1` (PR #574) — do not invent a new admin-auth mechanism. Either add this toggle to the existing `/admin/credits` page or a new `/admin/settings`-style page using the identical `requireAdmin` + `renderShell` + CSRF (`csrfField`/`csrfGuard`) pattern.
- **No change to `mock-llm-gateway.js`'s fixture-loading logic, `STAGES` list, or `wireDefaultMockGatewayClient()`** — this story only adds a second, runtime-settable input to `isMockGatewayEnabled()`'s existing boolean logic, alongside (not replacing) the existing env-var checks.

## Dependencies

- **Upstream:** None.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given an authenticated admin on a non-production environment (`NODE_ENV !== 'production'`), When they view the admin toggle page, Then it shows the mock gateway's current effective state (on/off) for this environment, sourced from a live call to (an extended) `isMockGatewayEnabled()`, not a stale cached value.

**AC2:** Given the admin flips the toggle from off to on (or on to off) and submits, When the next real skill turn is driven immediately afterward, Then `isMockGatewayEnabled()` reflects the new state with no redeploy and no server restart required.

**AC3:** Given the toggle's persistence is in-memory-only (per this story's MVP scope), When the server process restarts (a real redeploy, or a Fly.io machine restart), Then the toggle resets to the env-var-only default (`MOCK_LLM_GATEWAY` as currently configured) — and the admin page's own copy honestly states this behaviour (e.g. "resets to the configured default on restart"), not implying durable persistence it doesn't have.

**AC4:** Given `NODE_ENV === 'production'`, When an admin (hypothetically) flips the toggle on, Then `isMockGatewayEnabled()` still returns `false` — the production hard-override is provably unaffected by this story's new runtime toggle.

**AC5:** Given an unauthenticated request or a non-admin authenticated request to the toggle's GET or POST endpoint, When it is attempted, Then it is rejected by the existing `requireAdmin` middleware exactly as `/admin/credits` already is — no new, weaker auth path introduced.

## Out of Scope

- Any change to make the toggle durably persist across restarts (e.g. a database-backed setting) — the in-memory MVP is accepted per AC3's honest-messaging requirement; a follow-up story can add durable persistence if the in-memory behaviour proves insufficient in practice.
- Per-tenant or per-request mock/real toggling — this is a single, environment-wide switch, matching the existing env-var's own environment-wide scope.
- Any change to PostHog feature flags (`posthog-flags.js`) — this story does not attempt to unify with or replace that separate mechanism.

## NFRs

- **Performance:** Negligible — a single in-memory boolean check, same cost class as the existing env-var read.
- **Security:** `requireAdmin`-gated, matching the existing `/admin/credits` pattern exactly; the production hard-override (AC4) is the binding security constraint for this story.
- **Accessibility:** Standard form/toggle control, keyboard-operable, consistent with `renderShell`'s existing conventions.
- **Audit:** The toggle flip should be logged (e.g. via the same `console.info`/structured-log pattern already used elsewhere for admin actions like `adjustBalanceWithAudit`) so a real production-adjacent incident (mock gateway left on inadvertently) is traceable — not a full audit table, just a log line naming who flipped it and when.

## Complexity Rating

**Rating:** 2 — the core toggle is simple, but correctly layering it alongside the existing env-var checks without weakening the production hard-override (AC4) requires care, and the "honest about in-memory persistence" UX (AC3) is a real design decision, not just a mechanical change.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic — N/A (short-track, no epic); Medium oversight given this touches a security-relevant hard-override (AC4) and real-cost implications (accidentally leaving real model calls on)

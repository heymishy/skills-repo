## Story: Auth journey spec

**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-3-test-suite.md
**Discovery reference:** artefacts/2026-07-09-beta-readiness-infra/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-beta-readiness-infra/benefit-metric.md

## User Story

As a **first beta customer**,
I want GitHub OAuth login, session expiry/refresh, and the first-login/returning-user redirect logic to be protected by deterministic browser-driven coverage,
So that the exact class of bug fixed today (the GitHub OAuth first-login bug, commit `f845caf7`) is caught by CI before it ever reaches a real beta customer again.

## Benefit Linkage

**Metric moved:** Metric 4 — Risk-critical journeys have deterministic E2E coverage
**How:** Closes the last of the 5 required journeys — auth is the entry point to every other journey, and this session's own history (the first-login bug) is direct proof this path was previously untested at the E2E level.

## Architecture Constraints

- ADR-018: browser-driven Playwright spec, uses the existing `NODE_ENV=test`-gated auth-bypass fixture (`tests/e2e/fixtures/auth.js`) where a synthetic session is sufficient, and real OAuth flow simulation where the login path itself is what's under test.
- **Correction from original brief:** this repo does not use Better Auth — per **`landing-auth-billing/decisions.md`'s ARCH-002** entry (a feature-local decision, distinct from the global `ADR-002` in `.github/architecture-guardrails.md`, which governs an unrelated topic — gate evidence fields vs. stage-proxy; do not conflate the two), Better Auth was explicitly rejected in favour of Path C (roll-your-own OAuth via `fetch()`, staying CJS). There are no "Better Auth ESM/CJS edge cases" to test. This spec instead covers the actual auth stack: GitHub OAuth (`auth.js`), Google OAuth, email/password (`auth-email.js`), and session rotation (`middleware/session.js`).
- Session-security mandatory constraints (tracked in the `landing-auth-billing` feature's guardrails, assessed by `/review` 2026-07-01): `rotateSessionId` called after every provider login; `accessToken` never in HTML response or logs — this spec asserts both structurally, not just trusts them. (Note: distinct from the identically-numbered `MC-SEC-01`/`MC-SEC-02` in `.github/architecture-guardrails.md`'s global guardrails-registry, which govern the dashboard viz's `innerHTML` sanitisation and committed-file credential scanning — unrelated to session security. Do not conflate the two ID spaces.)

## Dependencies

- **Upstream:** S3.1 (mock LLM gateway) for the `@mocked` variant of any downstream page this journey lands on.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a first-time GitHub OAuth login, When the callback completes, Then the user is redirected to `/welcome` (plan selection) — the fixed behaviour from `f845caf7`, not the pre-fix bug where every login (first or repeat) went to `/welcome`.

**AC2:** Given a returning GitHub OAuth login (not first-time), When the callback completes, Then the user is redirected straight to `/dashboard`, not `/welcome` — this is the specific regression this spec exists to prevent from recurring.

**AC3:** Given a session expires (or is deliberately invalidated), When the user makes a subsequent request, Then they are redirected to re-authenticate rather than receiving a silent failure or an error page with no path forward.

**AC4:** Given a successful login of any provider (GitHub, Google, email/password), When the resulting session cookie and any HTML response are inspected, Then no `accessToken` value ever appears in the HTML body or is visible in captured logs.

**AC5:** Given this spec is tagged `@mocked`, When it runs on every PR, Then real GitHub/Google OAuth endpoints are not called — the OAuth provider exchange is stubbed (consistent with existing unit-test patterns in `check-wuce1-oauth-flow.js`), while the spec still drives a real browser through the redirect chain.

## Out of Scope

- Testing the GitHub org allowlist (`TENANT_ORG_ALLOWLIST`) tenancy path — not currently active in this deployment (confirmed unset in `.env` this session); out of scope until that path is live.
- Admin-role bypass behaviour (`ADMIN_GITHUB_LOGINS`, commit `f845caf7`) as its own dedicated assertion — covered incidentally by AC2 (returning-user path) but not the focus of a separate AC; the existing unit test (`check-arl-s4-admin-billing-bypass.js`) already covers this at the unit level.

## NFRs

- **Performance:** Contributes to the shared under-10-minute `@mocked` suite budget.
- **Security:** AC4 is a hard structural check — this spec exists partly to make token-leak-into-HTML/logs violations impossible to miss, not just theoretically prevented by code review.
- **Accessibility:** Not applicable beyond the app's existing bar.
- **Audit:** None beyond standard CI logging.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

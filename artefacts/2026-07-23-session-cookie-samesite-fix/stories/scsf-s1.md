# Story: Fix session cookie SameSite=Strict dropping the session on Stripe's post-checkout redirect

**Epic reference:** None — short-track (bounded bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the live, real-staging-verified defect documented in PR #552 (`a2-stripe-test-mode-plan-selection`) and `artefacts/2026-07-23-e2e-core-journey-coverage/decisions.md` under "FINDING — A2 SameSite=Strict session-cookie finding"
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below rather than fabricating a formal metric artefact

## User Story

As **any authenticated user completing checkout (or, on the evidence below, completing GitHub/Google OAuth sign-in)**,
I want **my session cookie to still be attached when the browser returns from a legitimate cross-site, top-level redirect (Stripe Checkout, an OAuth provider callback)**,
So that **I land on my authenticated dashboard instead of being silently signed out immediately after a successful action**.

## Benefit Linkage

**Metric moved:** Regression-prevention / production correctness for this repo's own quality gates — not a formal benefit-metric artefact (short-track, per CLAUDE.md guidance to state this explicitly rather than fabricate a metric reference).
**How:** PR #552's real, real-`wuce-staging` E2E run against a genuine Stripe test-mode checkout found AC2 failing: a paying customer is bounced from `/billing/success` to `/` (signed out) immediately after a successful payment, because the session cookie is never attached to the cross-site top-level GET Stripe uses to hand control back to the app. This is a user-facing authentication regression on the highest-value flow in the product (checkout). Fixing it removes a real, reproduced defect and unblocks PR #552's own AC2 (currently a documented, intentionally-left-failing test per that PR's DoR contract).

## Architecture Constraints

- `src/web-ui/middleware/session.js` sets the session cookie with `SameSite=Strict` (`SESSION_COOKIE_CONFIG.sameSite` and `_buildCookieHeader()`), governed by a repo-level comment citing ADR-009 ("Session tokens use HttpOnly Secure SameSite=Strict cookies").
- Browsers never attach a `SameSite=Strict` cookie to a cross-site-initiated top-level navigation — even a user-initiated one like a payment-provider redirect or an OAuth callback. `SameSite=Lax` is the narrower relaxation that still blocks the cookie on cross-site subrequests/iframes/AJAX/POST (the actual CSRF attack surface) while allowing it on cross-site top-level GET navigations (exactly what Stripe Checkout and GitHub/Google OAuth callbacks are).
- **This exact defect has already been found, fixed, and lost once before in this repo's own history.** Commit `d8010213` (2026-05-04, "fix(security): set session cookie SameSite=Strict (was incorrectly Lax)") set the policy to `Strict` with no rationale recorded in the commit message or in any `decisions.md`. A later commit `ab99f366` (2026-06-30, "fix(auth): SameSite=Lax so OAuth callback sends the session cookie") on a side branch (`feat/lab-s1.1-auth-spike` and siblings) fixed the identical bug for the GitHub OAuth callback — "SameSite=Strict caused the browser to drop the session_id cookie on the GitHub callback redirect (cross-site navigation). The server got a new session with no oauthState and returned 403." — but that branch's fix never landed on `master`; master's `session.js` history (`git log --follow`) skips straight from `d8010213` to the Postgres/Redis persistence work without ever picking up the Lax change. The bug was silently reintroduced for OAuth and has now resurfaced independently via Stripe.
- Corroborating evidence that `Lax` is already the proven-safe choice elsewhere in this exact codebase: `src/web-ui/server.js`'s test-mode session-seed endpoints (`/test/session`, `/test/canvas`) already issue `SameSite=Lax` cookies deliberately, with the inline comment "SameSite=Lax allows API calls." The production session cookie is the outlier, not the norm.
- The fix must preserve the actual CSRF-relevant property `Strict`/`Lax` both provide: the cookie must still never be attached to a cross-site subrequest, iframe load, or non-top-level/non-GET request (e.g. a forged cross-site `<form method="POST">` or `fetch()` from an attacker's page). Only top-level GET navigation attachment is being restored.
- Do not touch `_oauthAdapter.validateOAuthState`, Stripe webhook signature verification, or any other CSRF/CSRF-adjacent mechanism — this story is scoped to the cookie `SameSite` attribute only.

## Dependencies

- **Upstream:** None — this fix does not depend on PR #552 merging; it can land independently.
- **Downstream:** PR #552's own AC2 (`tests/e2e/a2-stripe-test-mode-plan-selection.spec.js`) is expected to start passing once this fix is deployed to `wuce-staging`. This story's PR references PR #552 but does not merge into it.

## Acceptance Criteria

**AC1:** Given the session middleware's cookie configuration (`SESSION_COOKIE_CONFIG` and `_buildCookieHeader()` in `src/web-ui/middleware/session.js`), When inspected, Then `sameSite` is `'lax'` (not `'strict'`, not `'none'`) — both the exported config object used by tests and the literal `Set-Cookie` header string agree.

**AC2:** Given a request shaped like a cross-site, top-level GET navigation carrying the session cookie (mimicking Stripe's hosted-Checkout redirect back to `/billing/success`, or an OAuth provider's callback redirect to `/auth/github/callback` / `/auth/google/callback`), When the request reaches `sessionMiddleware`, Then the existing session is recognised (`req.session` resolves to the pre-existing session data, not a newly-created empty session) — proving the cookie would actually be attached and read under this policy.

**AC3:** Given the same cookie policy, When a request is shaped like a cross-site, **non-top-level** request (an XHR/`fetch()` or a cross-site `<form method="POST">` submission — simulated at the unit-test level as "this is the category `SameSite=Lax` still excludes"), Then the test plan documents that this category remains blocked by `Lax` semantics (browser-enforced, not server-enforced) — this AC is a documentation/regression-intent check, not a server-side behavioural assertion, since `SameSite` enforcement happens in the browser, not in this Node server. No new server-side CSRF gap is introduced by this change.

**AC4:** Given the existing `NFR1` test in `tests/check-wuce1-oauth-flow.js` (currently asserting `SESSION_COOKIE_CONFIG.sameSite === 'strict'`), When this fix lands, Then that test is updated to assert `'lax'` with an inline comment explaining why (cross-referencing this story), rather than left failing or deleted silently.

**AC5:** Given the full existing test suite (`npm test`), When run after this fix, Then no previously-passing test starts failing, and the count of pre-existing baseline failures matches `tests/known-baseline-failures.json` (no new regressions introduced).

## Out of Scope

- Any change to Stripe webhook handling, checkout session creation, or plan-activation logic — this is a session-cookie-policy fix only, not a billing fix.
- Any change to `_oauthAdapter.validateOAuthState` or the OAuth CSRF-state mechanism itself — `SameSite=Lax` restores cookie delivery to the callback; the CSRF-state check remains exactly as-is and still runs.
- Re-auditing every other cookie or header in the app for a similar issue — this story fixes the one confirmed, real-staging-reproduced instance (the session cookie) plus its documented sibling risk (OAuth callbacks), not a general cookie-policy sweep.
- Actually merging or resolving PR #552 itself — that PR remains a separate, already-open artefact; this story's PR is independent and simply removes the blocker its AC2 documents.

## NFRs

- **Performance:** Not applicable — a single string/attribute change, no new computation.
- **Security:** Central to this story. `SameSite=Lax` must not weaken CSRF protection for cross-site subrequests/POSTs/AJAX/iframes — only cross-site top-level GET navigation attachment is being restored. See Architecture Constraints above for the full analysis and the "already proven safe elsewhere in this codebase" evidence (test-mode seed endpoints already use `Lax`).
- **Accessibility:** Not applicable — no UI change.
- **Audit:** Not applicable — no new logging; existing login/logout audit events are unaffected.

## Complexity Rating

**Rating:** 1 — well understood; the exact defect, its root cause, its prior (lost) fix, and the corroborating same-codebase precedent are all already identified. The remaining work is a narrow, mechanical change plus regression tests.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

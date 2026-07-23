# Decisions: Session Cookie SameSite Fix

## GAP — H-GOV: no discovery artefact (2026-07-23)

**Context:** This is a short-track bug fix (`/test-plan → /definition-of-ready → coding agent`), which by design skips `/discovery` and therefore has no discovery `## Approved By` field for the DoR's H-GOV hard block to check against.
**Decision:** Accepted, per this repo's established precedent for short-track fixes (`pcr-s1`, `stis-s1`, `jrf-s1`, others) — H-GOV is recorded as a transparent note rather than a blocking failure.
**Source:** DoR run, `scsf-s1`, 2026-07-23.

---

## DECISION — Session cookie SameSite policy: Strict to Lax (2026-07-23)

**Context:** PR #552's real-`wuce-staging` E2E run found that the session cookie's `SameSite=Strict` policy (`src/web-ui/middleware/session.js`) causes the browser to withhold the cookie on Stripe's hosted-Checkout cross-site top-level GET redirect back to the app, silently signing out a customer immediately after a successful payment.

**Decision:** Change `SameSite=Strict` to `SameSite=Lax` for the session cookie, both in `SESSION_COOKIE_CONFIG` and the literal `Set-Cookie` header built by `_buildCookieHeader()`.

**Rationale:**
1. `SameSite=Lax` still blocks the cookie on cross-site subrequests, AJAX/`fetch()`, iframe loads, and cross-site POST form submissions — the actual CSRF attack surface. It only additionally allows the cookie on cross-site **top-level GET navigations**, which is exactly the shape of both Stripe's Checkout redirect and this app's own GitHub/Google OAuth callback redirects (`src/web-ui/routes/auth.js`).
2. This is not a new or untested policy for this codebase: `src/web-ui/server.js`'s test-mode session-seed endpoints (`/test/session`, `/test/canvas`) already issue `SameSite=Lax` cookies today, with the inline rationale "SameSite=Lax allows API calls" — `Lax` is already a proven, working policy elsewhere in this exact application.
3. This exact defect (SameSite=Strict silently dropping the session cookie on a cross-site top-level OAuth-callback redirect) was already found and fixed once before, on a side branch: commit `ab99f366` ("fix(auth): SameSite=Lax so OAuth callback sends the session cookie", 2026-06-30, `feat/lab-s1.1-auth-spike` and sibling branches) — "SameSite=Strict caused the browser to drop the session_id cookie on the GitHub callback redirect (cross-site navigation). The server got a new session with no oauthState and returned 403." That fix never landed on `master`. Master's `session.js` history goes directly from commit `d8010213` ("fix(security): set session cookie SameSite=Strict (was incorrectly Lax)", 2026-05-04, no rationale recorded in the commit message or any decisions log) to later feature work, silently carrying the `Strict` regression forward. The bug then resurfaced independently via Stripe rather than OAuth, but it is the same root cause.
4. No CSRF-relevant capability is lost: the OAuth flow's actual CSRF defence is the `validateOAuthState` state-parameter check in `handleAuthCallback`/`handleAuthGoogleCallback`, which is completely independent of the cookie's `SameSite` attribute and is untouched by this change.

**Consequence:** Session cookie now survives Stripe's Checkout redirect and both OAuth providers' callback redirects. `tests/check-wuce1-oauth-flow.js`'s `NFR1` test is updated to assert `lax` instead of `strict`. Going forward, any future change to `SESSION_COOKIE_CONFIG.sameSite` should be logged in a `decisions.md` entry (per CLAUDE.md's mandatory rule for architectural/security decisions) — the absence of such a log entry for `d8010213` is exactly why this regression was reintroduced silently and went undetected for months.

**Source:** `scsf-s1` implementation, 2026-07-23; corroborating history: `git log --follow -- src/web-ui/middleware/session.js`, commits `d8010213`, `ab99f366`.

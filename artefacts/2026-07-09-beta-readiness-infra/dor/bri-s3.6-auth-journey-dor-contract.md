## Contract Proposal — Auth journey spec (bri-s3.6)

**What will be built:**
- A unit test asserting `rotateSessionId` is invoked exactly once per login, for every provider (GitHub, Google, email/password) — not just GitHub.
- Integration tests calling `auth.js`'s `handleAuthCallback` directly for first-time vs. returning GitHub logins (asserting the `f845caf7`-fixed `/welcome` vs. `/dashboard` redirect split), plus a structural scan of HTML response bodies and captured logs across all three providers confirming no literal `accessToken` value ever appears.
- A Playwright spec, `tests/e2e/bri-s3.6-auth-journey.spec.js`, tagged `@mocked`, covering AC1–AC5 through the browser: first-time GitHub login → `/welcome`, returning login → `/dashboard`, session-expiry → re-authenticate redirect, token-leak scan on rendered page content, and a call-count spy confirming zero real GitHub/Google OAuth endpoint calls.

**What will NOT be built:**
- The GitHub org allowlist (`TENANT_ORG_ALLOWLIST`) tenancy path — not currently active in this deployment; out of scope until live.
- Admin-role bypass behaviour (`ADMIN_GITHUB_LOGINS`, `f845caf7`) as its own dedicated assertion — already covered at the unit level by `check-arl-s4-admin-billing-bypass.js`; only incidentally exercised (not separately asserted) by this spec's AC2 returning-user path.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration: `handleAuthCallback` first-time login → 302 to `/welcome`; E2E: browser-driven confirmation | Integration + E2E |
| AC2 | Integration: `handleAuthCallback` returning login → 302 to `/dashboard`; E2E: browser-driven confirmation | Integration + E2E |
| AC3 | E2E: expired/invalidated session → redirected to re-authenticate, not a silent failure | E2E |
| AC4 | Unit: `rotateSessionId` called once per provider login; Integration: HTML/log scan for `accessToken` across 3 providers; E2E: rendered page-content scan | Unit + Integration + E2E |
| AC5 | Integration: OAuth provider exchange stubbed, zero real HTTP calls recorded; E2E: call-count spy confirms the same at the browser level | Integration + E2E |

**Assumptions:**
- This repo does not use Better Auth — per `landing-auth-billing/decisions.md`'s ARCH-002 entry, Path C (roll-your-own OAuth via `fetch()`, staying CJS) is the actual stack; this spec targets `auth.js` (GitHub OAuth), Google OAuth, `auth-email.js` (email/password), and `middleware/session.js` (session rotation) — not a Better Auth integration.
- The stubbed OAuth provider exchange pattern already established in `check-wuce1-oauth-flow.js` is reusable/extensible for this spec's `@mocked` variant — this story does not need to invent a new stubbing mechanism.
- `tests/e2e/fixtures/auth.js`'s existing `NODE_ENV=test`-gated bypass fixture is available and suitable where a synthetic session is sufficient (i.e. everywhere except the login path itself, which needs real redirect-chain simulation).

**Estimated touch points:**
Files: `tests/e2e/bri-s3.6-auth-journey.spec.js` (new), `auth.js`, `auth-email.js`, `middleware/session.js` (read-only test consumption, no behavioural change expected), `oauth-adapter.js` (stubbed exchange consumption).
Services: S3.1's mock LLM gateway (consumed for any downstream page this journey lands on), stubbed GitHub/Google OAuth exchange (consumed, extending the `check-wuce1-oauth-flow.js` pattern).
APIs: GitHub OAuth callback, Google OAuth callback, email/password login endpoint (consumed, not modified).

---

## Contract Review

Reviewed against all 5 ACs and the test plan's Unit/Integration/E2E/NFR sections. No mismatches found — the test plan's AC Coverage table maps 1:1 (AC1–AC2 integration+E2E, AC3 E2E-only, AC4 unit+integration+E2E, AC5 integration+E2E), and the story's own "Correction from original brief" note (no Better Auth; Path C roll-your-own OAuth) is consistently reflected in both the story's Architecture Constraints and the test plan's Test Data Strategy section — no drift found.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## H8-ext — Schema Dependency Declaration

**Dependencies (story):** Upstream: S3.1 (mock LLM gateway) for the `@mocked` variant of any downstream page this journey lands on.

Code-level/module consumption dependency, not a `pipeline-state.json` field-read dependency in the strict H8-ext sense. Declaring the schema dependency anyway, keyed on sequencing:

`schemaDepends: ["dorStatus"]` — referring to `bri-s3.1`'s story-level `dorStatus` field in `pipeline-state.json`. Field confirmed present in `pipeline-state.schema.json`.

**H8-ext: PASS** — declared field `dorStatus` exists in `pipeline-state.schema.json`.

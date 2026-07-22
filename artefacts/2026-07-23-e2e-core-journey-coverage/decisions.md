# Decisions: E2E Core Journey Coverage on Staging

## RISK — Staging test-data accumulation (2026-07-23)

**Context:** Surfaced during /clarify. Both new E2E scenarios create real staging data on every run — signup, product creation, Stripe test-mode customers — since they run against real `wuce-staging`, not a disposable per-run environment.

**Decision (resolved at /review, 2026-07-23):** Option (b) chosen — a strict naming/tagging convention (`e2e-test-*` prefix on emails/product/feature names, established by story A3) plus a manually-triggered purge script (`scripts/cleanup-e2e-staging-data.js` or equivalent, story B3), rather than a scheduled nightly job. Rationale: simplest for a solo-operator repo — no scheduled-job infrastructure (cron/CI schedule) to build or maintain, and staging's data volume from CI runs is low enough that periodic manual purges are sufficient. Story B3's AC1 was reworded from a conditional "whichever option is selected" to this concrete mechanism.

**Source:** /clarify pass, this session; resolved during /review walkthrough of MEDIUM finding B3 [1-M1].

---

## RISK — Staging staleness relative to merged code (2026-07-23)

**Context:** Surfaced during /clarify. CI auto-deploy to `wuce-staging` has been broken all session (`FLY_API_TOKEN` expired, confirmed via `gh secret list` showing no update since 2026-06-29) — every deploy this session was a manual `flyctl deploy`. The operator confirmed proceeding with E2E work anyway (manual deploy is acceptable), but this means an E2E failure could reflect stale staging content rather than a genuine regression in the PR under test, until the token is fixed.

**Decision (tracked, not yet resolved):** Proceeding without blocking on the token fix, per operator instruction. `/definition` or `/test-plan` should note this as a known limitation of the E2E gate's reliability until `FLY_API_TOKEN` is refreshed (see the two commands already provided to the operator earlier this session: `flyctl tokens create deploy` + `gh secret set FLY_API_TOKEN`).

**Source:** /clarify pass, this session; original token-expiry finding from earlier in this same session (tmc-s1/pvc-s1 deploy investigation).

---

## RISK-ACCEPT — W4 (AC verification scripts not pre-walked by a domain expert before DoR) (2026-07-23)

**Context:** /definition-of-ready's W4 warning applies to all 8 stories (A1-A5, B1-B3): each story's AC verification script was written at `/test-plan` but has not been walked through end-to-end by a domain expert before DoR sign-off.

**Decision:** Acknowledged and accepted for all 8 stories. This is a solo-operator repo (Hamish King, Founder/Operator) — the same person who authored, reviewed (twice, across Run 1 and Run 2), and is now signing off on these stories already has direct familiarity with every AC's intended behaviour. A full manual script walkthrough is deferred to post-merge smoke testing rather than blocking DoR sign-off now. This matches the Operating Posture in `.github/architecture-guardrails.md` (W4 RISK-ACCEPT is the standard posture for this repo, not a per-story exception).

**Source:** /definition-of-ready run, 2026-07-23, applied uniformly to A1, A2, A3, A4, A5, B1, B2, B3.

---

## DECISION — A1 staging auth-stub design: session-only identity, double-gated, no committed secret (2026-07-23)

**Context:** Story A1 (a1-staging-safe-auth-stub) required a staging-only mechanism to replace the external GitHub OAuth round-trip for E2E tests running against real `wuce-staging`, without weakening production auth (`fly.toml`/`wuce.fly.dev`) in any way (AC3) and without a real third-party GitHub test account (out of scope).

**Decision:**
1. **No persistent DB row for the stub identity.** The real production `GET /auth/github/callback` handler (`routes/auth.js`) never writes to the `users` table for GitHub logins (tenant identity comes from GitHub's own OAuth identity, not a local row) — the stub mirrors this exactly: it only populates session fields (`userId`, `login`, `tenantId`, `authProvider`, `role`), the same shape the real callback sets. "Real user record queryable via staging database/API" (AC1) is satisfied via `GET /api/me`, matching how the real GitHub OAuth path is itself verified elsewhere in this repo.
2. **Double gate, not a single env-var check.** The mechanism requires BOTH `process.env.E2E_STAGING_AUTH_STUB_SECRET` to be set on the server AND the request to present a matching `x-e2e-stub-secret` header (constant-time compared). A single mistaken env var leak (e.g. accidental inclusion in a shared config template) does not, by itself, allow the bypass to fire.
3. **The secret is never committed anywhere**, including `fly.staging.toml`. It is set only via `flyctl secrets set E2E_STAGING_AUTH_STUB_SECRET=<value> --app wuce-staging` (Fly's secret store, not the checked-in `[env]` block). This is stricter than the DoR contract's estimated touch-point list implied (which named `fly.staging.toml` as a likely touch point) — `fly.staging.toml` was deliberately left unmodified because there is no safe way to commit a real secret value to a repo file, and the AC3 check only needs to assert absence from `fly.toml` (production), which holds regardless of where the staging secret lives.
4. **Audit trail is in-memory, read via a same-gated HTTP endpoint** (`GET /auth/e2e-stub/audit`), not a DB table or log-aggregation query — the simplest mechanism that lets an E2E test assert NFR-Audit's "usage is logged" property without adding new infrastructure. Downstream story B3 (staging test-data cleanup) should be aware this audit trail is process-lifetime only (reset on redeploy/restart), not a durable record — if B3 needs durable cross-deploy audit history, that is a new consideration for B3, not covered by this in-memory mechanism.

**Rationale:** Minimises new surface area (no new DB schema, no new adapter wiring, no committed secret) while satisfying all 4 ACs, matching this story's Complexity Rating of 2 and its "additive to staging only" scope boundary.

**Source:** a1-staging-safe-auth-stub implementation, 2026-07-23.

# NFR Profile: Beta-Readiness Infrastructure — Feature Flags, Staging Environment, and E2E Test Coverage

**Feature:** 2026-07-09-beta-readiness-infra
**Created:** 2026-07-09
**Last updated:** 2026-07-09
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| `isEnabled()` call latency | ≤ 200ms | Automated test / observed latency under normal PostHog API response time | bri-s1.1 |
| Flag bootstrap at session start | ≤ 200ms added to session-start | Automated test | bri-s1.3 |
| Group identification call | ≤ 100ms (within the 200ms session-start budget) | Automated test | bri-s1.4 |
| Neon autosuspend cold-start resolution | ≤ 30 seconds | Playwright/CI timeout assertion | bri-s2.2, bri-s2.6 |
| Seed script execution | < 30 seconds | Post-deploy pipeline timing | bri-s2.4 |
| Mock LLM gateway response | < 50ms per call | Automated test | bri-s3.1 |
| `@mocked` suite total runtime | Under 10 minutes (revisable per `decisions.md`) | CI job duration on every PR | bri-s3.1 through bri-s3.6 |

**Source:** Story AC / Stakeholder requirement (discovery.md success indicators)

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|--------------------|-----------------|
| Authentication | GitHub/Google OAuth, email/password login flows all covered by deterministic E2E coverage | Existing auth stack (ADR-002, landing-auth-billing) | bri-s3.6 |
| Authorisation | Tenant isolation (cross-tenant reads/writes rejected, 404 not 403) enforced and regression-tested | ADR-025 | bri-s3.4 |
| Authorisation | Per-person role differentiation within a tenant (admin vs engineer vs viewer) — depends on external feature | `2026-07-09-team-identity-roles` | bri-s3.3 |
| Input validation | `tenantId` for flag targeting always session-derived, never client-supplied | ADR-025 | bri-s1.4 |
| Secrets management | Staging Fly/Neon/Upstash/PostHog secrets set via `fly secrets set`, never committed to the repo | Existing repo convention | bri-s2.1, bri-s2.2, bri-s2.3, bri-s1.2 |
| Secrets management | No real Stripe secret/webhook signing secret used in `@mocked`/`@billing` CI runs | Discovery Constraints | bri-s3.5 |
| Secrets management | Mock LLM gateway only activatable via explicit test configuration, never by production config error | ADR-018 pattern (auth-bypass fixture) | bri-s3.1 |
| Audit logging | Session token / `accessToken` never appears in HTML response or logs | Session-security constraint tracked in `landing-auth-billing` guardrails (assessed by `/review` 2026-07-01) — distinct from the identically-numbered `MC-SEC-01`/`MC-SEC-02` in the global guardrails-registry, which govern unrelated viz/dashboard concerns | bri-s3.6 |
| Audit logging | `rotateSessionId` called after every provider login | Session-security constraint tracked in `landing-auth-billing` guardrails (assessed by `/review` 2026-07-01) | bri-s3.6 |
| Data hygiene | Zero real customer PII in staging seed data — synthetic tenants only | Discovery Constraints | bri-s2.4 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (staging holds only synthetic data; real customer data remains prod-only, isolated per ADR-025)

**Source:** `.github/architecture-guardrails.md` (ADR-018, ADR-025, MC-SEC-01/02) / Story AC

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|--------------------|--------------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — `context.yml` confirms `meta.regulated: false`, no data residency obligation identified.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Staging uptime SLA | Not defined | — | Staging is explicitly allowed to autosuspend/cold-start (Neon free tier) — not an always-on environment; this is an accepted tradeoff, not a gap |
| Prod uptime SLA | Not defined at this feature's scope | — | Out of scope for this feature — no new prod availability commitment is made here |
| RTO / RPO | Not defined | — | Rollback path (bri-s2.6 AC4) is documented but not measured against a formal RTO target for MVP |

**Source:** Business context — no formal SLA agreement exists yet for a pre-launch, pre-beta product.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|---------------------|-------------|-----------------|
| None | — | — | — |

**Named sign-off required?**
- [x] Not required

_No compliance frameworks apply — `context.yml` confirms `meta.regulated: false`._

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Availability | No formal SLA for `wuce-staging`/`wuce-prod` uptime | Hamish King | Revisit once first beta customer is onboarded and real usage patterns exist |

_All other NFR areas have no open gaps as of 2026-07-09._

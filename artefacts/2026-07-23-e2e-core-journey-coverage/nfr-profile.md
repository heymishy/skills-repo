# NFR Profile: E2E Core Journey Coverage on Staging

**Feature:** 2026-07-23-e2e-core-journey-coverage
**Created:** 2026-07-23
**Last updated:** 2026-07-23
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Auth stub round-trip | Completes in under 5s against real staging network latency | Playwright spec timing assertion | A1 |
| `/ideate` canvas update | Completes within the SSE stream's own completion signal, bounded Playwright wait | Playwright spec | A3 |
| Session resume render | Bounded Playwright wait matching normal page-load expectations | Playwright spec | A4, B1 |
| Scenario A CI job runtime | Under 5 minutes | CI job duration | A5 |
| Scenario A + B combined CI runtime | Under ~10 minutes total | CI job duration | B2 |

**Source:** Story ACs — no formal SLO existed prior to this feature; these are baseline targets set by /definition, not stakeholder-mandated SLAs.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Authentication | Staging-safe OAuth/email auth stub must not be reachable or enabled on the real production Fly app | ADR-018 addendum (this feature) | A1 |
| Authorisation | Resumed sessions only reachable by the same authenticated user/tenant that created them | ADR-025 (multi-tenancy, application-layer tenant_id scoping) | A4, B1 |
| Secrets management | Stripe test-mode keys, staging auth-stub credentials stored as CI secrets, never committed or logged in plaintext | Mandatory Constraints — Security (`.github/architecture-guardrails.md`) | A1, A2, A5 |
| Least-privilege access | Staging cleanup mechanism scoped credentials, no broader delete permission than required | Story-level NFR | B3 |
| Audit logging | Auth-stub usage logged (which test run created which staging user); cleanup runs log what was deleted | Story-level NFR | A1, B3 |

**Data classification:**
- [ ] Public — no PII, no sensitive data
- [x] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

All data created by these E2E scenarios is synthetic test fixture data (test emails, test Stripe customers, test product/feature names tagged `e2e-test-`) on a non-production staging environment — no real customer PII is created or handled.

**Source:** `.github/architecture-guardrails.md` Mandatory Constraints (Security); ADR-018; ADR-025; discovery.md Constraints section

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — no data residency requirement identified in discovery.md or `product/constraints.md`; this feature creates only synthetic test data on staging.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Uptime SLA | Not defined | — | `wuce-staging` has no formal uptime SLA; it is a solo-operator staging environment, and CI auto-deploy is currently broken (tracked separately in decisions.md) |
| RTO (recovery time) | Not defined | — | — |
| RPO (data loss tolerance) | Not defined | — | Staging data loss (e.g. from B3's cleanup mechanism) is acceptable by design — it is synthetic test data |
| Planned maintenance window | Not defined | — | — |

**Source:** Not defined — no SLA agreement exists for the staging environment.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| None | — | — | — |

**Named sign-off required?**
- [x] Not required
- [ ] Yes — compliance / legal review needed before shipping

Discovery confirmed `regulated: false`, `complianceFrameworks: []` — no compliance obligations apply to this feature.

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Availability | `wuce-staging` has no formal uptime/SLA target, and CI auto-deploy is currently broken (`FLY_API_TOKEN` expired) — an E2E failure could reflect stale staging rather than a genuine regression until this is fixed | Hamish King | Tracked in decisions.md, not blocking this feature per operator instruction |
| Data hygiene | Staging test-data cleanup mechanism choice not yet made (nightly job vs naming-convention+manual purge vs accept-and-monitor) | Hamish King / coding agent at B3 implementation | At B3 implementation time |

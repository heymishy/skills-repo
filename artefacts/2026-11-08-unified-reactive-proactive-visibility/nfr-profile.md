# NFR Profile: Unified Reactive + Proactive Visibility

**Feature:** 2026-11-08-unified-reactive-proactive-visibility
**Created:** 2026-11-09
**Last updated:** 2026-11-09
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Repo-connect response time | Must not block on the GitHub fetch + rollup computation triggered by the new auto-sync call | Manual timing check: repo-connect HTTP response returns before `triggerProductSync`'s promise resolves | urpv-s1 |
| `decisions.md` per-feature fetch latency | `[UNKNOWN BASELINE]` — no current measurement of typical feature count per connected product or per-fetch latency at scale | Flagged as a risk to measure at test-plan/DoR time, not assumed safe | urpv-s3 |

**Source:** Story AC (urpv-s1, reusing the existing `pst-s1` non-blocking pattern) / Not defined (urpv-s3 — genuinely unmeasured, not assumed)

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Authentication | All GitHub reads use the requesting tenant admin's own session-scoped `req.session.accessToken` — never a service account, never persisted | ADR-020; CLAUDE.md canonical field name rule | urpv-s1, urpv-s3 |
| Authorisation | All queries remain `tenant_id`-scoped; no cross-tenant repo or pod data reachable | ADR-025 (multi-tenancy) | urpv-s1, urpv-s2, urpv-s3, urpv-s4 |
| Input validation | `decisions.md` content rendered as escaped text only, never raw HTML | MC-SEC-01 | urpv-s3 |
| Secrets management | Access tokens never logged or captured in PostHog exception payloads | Existing pattern in `pipeline-state-fetch-adapter.js` | urpv-s1 |
| Audit logging | Sync failures logged server-side via existing `console.error`/`_posthog.captureException` pattern | Existing `product-rollup.js` convention | urpv-s1 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (delivery-pipeline metadata: story slugs, stages, health, decision text — no PII, no payment data)
- [ ] Public
- [ ] Confidential
- [ ] Restricted

**Source:** `.github/architecture-guardrails.md` Mandatory Constraints (Security) / ADR-020 / ADR-025

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | `context.yml`'s `complianceProfile: standard`, `complianceFrameworks: []` for this feature; no data residency obligation identified | — |

**Source:** Not applicable

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Not defined | — | — | No uptime SLA, RTO, or RPO applies to this feature specifically — it inherits the web-ui product's existing availability posture, not a new one. |

**Source:** Not defined

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| None | — | — | — |

**Named sign-off required?**
- [x] Not required
- [ ] Yes — compliance / legal review needed before shipping

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Performance | `decisions.md` per-feature fetch latency has no baseline — a product with many features could see meaningful page-load latency from urpv-s3's live fetch | Hamish King (Platform Owner) | Before urpv-s3 reaches /definition-of-ready — measure against a real multi-feature connected product (this repo itself qualifies) |


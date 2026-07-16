# NFR Profile: Product Rollup & Aggregation Layer

**Feature:** 2026-07-16-product-rollup
**Created:** 2026-07-17
**Last updated:** 2026-07-17
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Sync latency | Single bounded GitHub Contents API fetch + one Postgres write per sync — no per-feature API calls | Manual timing at DoD; confirm request count via network inspection during a real sync | pr-s2 |
| Refresh UI feedback | Loading state appears within 200ms of click, independent of underlying sync duration | Manual verification | pr-s3 |
| Rollup dimension rendering | Computed from the already-cached rollup record — no additional API calls per dimension | Confirmed by network inspection: only pr-s2's sync triggers external calls | pr-s4, pr-s5, pr-s6, pr-s7 |

**Source:** Discovery Constraints (GitHub API rate-limit note) / Story ACs

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Authentication | GitHub Contents API calls use the requesting user's own OAuth token (`req.session.accessToken`) | ADR-020 (never a service account) | pr-s2 |
| Authorisation / tenant scoping | Cached rollup record is row-scoped by `product_id`, which is itself `tenant_id`-scoped via the `products` table | ADR-025 (application-layer tenant scoping) | pr-s1, pr-s2 |
| Input validation | Fetched `pipeline-state.json` content is parsed defensively — a malformed or unexpected shape fails the sync visibly (pr-s2 AC3), not silently | CLAUDE.md mock-shape verification rule | pr-s2 |
| Secrets management | The OAuth token itself is never persisted to the cache table or logged | MC-SEC-02 (`.github/architecture-guardrails.md`) | pr-s2 |
| Audit logging | Sync attempts (success/failure) logged with `product_id` and timestamp | Existing `dashboard.js` action-queue audit-log convention | pr-s2 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (delivery-health metadata about a tenant's own product; no PII, no payment data)

**Source:** ADR-020, ADR-025, MC-SEC-02 (`.github/architecture-guardrails.md`) / CLAUDE.md D37 and mock-shape verification rules

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | `context.yml` sets `meta.regulated: false` for this repo | — |

**Source:** Not applicable — confirmed directly against `context.yml`, not assumed.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Not defined | — | — | This is a solo-operator platform feature, not a customer-SLA-bound service; no formal uptime target applies beyond the platform's existing general availability |

**Source:** Business context — no SLA agreement exists for this feature specifically.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| Not applicable | — | — | — |

**Named sign-off required?**
- [x] Not required

`context.yml` sets `meta.regulated: false`; no compliance framework applies to this feature.

---

## NFR AC blocks

**Security (used in pr-s2):**
```
Given the connected repo's pipeline-state.json cannot be fetched or has an unexpected shape
When a sync is triggered
Then the sync fails visibly with a clear error message — it does not silently show stale or empty data as if it were current
```

**Security (used in pr-s2):**
```
Given a sync completes successfully
Then the OAuth token used for the fetch is not written to the cache table or any log line
```

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| GitHub API rate-limit budget | No hard per-tenant rate-limit accounting exists yet — on-demand-only sync (MVP) keeps consumption low today, but no explicit monitoring/alerting is scoped if this becomes a real constraint at scale | Hamish King | Revisit if beta usage shows rate-limit pressure |
| Health-derivation precedence rule | Discovery's [ASSUMPTION] on the red-takes-precedence rule (pr-s4) is not yet operator-confirmed via `/clarify` | Hamish King | Before DoR sign-off on pr-s4 |
| Test/AC coverage calculation method | Discovery's [ASSUMPTION] on blended vs. average calculation (pr-s5, pr-s6) is not yet operator-confirmed via `/clarify` | Hamish King | Before DoR sign-off on pr-s5/pr-s6 |

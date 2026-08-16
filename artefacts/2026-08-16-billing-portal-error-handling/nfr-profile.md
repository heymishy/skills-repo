# NFR Profile: billing-portal-error-handling

**Feature:** 2026-08-16-billing-portal-error-handling
**Created:** 2026-08-16
**Last updated:** 2026-08-16
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| No measurable slowdown to `/settings/billing` response time | Response time comparable to pre-fix (same synchronous redirect logic, now wrapped in a guard + try/catch with no new I/O) | Manual comparison, no formal load test | bpe-s1 |

**Source:** Story NFR section, Performance.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| No raw error/stack trace reaches the client on either new failure path | The caught error is logged server-side only (structured JSON via `console.error`/`console.warn`); the client only ever sees a 302 redirect to a fixed `?error=<code>` string, never the underlying Stripe error message or stack | Existing structured-logging convention already used in this file's webhook handler (`credits_provisioned`, `payment_failed`, `subscription_canceled`) | bpe-s1 (AC4, AC5, NFR test `billingPortal_errorLogging_structuredNoRawErrorLeaked`) |

**Data classification:**
- [x] Internal — non-public but low sensitivity (the only data involved is a Stripe customer ID, already present in the session; no new PII or payment data introduced)
- [ ] Public — no PII, no sensitive data
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** Story NFR section, Security. Data classification unchanged from the handler's existing behaviour — this story does not change what data the handler reads or displays, only how it responds when that data is missing or Stripe's API fails.

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — this story changes error-handling and response routing only, no data storage or transfer behaviour.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Not defined | — | — | Standard app route availability applies (existing `/settings/billing` route); no new availability requirement introduced. This fix improves resilience (a Stripe-side failure no longer produces a raw 500 for the user) but does not change the route's own availability target. |

**Source:** Not defined — no new service or availability surface.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| Not applicable | — | — | — |

**Named sign-off required?**
- [x] Not required

---

## Accessibility

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Not applicable | — | — | No new markup is introduced — every outcome of this handler remains a 302 redirect, same as before this fix. |

**Source:** Story NFR section, Accessibility.

---

## Audit

| NFR | Requirement | Applies to story |
|-----|-------------|-----------------|
| New structured log lines on both new failure paths | `billing_portal_no_customer_id` (warning, guard path) and `billing_portal_error` (error, catch path) — matches this file's existing structured-logging convention | bpe-s1 (AC4, AC5) |

**Source:** Story NFR section, Audit.

---

## Gaps and open questions

No NFR gaps identified at 2026-08-16.

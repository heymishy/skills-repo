# NFR Profile: Extend CSRF token protection to remaining server-rendered forms

**Feature:** 2026-08-17-remaining-csrf-form-coverage
**Created:** 2026-08-24
**Last updated:** 2026-08-24
**Status:** Active

---

## Performance

No performance SLOs defined — baseline measurement only. Token generation is a single cached call per session (`generateCsrfToken`, idempotent — same pattern already proven in `sec-perf-s3`), negligible overhead beyond what the already-shipped mechanism incurs.

**Source:** Not defined — no performance constraint applies to a form-token check of this shape.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|---------------------|-------------------|
| Authorisation — every server-rendered `<form method="POST">` target must reject a request with a missing or mismatched CSRF token | `403`/`"Forbidden"`, matching the existing convention set by `sec-perf-s3` | This repo's own injected security standard + direct precedent from `sec-perf-s3`'s shipped implementation | rcfc-s1 |
| No weakening of independently-existing access checks | Any pre-existing gate (`authGuard`, `requireNonViewer`, org-type checks) on a route must continue to fire independently of the new CSRF check | Deny-by-default, defence-in-depth — same standard already applied in `vrne-e1-viewer-write-blocking`'s own additive-gate pattern (AC5-equivalent regression guard) | rcfc-s1 |
| Audit — no secret/token value logged | CSRF token values must never appear in application logs | Matches `sec-perf-s3`'s own existing convention (static review, not a runtime test) | rcfc-s1 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (session-scoped CSRF tokens; no PII beyond what already flows through this repo's existing session mechanism)
- [ ] Public — no PII, no sensitive data
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** This repo's own injected security standard ("deny by default") + direct precedent from `sec-perf-s3`'s already-shipped implementation.

---

## Data residency

Not applicable — no new data storage or residency change. CSRF tokens are session-scoped, in-memory/session-store only, using the exact mechanism `sec-perf-s3` already built.

**Source:** Not applicable

---

## Availability

No availability SLO applies — this is a synchronous, in-process check with no external dependency beyond the already-existing session mechanism.

**Source:** Not defined — not applicable to this feature's scope

---

## Compliance

No named regulatory framework applies. This is a self-imposed risk-reduction obligation (closing a self-documented gap from `sec-perf-s3`), not an external compliance driver.

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

No NFR gaps identified at 2026-08-24.

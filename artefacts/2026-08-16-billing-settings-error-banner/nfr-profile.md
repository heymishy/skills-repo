# NFR Profile: billing-settings-error-banner

**Feature:** 2026-08-16-billing-settings-error-banner
**Created:** 2026-08-16
**Last updated:** 2026-08-16
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| No measurable slowdown | One additional dictionary lookup (`req.query.error` against a 2-entry map) per page load; no new network calls, no new JS execution | Manual comparison, no formal load test | bse-s1 |

**Source:** Story NFR section, Performance.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| User-controlled query parameter (`error`) must never be reflected raw into response HTML | The `error` value is mapped through a fixed allowlist dictionary to one of two hardcoded, pre-escaped strings; any unrecognized value (including adversarial input) maps to "no banner," never to a reflected value | Reflected-content-into-HTML avoidance — general secure-coding practice, no named external framework clause | bse-s1 (AC3) |

**Data classification:**
- [x] Internal — non-public but low sensitivity (banner text is a static, hardcoded message; no billing/payment data is read or rendered by this story)
- [ ] Public — no PII, no sensitive data
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** Story NFR section, Security. This is a real, explicit driver for this story, not boilerplate — the story reads a user-controlled URL query parameter and renders a message derived from it, which is exactly the shape of surface a reflected-XSS defect would take if implemented naively (e.g. `` `Error: ${req.query.error}` `` interpolated directly). The allowlist-mapping design closes this off structurally; AC3's test asserts the raw value is never present in the response body for both an adversarial (`<script>...</script>`) and a benign-but-unrecognized value.

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — this story adds a server-rendered HTML string derived from a fixed, hardcoded message dictionary; no data storage or transfer behaviour.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Not defined | — | — | Standard app availability applies; no new availability surface introduced. |

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
| The error banner must be announced to assistive technology, not just visually present | `role="alert"` on the banner element, matching the existing Credits-tab `#credits-error` pattern in the same file | Manual/code-inspection check (AC1/AC2 assert `role="alert"` is present in the rendered markup) | bse-s1 (AC1, AC2) |

**Source:** Story NFR section, Accessibility. Consistent with this file's own existing convention (`_billingStatusPill`'s colour + explicit text label; `renderCreditsTab`'s existing `role="alert"` banner) of never relying on a visual-only or colour-only signal.

---

## Audit

| NFR | Requirement | Applies to story |
|-----|-------------|-----------------|
| None identified | No change to logging/audit behaviour — `billing.js`'s own `handleGetBillingPortal` already logs `billing_portal_no_customer_id`/`billing_portal_error` server-side at redirect time (unmodified by this story); this story only affects what renders on the page the redirect lands on | bse-s1 |

**Source:** Story NFR section, Audit.

---

## Gaps and open questions

None. Unlike `nia-s1`'s AC3 (an irreducibly subjective visual judgment), every claim in this story's NFR set is directly testable from the response-body string returned by `handleGetSettings` — no CSS-layout-dependent, RISK-ACCEPT-requiring gap exists for this story (see test plan's "E2E / browser-layout detection" section).

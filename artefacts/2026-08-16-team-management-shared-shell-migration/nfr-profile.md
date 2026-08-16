# NFR Profile: team-management-shared-shell-migration

**Feature:** 2026-08-16-team-management-shared-shell-migration
**Created:** 2026-08-16
**Last updated:** 2026-08-16
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| No measurable slowdown to `/team/members` or `/team/invites/new` response time | Response time comparable to pre-refactor (same synchronous string-building, now routed through `renderShell()`) | Manual comparison, no formal load test — both handlers remain synchronous with no new I/O | tmss-s1 |

**Source:** Story NFR section, Performance.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| No escaping regression when replacing `_escapeHtml` with `escHtml()` | Every user- or model-supplied string injected into the rendered HTML must remain HTML-escaped after the refactor | `.github/standards/web-ui/web-ui-patterns.md`, "Shared shell module" rule | tmss-s1 (AC3) |

**Data classification:**
- [x] Internal — non-public but low sensitivity (admin-only tenant management UI; no PII beyond what the two forms already handle — teammate identity/email, both already in scope pre-refactor)
- [ ] Public — no PII, no sensitive data
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** Story NFR section, Security. Data classification unchanged from the pages' existing behaviour — this story does not change what data either page collects or displays, only how the HTML is assembled.

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — this story changes HTML rendering/escaping only, no data storage or transfer behaviour.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Not defined | — | — | Standard app route availability applies (existing `/team/members`, `/team/invites/new` routes); no new availability requirement introduced by this refactor. |

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
| No accessibility regression from the shell wrapper change | Both forms' existing native, labelled controls and keyboard tab order remain unchanged after wrapping in `renderShell()` | Automated test (label/control pairing, per AC verification script's existing coverage) + manual keyboard-navigation re-check (verification script Edge case scenario) | tmss-s1 |

**Source:** Story NFR section, Accessibility. Baseline accessibility was independently verified via a live Chrome keyboard-navigation check on staging for `wsi-s6`'s page (2026-08-16) — this story's job is to confirm that baseline survives the shell-wrapper change, not to establish it fresh.

---

## Audit

| NFR | Requirement | Applies to story |
|-----|-------------|-----------------|
| None identified | No change to logging/audit behaviour — this refactor touches HTML rendering only | tmss-s1 |

**Source:** Story NFR section, Audit.

---

## Gaps and open questions

No NFR gaps identified at 2026-08-16.

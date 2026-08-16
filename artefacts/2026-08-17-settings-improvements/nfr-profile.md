# NFR Profile: Settings improvements — locale, plan management, theme relocation

**Feature:** 2026-08-17-settings-improvements
**Created:** 2026-08-17
**Last updated:** 2026-08-17
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Locale preference save | < 1 second under normal load | Manual timing check during implementation | si-s2 |
| Theme toggle relocation | No measurable page-load impact | Existing page-load baseline unaffected (markup move only, no new dependencies) | si-s1 |

**Source:** Story AC (si-s1 NFRs, si-s2 NFRs)

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Input validation | Timezone/date-format values validated server-side against an allowlist of valid IANA timezone identifiers and supported date-format strings before persistence | Existing server-side-validation pattern used elsewhere in this codebase | si-s2 |
| Output encoding | Any dynamic/user-supplied value re-displayed in the Profile tab (e.g. a saved locale value) must pass through `escHtml()` before injection into HTML — never raw | `.github/standards/web-ui/web-ui-patterns.md` — Shared shell module rule | si-s1, si-s2 |
| Authorisation | Locale/theme preference read/write is scoped to the signed-in user's own row via existing session-based identity — no new resource requiring a dedicated tenant guard | ADR-025 (tenant scoping) | si-s2 |

**Data classification:**
- [ ] Public — no PII, no sensitive data
- [x] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** `.github/standards/web-ui/web-ui-patterns.md` / story NFRs (si-s1, si-s2)

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — `context.yml` sets `meta.regulated: false`; discovery's own Constraints section confirms no compliance or regulatory driver, and `product/constraints.md` (this repo's own skills-platform meta-tool constraints) is explicitly not applicable to wuce-specific feature work.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Uptime SLA | Not defined | — | No SLA target set for this feature — standard best-effort delivery, consistent with beta-stage product |

**Source:** Not defined — no business context establishing a target for this feature.

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

_No NFR gaps identified at 2026-08-17._


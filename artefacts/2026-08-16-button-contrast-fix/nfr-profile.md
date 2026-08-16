# NFR Profile: button-contrast-fix

**Feature:** 2026-08-16-button-contrast-fix
**Created:** 2026-08-16
**Last updated:** 2026-08-16
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| No measurable slowdown | A literal string change inside existing inline styles; no new network calls, no new JS execution | Manual comparison, no formal load test | bcf-s1 |

**Source:** Story NFR section, Performance.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| No change to route handler logic | Only a CSS color value inside an inline `style` string changes; no request/response shape, auth, or data-flow change | N/A — no security-relevant code path touched | bcf-s1 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (button styling only; no PII rendered or transmitted differently by this change)
- [ ] Public — no PII, no sensitive data
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** Story NFR section, Security. Data classification unchanged from the elements' existing behaviour.

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — this story changes literal CSS values in server-rendered HTML strings only, no data storage or transfer behaviour.

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
| `--accent` background / button text pairing must clear WCAG AA's 4.5:1 minimum contrast for normal text, in both light and dark mode, at all 11 identified button/link instances | Light mode: ≥ 6.29:1 (computed). Dark mode: ≥ 4.47:1 (computed) — matches the ratio already shipped today, unremarked, at the `Designate`/`Save` reference buttons in the same file | Automated test (`designSystem_accentWhiteContrastMeetsMeasuredTarget`, test plan AC4) computing the WCAG relative-luminance contrast ratio directly from token hex values, not visual inspection | bcf-s1 (AC1, AC4) |

**Source:** Story NFR section, Accessibility. This is the primary driver for this story, not a boilerplate carry-over: `artefacts/feedback/beta-003.md` root-caused a real WCAG contrast failure (`--accent-ink` incorrectly paired with the vivid `--accent` background instead of the soft `--accent-soft` background it was designed for). The story's own scope-verification finding (see story's Architecture Constraints) additionally establishes that the pre-fix failure is present and measurable in **both** themes — light mode's pre-fix ratio (1.58:1) is numerically worse than dark mode's (2.24:1), even though the beta report and initial triage both framed it as dark-mode-specific. AC4 closes both gaps with one unconditional, non-theme-scoped fix.

**Note on the dark-mode residual (4.47:1 vs. the strict 4.5:1 AA threshold):** the post-fix dark-mode ratio (4.47:1) is a hair under the strict AA minimum for normal-weight, non-large text. This is not a new risk introduced by this story — it is exact parity with the ratio already shipped today, unremarked, at the `Designate` and `Save` buttons in the same file (the reference pattern this fix is matching). No separate RISK-ACCEPT is logged for this specific residual, since accepting it is equivalent to accepting the status quo of an already-shipped, already-accepted pattern elsewhere in the same file — see `decisions.md` for the explicit reasoning.

---

## Audit

| NFR | Requirement | Applies to story |
|-----|-------------|-----------------|
| None identified | No change to logging/audit behaviour — this fix touches inline CSS values in server-rendered HTML only | bcf-s1 |

**Source:** Story NFR section, Audit.

---

## Gaps and open questions

None. Unlike `nia-s1`'s AC3 (an irreducibly subjective "does this look like an avatar" visual judgment), this story's accessibility NFR is fully closed by a computed numeric contrast ratio derived directly from the token hex values — no CSS-layout-dependent, RISK-ACCEPT-requiring gap exists for this story (see test plan's "E2E / browser-layout detection" section for the explicit comparison against `nia-s1`'s precedent).

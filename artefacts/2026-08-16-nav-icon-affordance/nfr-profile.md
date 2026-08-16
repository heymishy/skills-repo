# NFR Profile: nav-icon-affordance

**Feature:** 2026-08-16-nav-icon-affordance
**Created:** 2026-08-16
**Last updated:** 2026-08-16
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| No measurable slowdown to page render | Response time comparable to pre-fix (same synchronous string-building; CSS-only icon gating adds no JS execution beyond one click-gated `confirm()` call) | Manual comparison, no formal load test | nia-s1 |

**Source:** Story NFR section, Performance.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| No change to sign-out route behaviour or session handling | `confirm()` is a UX safeguard only, not a security boundary; `/auth/logout`'s server-side behaviour is unchanged | N/A — no security-relevant code path touched | nia-s1 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (nav chrome only; no PII rendered or transmitted by either element)
- [ ] Public — no PII, no sensitive data
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** Story NFR section, Security. Data classification unchanged from the elements' existing behaviour.

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — this story changes shared-shell HTML/CSS rendering only, no data storage or transfer behaviour.

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
| Sign-out control's accessible name/affordance must not depend solely on a hover-only `title` attribute | A visible text node ("Sign out") is present independent of `title`, discoverable by touch-only and keyboard/screen-reader users, not just mouse-hover users | Automated test (`htmlShell_signout_hasVisibleTextLabel`, test plan AC1) + manual touch-device check (verification script Scenario 1) | nia-s1 (AC1) |
| Theme-toggle button's `aria-label` must remain descriptive and unchanged through the icon swap | `aria-label="Toggle dark mode"` present, unchanged | Automated test (`htmlShell_themeToggle_classHandlerAriaLabelUnchangedAndToggleStillWorks`, test plan AC4) | nia-s1 (AC4) |

**Source:** Story NFR section, Accessibility. This is a real, primary driver for this story, not a boilerplate carry-over: the original defect (a hover-only `title` as the sole affordance signal) is itself an accessibility failure independent of the beta report's framing as a UX/navigation bug — hover-only affordance signals are not perceivable by touch-input users or by users who rely on visible text over `title` tooltips (which are frequently skipped by screen readers and are not reliably exposed as accessible names in the first place). AC1 closes this gap directly.

---

## Audit

| NFR | Requirement | Applies to story |
|-----|-------------|-----------------|
| None identified | No change to logging/audit behaviour — this fix touches HTML/CSS rendering only | nia-s1 |

**Source:** Story NFR section, Audit.

---

## Gaps and open questions

**AC3 visual-legibility (CSS-layout-dependent, per CLAUDE.md's B2 rule):** Whether the sun/moon icon genuinely reads as "theme control" rather than "avatar" to a real human eye is a rendering-dependent judgment that cannot be fully proven by a unit test inspecting HTML/CSS strings. Classified as RISK-ACCEPT + manual smoke test (verification script Scenario 3) rather than an automated visual-regression test, per CLAUDE.md's explicit B2 classification requirement — see `decisions.md` for the logged RISK-ACCEPT entry and `workspace/state.json`'s `pendingActions` for the corresponding post-deployment smoke-test action item.

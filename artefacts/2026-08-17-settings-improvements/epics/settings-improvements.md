## Epic: Wuce account users can control their personal preferences and confirm their plan from Settings

**Discovery reference:** artefacts/2026-08-17-settings-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-08-17-settings-improvements/benefit-metric.md
**Slicing strategy:** Vertical slice

## Goal

A signed-in wuce user — owner/admin or regular team member — can go to Settings and control their own display preferences (theme, timezone, date format) without leaving the app, and an account owner can confirm that "manage my plan" genuinely works end-to-end via the existing Stripe-hosted portal. Each of the three MVP items (theme relocation, locale preference, plan-management verification) is independently shippable and independently observable against its own benefit metric.

## Out of Scope

- Full UI translation / multi-language support — locale MVP is timezone + date format display only, not i18n.
- BYOK (bring-your-own-key) API key management — explicitly deferred by the reporting beta user as a future item.
- New in-app plan-management UI (upgrade/downgrade/cancel flows built directly into wuce) — relies on the existing Stripe-hosted portal.
- Redesign of the Credits or Impersonate Settings tabs — no reported friction there.
- Currency display/formatting as part of locale — timezone and date format only.
- Per-org default or override mechanism for locale/theme — per-person only.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| Locale preference adoption | 0% (doesn't exist) | Any signed-in user can set timezone/date-format and see it reflected; ≥1 real user beyond the beta reporter sets a non-default value within 4 weeks | Story 2 ships the locale preference UI and storage |
| Theme toggle relocation — no usage regression | Not yet established (2-week capture window before relocation) | Post-relocation click rate within 20% of pre-relocation baseline | Story 1 relocates the toggle and adds the click event needed to measure it |
| Original beta-reported friction resolved | 3 explicit asks, 0 confirmed resolved | Beta user confirms all 3 in-scope asks resolved to his satisfaction | Stories 1–3 collectively close the 3 asks; story 3 closes the loop on plan management specifically |

## Stories in This Epic

- [ ] Relocate the theme toggle into Settings — [Story Issue link]
- [ ] Add a timezone and date-format preference to Settings — [Story Issue link]
- [ ] Confirm the Stripe billing portal satisfies the "manage my plan" ask — [Story Issue link]

## Human Oversight Level

**Oversight:** Low
**Rationale:** Small, bounded UI/schema changes to a non-payment-critical settings surface, reusing existing patterns (`renderShell`, tab structure, existing Stripe portal route). No new payment logic, no new auth surface. Story 3 touches billing only as a read/verification step, not new payment code.

## Complexity Rating

**Rating:** 1

## Scope Stability

**Stability:** Stable

---CANVAS-JSON: {"type":"program-design","title":"Program Design","content":{"mermaid":"flowchart LR\n    SETTINGS[routes/settings.js]\n    SHELL[utils/html-shell.js]\n    USERS[(users table)]\n    STRIPE[Stripe-hosted portal /settings/billing]\n    SETTINGS -->|renderShell/escHtml| SHELL\n    SHELL -->|swToggleTheme relocated| SETTINGS\n    SETTINGS -->|read/write timezone, date_format| USERS\n    SETTINGS -->|existing redirect, unmodified| STRIPE"}}---

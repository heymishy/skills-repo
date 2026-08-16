# Discovery: Settings improvements — locale, plan management, theme relocation

**Status:** Approved
**Created:** 2026-08-17
**Approved by:** Hamish King, 2026-08-17
**Author:** Claude (agent)

---

## Problem Statement

Wuce's Settings area is minimal — Profile (identity + auth linking) and Billing (plan status + an external Stripe portal link) are the only real surfaces. A real beta user (Abhijeet Singh) hit this directly: he wants to manage his plan, set a locale, and control theme preference from Settings, and none of that exists there today. The billing path routes him to an external Stripe-hosted page rather than anything in-app, which doesn't read as "managing my plan" to him.

## Who It Affects

**Wuce account owners/admins** — full Settings access: plan/billing management, and any org-level settings (e.g. default locale). They hit this when managing the account's commercial and configuration state.

**Regular team members** — a narrower slice: their own Profile (identity, sign-in methods) plus personal preferences that make sense per-person (locale, theme) — but not plan/billing, which stays admin-only, consistent with how Billing/Credits are already gated elsewhere in wuce.

## Why Now

Beta is live and this is a real, current beta user's own reported friction — not a hypothetical. Four distinct asks landed in one sitting (locale, plan management, theme relocation, API keys), which signals Settings' thinness isn't a one-off nitpick but a cluster of real gaps. It's also corroborated independently: a CRUD audit run earlier this session (`artefacts/feedback/beta-004-crud-audit.md`) separately found Settings/Organisation to be "the thinnest domain concept in the app" — no rename, no real management surface — arriving at the same conclusion from a completely different angle (systematic code audit vs. live user complaint).

## MVP Scope

1. **Theme toggle relocated into Settings** (Profile tab, near other personal preferences) — small, bounded, closes the "why is this in the topbar" complaint directly.
2. **Basic locale preference** — timezone + date format display only, not full UI translation/i18n. Matches the beta user's own "good for long term" framing (foundational, not urgent) — the smallest slice that starts the "locale exists as a concept" investment without committing to full multi-language support.
3. **Confirm plan management is genuinely closed** — `bpe-s1`/`bse-s1` (both merged 2026-08-16) already fixed the Stripe portal's error handling and visibility. MVP here is verifying that's sufficient (external Stripe portal, reached cleanly) rather than building new in-app plan UI — unless that verification shows it's still not "good enough."

**Explicitly deferred:** BYOK API keys (the beta user's own "(future)" framing) — no MVP scope at all.

## Out of Scope

- **Full UI translation / multi-language support** — locale MVP is timezone + date format display only, not i18n, and why excluded: a much larger, undefined-scope effort than this initiative's real driver.
- **BYOK (bring-your-own-key) API key management** — explicitly deferred by the beta user himself as a future item, and why excluded: no immediate demand signal beyond a single forward-looking mention.
- **New in-app plan-management UI** (upgrade/downgrade/cancel flows built directly into wuce) — MVP relies on the existing Stripe-hosted portal now that its error handling is fixed, and why excluded: avoids duplicating Stripe's own portal functionality before confirming the existing fix isn't already sufficient.
- **Redesign of the Credits or Impersonate Settings tabs** — untouched by this initiative, and why excluded: no reported friction there, no signal this is in scope.

## Assumptions and Risks

[CONFIRMED via /clarify, 2026-08-17] "Locale settings" means timezone + date format only. Currency stays hardcoded/USD for MVP — not in scope.
[CONFIRMED via /clarify, 2026-08-17] Locale and theme preferences are stored per-person — each team member sets their own independently. No org-wide default or override mechanism in MVP.
[CONFIRMED via /clarify, 2026-08-17] Proceed on the assumption that `bpe-s1`/`bse-s1`'s merged fixes likely satisfy the plan-management ask — no gating follow-up conversation with the beta user required before scope-lock. Revisit only if he raises it again.

**Risk — moving the theme toggle could be a regression for other users, not just a fix:** most apps keep it in persistent global chrome specifically for quick access. Moving it into Settings trades icon ambiguity (already partly fixed by `nia-s1`) for reduced discoverability. Worth validating with more than one user's preference before committing, not just this one beta report.

**What could make this not worth building:** if a live follow-up with the beta user (re-testing the now-fixed Stripe portal flow) shows "manage my plan" is actually satisfied already, that's one of three asks resolved without new UI — worth checking before scoping the remaining two.

## Directional Success Indicators

**Locale preference adoption.** Baseline: 0% (doesn't exist yet). Target: any signed-in user can set timezone/date-format and see it reflected somewhere in the product. Measured via: a new settings-change PostHog event (matching this codebase's existing `_posthog.capture` convention).

**Theme toggle relocation — no usage regression.** Baseline: [UNKNOWN BASELINE] — no existing telemetry on topbar theme-toggle click frequency. Target: comparable or higher usage rate after relocation into Settings, not a silent drop-off. Measured via: a new click event on the relocated control, compared against a baseline capture window before the change ships.

**Original beta-reported friction resolved.** Baseline: 3 explicit asks from one real beta user (locale, plan management, theme location). Target: direct confirmation from that same beta user that the MVP scope addresses what he was actually looking for. Measured via: a follow-up conversation/message, not automated telemetry — this is a small-n, qualitative check appropriate for a single named beta reporter, not a statistical claim.

## Constraints

- Must reuse existing patterns in this codebase rather than inventing new ones — the tab structure, CSRF handling, and error-banner mechanism (`bse-s1`) already exist in `settings.js`; the theme-toggle logic (`swToggleTheme()`) already exists in `html-shell.js` and must not be broken by relocation.
- No compliance/regulatory driver identified — this is a beta-stage SaaS product improvement, not a regulated-industry requirement. (Note: `product/constraints.md` in this repo describes the skills-platform meta-tool's own constraints, not wuce's — not applicable here.)
- Solo-operator delivery capacity, same as every other feature this session — no dedicated design or backend team to draw on.
- Data model gap: no existing field stores per-person locale/theme preference — this needs a real schema decision at `/definition`, not assumed away here.

## Contributors

- Hamish King — Platform owner

## Reviewers

- Hamish King — Platform owner

## Approved By

Hamish King, Platform owner — 2026-08-17

---

**Next step:** Human review and approval → /benefit-metric

---

## Clarification log

[2026-08-17] Clarified via /clarify:
- Q: What does "locale" actually mean for MVP — timezone/date-format only, or does it need currency display too? A: Timezone + date format only. Currency stays hardcoded/USD for MVP — not in scope.
- Q: Should locale and theme preferences be stored per-person or per-tenant/org-wide? A: Per-person — each team member sets their own independently. No org-wide default or override mechanism in MVP.
- Q: Should this initiative include a live follow-up check with the beta user before locking MVP scope item 3 ("confirm plan management is genuinely closed")? A: No — proceed on the assumption that `bpe-s1`/`bse-s1`'s merged fixes likely satisfy the plan-management ask. Revisit only if he raises it again.

All 3 unconfirmed assumptions resolved. No new assumptions introduced by the answers — none require a `/decisions` entry (all 3 are scope clarifications, not architectural choices).

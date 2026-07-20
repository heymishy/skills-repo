# Discovery: Web UI Experience Redesign — Product View, Navigation, Settings, and Admin Impersonation

<!--
  USAGE: Produced by the /discovery skill. The structured outcome of early exploration —
  what problem we're solving, for whom, and what success looks like at the edges.

  Status must be "Approved" before /benefit-metric can proceed.
  MVP scope and out-of-scope fields are the primary review targets.

  To evolve: update this template, open a PR, tag BA lead + product lead.
-->

**Status:** Approved
**Created:** 2026-07-21
**Approved by:** Hamish King — Founder/Operator — 2026-07-21
**Author:** Claude (agent), synthesised from a live design session with the operator (mockups reacted to and confirmed in-session, not re-elicited via a fresh Q&A — see Contributors)

---

## Problem Statement

This discovery covers four related gaps, all surfaced in the same live design session while the operator worked through the product-rollup epic's own self-registered product on staging (the first product on this platform ever to reach real scale — 115 stories across roughly 48 epics):

1. **The product view does not work at scale.** `_renderProductView` in `src/web-ui/routes/products.js` renders test-coverage, AC-coverage, and taxonomy data as flat, ungrouped lists. At 115 stories this became, in the operator's own words, "hard to understand" — no visual health-at-a-glance, no sense of scale/complexity, no way to see how features relate to the actual product areas a person would reason about (e.g. "governance," "billing," "multi-tenancy"), and no visibility into work that exists only as a discovery or ideation artefact and hasn't become a tracked story yet.

2. **The left-hand navigation is stale and incomplete.** Three of six nav items (`Features`, `Actions`, `Status`) point to routes removed by a recent story (`kbc-s1`, kanban consolidation) — confirmed via direct code read of `src/web-ui/utils/html-shell.js`'s `NAV_ITEMS`. Meanwhile, four real, working routes have no nav entry at all: `/dashboard?view=board` (tenant kanban), `/org/kanban` (org kanban), and anything related to account/billing/admin settings.

3. **Account, billing, and admin-credit management exist in code but have no real UI.** Confirmed via direct code read: `handleGetLinkSettings` (account-linking.js) renders a literal unstyled `<h1>` with two bare links; `/settings/billing` silently redirects to Stripe's hosted portal; `adminCreditsGet` (admin-credits.js) renders bare unstyled HTML. None of the three use the shared shell, and nothing in the app links to any of them — they are reachable only by typing the exact URL.

4. **There is no way for the platform admin to see exactly what a specific user sees.** When a tenant reports an issue, the only options today are to trust the report at face value or query the database directly. There is no supported way to reproduce a user's exact permission-scoped view of the app.

---

## Who It Affects

- **Hamish King — Founder / Operator / platform admin.** Currently the platform's sole real user, in two distinct capacities: (a) as the operator managing products day-to-day, who hit the product-view scaling problem directly while reviewing the skills-framework product's own rollup; (b) as the platform's sole admin, who currently has no way to reproduce a specific tenant's reported issue other than direct database inspection, and whose account/billing management (linking a second sign-in method, checking plan status) currently requires typing bare URLs from memory.
- **A future tenant member** (a role, not yet a named individual — this platform's multi-tenancy and team-identity-roles work, `tir-s1` through `tir-s9`, already ships the capability to add other people to a tenant with individually assigned roles, but no second real person has been onboarded yet). This persona experiences the stale nav's dead links and the absent settings/billing home the first time they explore the app, and would be the actual reproduced identity behind any future admin impersonation session.

---

## Why Now

All four problems surfaced in the same sitting, directly from live use rather than speculative planning:

- The product-rollup epic (`2026-07-16-product-rollup`, `pr-s1` through `pr-s7`) and three follow-on short-track fixes had just been verified end-to-end on staging. The operator's own self-registered `skills-framework` product (connected to this very repo) was the first product on the platform ever to complete a real sync against a non-trivial `pipeline-state.json` — 115 stories, ~48 epics — because no other product had reached that scale before. The flat-list design had never been stress-tested at real scale until this exact moment.
- Investigating the product view surfaced the stale nav in the same pass (the operator was navigating the app live while reviewing the redesign).
- Reviewing what a fuller "account experience" would need (prompted by the nav gap) surfaced that account-linking, billing, and admin-credits all exist as real, working backend routes with zero real front-end investment — a gap that had simply never been prioritised because nothing forced attention onto it until now.
- The admin-impersonation need was named directly by the operator as a natural extension of the admin surface already being redesigned (Credits management) — recognising that support/debugging currently has no faithful reproduction path.

---

## MVP Scope

Four epics, all designed and mocked up (as working HTML/JS prototypes, reviewed and confirmed by the operator) in this same session:

**Epic A — Product View Redesign**
- A curated **Modules** taxonomy layered above epics. Confirmed via /clarify: **fully operator-curated per product, with no default/starter set** — every product begins with zero modules; the nine modules confirmed for `skills-framework` specifically (Web UI/Product Management, Governance & Gate Enforcement, Beta Readiness & Infrastructure, Multi-Tenancy & Isolation, Billing/Credits & Onboarding, Team Identity & Role Management, Definition Canvas & Story Mapping, Ideation & Assumption Tracking, Observability & Diagnostics) are specific to that product and do not generalise.
- Full CRUD on modules (create, rename, delete-with-reassignment-to-Unassigned) and drag/dropdown reassignment of epics between modules
- A **scale/complexity gauge** — total epic and story counts, plus a proportional distribution strip showing relative module sizes
- **Health shown as a signal distinct from test-coverage %.** Confirmed via /clarify: **this requires a real backend change, in MVP scope** — `computeHealthCounts` (`product-rollup.js`) must compute health per-feature, not only in aggregate, so the UI's two-signal display reflects a genuine independent signal rather than a coverage-derived stand-in. This is a materially larger scope than a rendering change alone (see Clarification log).
- A **Roadmap tab** surfacing discovery-only and ideation-only artefacts (work that exists on disk in `artefacts/` but has no entry in `pipeline-state.json` yet, and is therefore invisible to today's product view)

**Epic B — Navigation Fix**
- Remove the three dead nav items (`Features`, `Actions`, `Status`)
- `Home` gains an inline List/Board toggle (since `/dashboard?view=board` is an alternate view of the same tenant-level data as `/dashboard`, not a separate destination)
- Add `Org board` as its own nav item (`/org/kanban` currently has no nav entry)
- Move account-level items (`Settings`, and — admin-only — `Admin credits`) to a distinct section near the user identity block at the bottom of the sidebar, separate from the product-level nav above

**Epic C — Account Settings Page**
- One coherent Settings page (Profile / Billing / Credits-admin-only tabs) replacing three disconnected, unstyled orphan pages
- Profile: signed-in identity, linked sign-in methods (GitHub/Google) with a working "link" action
- Billing: current plan status as a real visual state (Trial/Paid, Active/Past due/Canceled), an upgrade path, and a "Manage billing" action to Stripe's existing hosted portal
- Credits (admin-only, conditionally visible): the existing tenant credit-balance table and top-up capability, restyled into the shared design system

**Epic D — Admin User Impersonation**
- Admin-only "act as" flow: search/pick a user, mandatory reason field (logged), start session
- A persistent, unmissable "Viewing as X — Exit" banner across the entire app while impersonating
- **Core security property:** while impersonating, the admin sees exactly what the target user would see — their nav, their permissions, nothing extra layered on from the real admin identity
- An audit trail of every impersonation session (who, whom, when, duration, reason)

---

## Out of Scope

- **Building the real `product_modules` database table and reassignment API.** This session's Modules CRUD was demonstrated as client-side JS state in a throwaway HTML mockup — the real schema, storage, and API design is /definition's job, not discovery's.
- **The Roadmap tab's full sync/cache pipeline** (a new `product_rollups` column computed by an extended `/product-sync`, matching the existing health/coverage/taxonomy sync pattern). Confirmed as the desired eventual architecture, but wiring it up is implementation work, deferred past this discovery.
- **Time-limiting, auto-expiry, or step-up re-authentication for impersonation sessions.** A plausible future hardening once the base capability exists, not committed to this MVP.
- **Grouping the AC-coverage breakdown by module/epic**, matching what this session did for test-coverage (F4). A natural follow-on, explicitly deferred so this discovery doesn't silently expand into a second full breakdown redesign.
- **Cross-product or platform-wide module taxonomies.** Modules are scoped as a per-product, operator-curated concept in this MVP — not a shared taxonomy applied across every product on the platform.
- **Unlinking an already-linked sign-in method.** Only *adding* a second method was designed this session; removal has its own edge cases (e.g. preventing someone from unlinking their only working sign-in method) that need separate scoping.

---

## Assumptions and Risks

All three assumptions originally flagged here were resolved via /clarify — see Clarification log below. Remaining risks:

**Risk:** this session's mockups are throwaway client-side JS prototypes reacted to visually — there is a real risk that the true data-model gaps (module storage, per-feature health computation, roadmap sync) are larger than they appear from a mockup, and /definition may need to re-scope the MVP once real schema constraints surface. The per-feature health decision in particular (confirmed in-scope, not deferred) increases this risk — it touches `product-rollup.js`'s core aggregation logic, not just the rendering layer.

**Risk (highest in this discovery):** Admin User Impersonation, implemented carelessly, could allow privilege leakage — e.g. a bug where "acting as" a lower-privileged user leaves some residual real-admin capability reachable. This is the single item in this discovery that must receive an explicit NFR-security review at /definition and again at /definition-of-ready before any implementation begins, and should not be treated as a routine UI story.

---

## Directional Success Indicators

**Time to identify the least-healthy area of a large product.** Baseline: `[UNKNOWN BASELINE]` — no product has been used at this scale before this session; qualitatively, the operator described the current flat-list view as "hard to understand" on first encountering it at 115 stories. Target: an operator can identify the least-healthy module within 10 seconds of landing on the product page. Measured via: a manual timed walkthrough performed at DoD verification (no page-analytics instrumentation exists yet to automate this).

**Nav dead-link rate.** Baseline: 3 of 6 nav items (50%) point to routes that no longer exist. Target: 0. Measured via: a repo-wide test asserting every `NAV_ITEMS` `href` resolves to a currently-registered server route — extending this repo's own established dangling-reference-sweep pattern (used by `kbc-s1`'s AC5).

**Settings/account discoverability.** Baseline: 0 — account-linking, billing, and admin-credits are reachable only by typing their exact URL; nothing in the app links to any of them today. Target: 100% reachable within one click from the sidebar for every user the route applies to (Settings for all signed-in users; Admin credits additionally for admins). Measured via: a Playwright e2e test asserting each route is reachable via a real click path starting from the dashboard.

**Impersonation audit completeness.** Baseline: 0 — no impersonation capability exists today. Target: 100% of impersonation start/end events produce a corresponding audit log entry; no code path can start a session without one being logged. Measured via: a dedicated integration test on the impersonation route handler asserting this invariant directly, not just that a UI element exists.

---

## Constraints

- Must reuse the existing shared shell (`src/web-ui/utils/html-shell.js`) and its established design tokens and light/dark theme mechanism — not introduce a second, parallel styling system.
- The three existing routes being restyled (account-linking, billing-portal redirect, admin-credits) keep their current underlying handler logic as-is; this is a presentation/IA layer on top, not a rewrite — except where Impersonation genuinely requires new session-handling logic.
- Admin User Impersonation must preserve this repo's own established canonical session-field rule (`req.session.accessToken`, never `.token`) and must not weaken the existing `requireAdmin` gate anywhere else in the app.
- Confirmed via /clarify: the impersonation audit log is **admin-visible only, kept indefinitely, and the impersonated user is not notified** — matching the existing `credit_audit_log` convention's visibility bar. No secondary reviewer role or user-facing notification mechanism is in scope.
- Solo-operator team capability constraint: this repo has one primary human operator and no dedicated security review team. The NFR-security review for Impersonation will be operator-led, drawing on this repo's own established patterns (D37 injectable adapters, D40 conflict-marker verification, the existing `credit_audit_log` convention) rather than inventing a new review process from scratch.
- No new paid infrastructure — everything must run within the existing `wuce-staging` / `skills-framework` Fly.io + Neon Postgres + Upstash Redis stack already in place.

---

## Clarification log

[2026-07-21] Clarified via /clarify:
- Q: Is the nine-module taxonomy specific to skills-framework, or should every product get a default/starter set of modules?  A: Fully operator-curated, no defaults — every product starts with zero modules.
- Q: Does per-feature health need a real new backend signal distinct from test coverage, or is that future work?  A: Real backend change, in MVP scope — `computeHealthCounts` must compute health per-feature, not only in aggregate. **This materially expands Epic A's scope** from a rendering-only change to a backend aggregation change; flagged as a new consideration for /benefit-metric and /definition, not merely a resolved assumption.
- Q: What's the audit/visibility bar for the impersonation log?  A: Admin-visible only, indefinite retention, no target-user notification — matching the existing `credit_audit_log` pattern.

---

## Contributors

- Hamish King — Founder / Operator (drove every design decision across the session: reacted to and confirmed each mockup, confirmed the module taxonomy and the Workforce Planning exclusion, chose full user impersonation over tenant-context-switching, requested this outer-loop pass)
- Claude (agent) — synthesised this discovery artefact directly from the session's design conversation and working mockups, rather than re-eliciting the same answers via a fresh Q&A

## Reviewers

- [Pending — recommend the operator review this artefact directly before approval, given no other reviewer currently exists on this platform]

## Approved By

Hamish King — Founder/Operator — 2026-07-21

---

**Next step:** Human review and approval → /benefit-metric

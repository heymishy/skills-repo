# Discovery: Beta Entry Experience

**Feature slug:** 2026-06-29-beta-entry-experience
**Status:** Approved
**Date:** 2026-06-29
**Artefact path:** artefacts/2026-06-29-beta-entry-experience/discovery.md

---

## Problem statement

Any non-Hamish user visiting `skills-framework.fly.dev` today encounters one of two dead ends.

**Dead end A — GitHub OAuth with no context.** The root URL immediately redirects to GitHub login. There is no public-facing explanation of what the product is, who it is for, or what the user is about to authenticate into. A developer Hamish invites to try the platform has no frame of reference before the OAuth redirect fires.

**Dead end B — Empty dashboard with no guidance.** After successful login, a user who has never created a journey sees an empty dashboard with no explanation of what a "journey" is, how to start one, or what happens next. No skill names are surfaced, no example output is shown, no first step is suggested.

**No invite mechanism exists.** Onboarding a beta user today requires Hamish to manually modify the `TENANT_ORG_ALLOWLIST` fly secret via console access, or rely on the current solo mode where any GitHub-authenticated user is admitted (with a 5-journey cap as the only control). There is no way for an invited user to signal intent to join, no way for Hamish to control admission without console access, and no confirmation to the user that they are expected or that access has been granted.

**Cost when unresolved:** Beta user recruitment is blocked. Every developer Hamish invites encounters immediate confusion — a raw OAuth redirect with no product context — and most will bounce before completing login. The `M2` (cross-tenant journey leakage prevention) metric in the `wuce-multi-tenancy` feature remains `not-yet-measured` because no second tenant has ever been onboarded: the missing entry experience is the direct blocker to that measurement.

---

## Personas

### Beta developer (primary)
A software developer or engineer who Hamish has invited to evaluate the skills platform. They are GitHub-proficient but have no prior exposure to the skills pipeline or its concepts (journeys, skill sessions, outer loop). They arrive at the URL from a direct message — "try this out" — and must immediately decide whether to invest 15 minutes understanding the product. If the first screen is a raw GitHub OAuth redirect with no product context, they will likely dismiss it as low-signal and not return.

**When they encounter this:** At the very first visit, before any session is established.
**Cost:** Loss of beta participant; no usage signal for the platform; no M2 measurement opportunity.

### Beta tech lead (secondary)
A tech lead or squad lead who Hamish has specifically targeted as a potential adopter. More motivated than a random developer, but equally context-blind on first visit. Their evaluation question — "Is this right for my team?" — cannot be answered from a GitHub OAuth prompt. They need the product's value proposition in 10 seconds.

**When they encounter this:** First visit, pre-auth.
**Cost:** Deferred evaluation; likely not returning without a follow-up prompt from Hamish.

### Hamish King — operator and sole beta admin (internal)
Currently the only mechanism to admit users is console access to fly secrets. At beta scale beyond 2–3 users this is unsustainable. Every new user requires a direct intervention, and there is no audit trail of who has been admitted or when.

**When this costs time:** Every new invite; every access revocation.
**Cost:** Operational friction that scales linearly with invite volume; no record of who has access.

---

## Why now

The `wuce-multi-tenancy` feature reached `definition-of-done` on 2026-06-29 with all 17 stories complete and production live at `skills-framework.fly.dev`. The platform is technically capable of serving multiple tenants with full data isolation, rate limiting, and path-traversal protection. The entry experience is the only remaining blocker to onboarding real beta users.

Three forcing functions make this urgent now rather than later:

1. **M2 metric is blocked.** The `wuce-multi-tenancy` feature's cross-tenant isolation metric (`M2`) cannot be measured in production until a second tenant is onboarded. The entry experience is the direct prerequisite.
2. **The beta window is open.** The system is deployed, monitored, and stable. Every week without real beta users is a week without empirical signal to inform the roadmap for Group 2 (instrumentation, profile page, journey list filter) and Group 3 (billing, self-serve).
3. **Group 2 and Group 3 planning needs usage data.** Decisions about what to build next — PostHog funnel targets, profile page scope, Stripe tier design — are being made without any non-Hamish user behaviour as input.

---

## MVP scope

The smallest set of changes that enables Hamish to invite a developer, have them arrive and understand the product, authenticate, and complete their first skill session unassisted — without Hamish needing to be present or intervening.

**1. Public landing page at `/` (unauthenticated)**
A static page served to any visitor who is not logged in. Contains: a one-paragraph explanation of what the skills platform is and what it does, what a "skill session" means in plain terms, and a single CTA — "Sign in with GitHub to try it." No marketing copy, no imagery requirements, no dynamic content. The existing `/auth/github` redirect is moved behind this page rather than firing on the root URL.

**2. First-run / empty-state experience (authenticated, zero journeys)**
When a newly-authenticated user has no journeys, the dashboard shows a guided empty state instead of a blank list. Explains: what to do first (pick a skill), what a journey produces, what the dashboard will look like after the first session. A direct link to the skill picker. This is a static HTML state — not an interactive walkthrough.

**3. PostHog instrumentation — referral tracking and lead visibility**
PostHog loaded via CDN `<script>` tag on the landing page (pre-auth) and the authenticated dashboard (post-auth). No npm dependency; no server-side change beyond injecting the snippet into the HTML templates. Scope:

- **UTM capture** — Hamish embeds UTM params in shared URLs (`?utm_source=linkedin&utm_medium=post`). PostHog captures these on landing page load and associates the referral channel with the subsequent GitHub login.
- **Person identification post-auth** — after OAuth succeeds, call `posthog.identify(githubLogin, { tenant_id, referral: utm_source })`. Links the anonymous landing visit to a named GitHub user. Hamish gets a named list in PostHog Persons: who signed up, when, and from which channel.
- **Funnel events** — `landing_page_view`, `cta_clicked`, `session_started`, `journey_completed`. Replaces fly-log proxy counting for S3 with a proper conversion funnel.
- **Lead and opportunity management** — PostHog Persons view is a lightweight beta user registry. Hamish can identify high-engagement users, filter by referral source, and flag individuals to follow up with — without building a CRM. Properties can be annotated manually in PostHog (e.g., `status: contacted`, `channel: twitter`).

PostHog project API key is a public frontend key — it belongs in HTML, not in fly secrets.

**4. Beta admission model — open (Option B, decided 2026-06-29)**
Any GitHub-authenticated user who reaches the URL is admitted. The existing solo mode (`TENANT_ORG_ALLOWLIST` empty) already implements this. No admission code change is required. The 5-journey cap per tenant is the soft access control. Hamish controls reach by controlling how widely the URL is shared. This enables organic growth (share-via-DM, word of mouth, social post) without requiring per-user console intervention.

No code change to the OAuth callback or admission logic. Landing page and empty-state are the only src/ changes in this feature.

---

## Out of scope

1. **Self-serve signup or waitlist form** — users cannot sign themselves up or join a queue in a managed funnel. Any GitHub user can log in (open admission), but there is no email verification, waitlist, or managed onboarding flow. A self-service funnel with Stripe gating is a Group 3 item.

2. **Profile page or account management** — no profile editing, avatar display, display name, or account settings. These are Group 2 items.

3. **Email-based invite links or magic links** — no outbound email, SMTP integration, or token-based invite URLs. Any invite mechanism in this feature is GitHub-username-based, consistent with the existing GitHub OAuth identity model and the zero-new-dependency constraint.

4. **PostHog custom dashboards, cohort analysis, feature flags, or server-side event tracking** — basic client-side instrumentation (CDN snippet, UTM capture, person identification, funnel events) is in scope. Advanced PostHog features and server-side event emission are deferred to Group 2.

5. **Organisation-based onboarding flow** — the existing `TENANT_ORG_ALLOWLIST` org-membership check remains. This feature does not build an org-level onboarding wizard or admin panel. Org mode activation remains a manual fly secret change.

6. **Interactive onboarding tutorial or product tour** — the first-run experience is a static empty-state page. A guided, interactive walkthrough (tooltips, hotspots, step-by-step modal) is a future enhancement beyond this feature.

---

## Assumptions and risks

[ASSUMPTION] The landing page can be authored as inline HTML or a static file in `src/web-ui/public/` without a template engine — consistent with the existing zero-dependency architecture but not explicitly confirmed for this surface.

[ASSUMPTION] First-run detection (zero journeys) can be determined server-side at the dashboard handler via the existing `listJourneys()` adapter call — likely true given the current codebase, but the empty-state render branch has not been validated.

**Pre-deployment prerequisite — PostHog account:** Hamish to create a PostHog Cloud account and project before deployment (confirmed 2026-06-29 — account does not yet exist). The project API key (public frontend key) is embedded in the landing page HTML at deploy time. This is an operational action, not a scoping uncertainty — it does not affect story ACs or scope boundaries.

**Risk — landing page copy accuracy:** The product description must represent current capabilities, not aspirational ones. Overclaiming is a reputational risk with beta developers who will immediately discover the gap. Mitigated by Hamish reviewing all copy before deployment.

**Risk — returning users with zero journeys:** A user who has deleted all their journeys sees the first-run empty state. Acceptable at beta scale; revisit when delete-journey is a supported flow.

**Risk — PostHog data residency:** PostHog Cloud stores event data on its servers (EU or US region). For a non-regulated personal project at beta scale this is acceptable. If future enterprise or regulated customers become a target persona, data residency for analytics will need to be revisited. No action required now.

---

## Directional success indicators

**S1 — First external user completes a skill session unassisted**
Baseline: 0 non-Hamish users have ever successfully completed a skill session in production (as of 2026-06-29).
Target: ≥ 1 external beta user completes a full skill session from cold start within 2 weeks of this feature being deployed.
Measured via: Fly.io logs — distinct `tenant_id` value other than Hamish's GitHub login with at least one journey-completion event.

**S2 — M2 cross-tenant metric moves to `on-track`**
Baseline: `not-yet-measured` (wuce-multi-tenancy feature DoD, 2026-06-29).
Target: M2 transitions to `on-track` after the first org-based beta user is onboarded and a cross-tenant access attempt is confirmed to return 404.
Measured via: M2 signal field in `.github/pipeline-state.json` updated after manual verification.

**S3 — Public landing page to login conversion**
Baseline: [UNKNOWN BASELINE] — root URL currently redirects immediately; no conversion data exists.
Target: ≥ 50% of unique visitors to `/` proceed to GitHub OAuth within the same session.
Measured via: PostHog funnel (`landing_page_view` → `cta_clicked` → `login_completed`). No fly-log proxying required once PostHog is instrumented.

**S4 — Referral source visibility**
Baseline: 0 — no referral attribution data exists today.
Target: ≥ 80% of beta sign-ups have a known referral source (PostHog `utm_source` property set on the Person record).
Measured via: PostHog Persons view — count of identified users with `utm_source` set vs total identified users. Hamish drives this by always sharing UTM-tagged URLs.

---

## Constraints

- **Node.js CommonJS only** — `require()`, no ES modules, no TypeScript. Landing page HTML served from an existing or new route handler in `src/web-ui/routes/`.
- **Zero new npm dependencies** — HTML and CSS only for the landing page and empty state. No template engine, no Markdown-to-HTML renderer, no CSS framework dependency.
- **No Express** — `http.createServer()` URL dispatch via `pathname.match()`. The landing page handler is added to the existing router pattern in `src/web-ui/server.js`.
- **Path traversal guard** — any static file served for the landing page must use a hardcoded path (not derived from request input). The `path.resolve + startsWith(repoRoot)` guard applies if a file path is assembled dynamically.
- **`req.session.accessToken` is canonical** — no change to the OAuth session structure. The landing page serves unauthenticated users; it does not read session data.
- **`TENANT_ORG_ALLOWLIST` must remain functional** — open admission is additive; the existing org-based check is not removed or weakened.
- **Single Fly.io machine** — no horizontal scaling concerns at beta. Session stickiness (`sticky_sessions = true`) is already in place.
- **PostHog via CDN only** — PostHog JS loaded from PostHog's CDN (EU region recommended). No npm package. No server-side PostHog SDK. The project API key is a public frontend key and does not go in fly secrets.

---

## EA registry

No EA registry entry found for `skills-framework`. Proceeding without blast-radius data — this does not block discovery. (EA registry local path checked: `C:/Users/Hamis/code/ea-registry-repo`; no application entries present.)

---

## /clarify recommendation

This discovery contains 2 unconfirmed assumptions that affect scope. Both are low-risk technical confirmations — run `/clarify` to resolve before locking scope for `/benefit-metric`:

- [ASSUMPTION] The landing page can be authored as inline HTML or a static file in `src/web-ui/public/` without a template engine.
- [ASSUMPTION] First-run empty-state detection can be done server-side at the dashboard handler using the existing `listJourneys()` adapter.

---

## Attribution

**Contributors:**
- Hamish King — Platform operator / product owner — 2026-06-29

**Reviewers:**
- Pending

**Approved By:**
- Hamish King — Platform operator / product owner — 2026-06-29

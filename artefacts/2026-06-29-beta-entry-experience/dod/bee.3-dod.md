# Definition of Done: bee.3 — PostHog instrumentation

**PR:** #422 feat(bee.3): PostHog instrumentation (landing, dashboard, chat) | **Merged:** 2026-06-29
**Story:** artefacts/2026-06-29-beta-entry-experience/stories/bee.3.md
**Test plan:** artefacts/2026-06-29-beta-entry-experience/test-plans/bee.3-test-plan.md
**DoR artefact:** artefacts/2026-06-29-beta-entry-experience/dor/bee.3-dor.md
**Assessed by:** /definition-of-done skill (agent-auto)
**Date:** 2026-06-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | T1 (CDN snippet with key in landing page), T2 (async attribute present) | Automated — check-bee3-posthog.js | None |
| AC2 | ✅ | T9 (CDN snippet with key + async in dashboard HTML) | Automated — check-bee3-posthog.js | None |
| AC3 | ✅ | T5 (posthog.capture('landing_page_view') present when key set), T6 (absent when key unset) | Automated — check-bee3-posthog.js | None |
| AC4 | ⚠️ | T7 (posthog.capture('cta_clicked') present + typeof guard asserted in HTML), T8 (absent when key unset); in-browser non-blocking navigation not yet verified | Automated (typeof guard) + pending manual scenario | Deviation: manual browser test (Scenario 4 in bee.3-verification.md) not yet executed — PostHog CDN blocked, CTA navigation verified not blocked. Typeof guard asserted at code level. |
| AC5 | ✅ | T10 (posthog.identify('alice', {tenant_id:'org-1'}) in HTML), T11 (canary: 'SECRET_GITHUB_TOKEN' absent from HTML; only login present) | Automated — check-bee3-posthog.js | None |
| AC6 | ✅ | T12 (posthog.capture('login_completed') after identify call) | Automated — check-bee3-posthog.js | None |
| AC7 | ✅ | T14 (posthog.capture('journey_created') in chat page HTML when key set), T15 (absent when key unset) | Automated — check-bee3-posthog.js | None |
| AC8 | ✅ | T3 (key unset → no posthog reference), T4 (empty string → no posthog reference), T13 (dashboard: no posthog when key unset) | Automated — check-bee3-posthog.js | None |
| AC9 | ✅ | T16 — package.json dependencies and devDependencies contain no /posthog/i match | Automated — check-bee3-posthog.js | None |

---

## Scope Deviations

None. Server-side PostHog SDK, feature flags, session recordings, A/B testing, and any analytics platform other than PostHog were all absent from the merged implementation, as required.

---

## Test Plan Coverage

**Tests from plan implemented:** 18/18 (T1–T16 unit + NFR-T1, NFR-T2, NFR-T3)
**Tests passing in CI:** 18/18 (27 assertions)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 — CDN snippet in landing with key | ✅ | ✅ | |
| T2 — async attribute | ✅ | ✅ | |
| T3 — no posthog when key unset (landing) | ✅ | ✅ | |
| T4 — no posthog on empty string key | ✅ | ✅ | |
| T5 — landing_page_view capture present | ✅ | ✅ | |
| T6 — landing_page_view absent when key unset | ✅ | ✅ | |
| T7 — cta_clicked + typeof guard | ✅ | ✅ | |
| T8 — cta_clicked absent when key unset | ✅ | ✅ | |
| T9 — CDN snippet in dashboard | ✅ | ✅ | |
| T10 — posthog.identify with login + tenant_id | ✅ | ✅ | |
| T11 — canary: accessToken not in dashboard HTML | ✅ | ✅ | Critical security test — uses SECRET_GITHUB_TOKEN_CANARY |
| T12 — login_completed after identify | ✅ | ✅ | |
| T13 — no posthog in dashboard when key unset | ✅ | ✅ | |
| T14 — journey_created in chat page | ✅ | ✅ | |
| T15 — journey_created absent when key unset | ✅ | ✅ | |
| T16 — no posthog npm package | ✅ | ✅ | |
| NFR-T1 — no accessToken in any HTML response | ✅ | ✅ | Canary pattern in T11 |
| NFR-T2 — no posthog.* ref when key unset | ✅ | ✅ | Covered by T3/T4/T13 |
| NFR-T3 — async attribute on CDN script | ✅ | ✅ | Covered by T2/T9 |

**Gaps:**
- AC4 manual browser test (Scenario 4): in-browser verification that CTA navigation is not blocked when PostHog CDN is unreachable. Deferred to post-deployment smoke test. Risk is mitigated at code level: typeof guard asserted by T7; when key is unset, no posthog.* calls are emitted (T8). Risk: LOW.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| PostHog CDN script loaded with async attribute | ✅ | T2 and T9 assert async attribute present in script tag when POSTHOG_KEY set |
| No JavaScript error when POSTHOG_KEY unset | ✅ | T3/T4/T13 confirm zero posthog.* references in HTML when key unset; no orphaned calls that could throw ReferenceError |
| No personal data beyond login + tenantId sent to PostHog | ✅ | T11 (canary test) confirms req.session.accessToken never in HTML; only login and tenantId are server-injected |

---

## Layout Gap Audit (B2)

AC4 has a DOM-behaviour gap (not a CSS-layout gap): manual browser verification of CTA navigation not blocked when PostHog CDN is unavailable. This is not a CSS-layout-dependent AC. The gap is mitigated at code level by the typeof guard. A RISK-ACCEPT entry is not required per B2 (which applies to CSS-layout ACs). The gap is recorded here as a follow-up action.

---

## Metric Signal

| Metric | Signal | Evidence note | Date measured |
|--------|--------|---------------|---------------|
| M1 — Beta activation rate | not-yet-measured | Feature deployed 2026-06-30. PostHog account not yet created. Once PostHog Cloud (EU) account exists and POSTHOG_KEY is set, journey_completed events will populate the funnel. No external users exist yet. | null |
| M3 — Landing page conversion rate | not-yet-measured | PostHog account not yet created. No landing_page_view or cta_clicked events recorded. Measurement becomes possible once POSTHOG_KEY is set as a Fly env var. First meaningful signal after >=10 unique visitors. | null |
| M4 — Referral attribution coverage | not-yet-measured | PostHog account not yet created. No person identification events or UTM captures recorded. Measurement requires PostHog Cloud account + first identified user. | null |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Deviations:**
1. AC4 in-browser manual verification (Scenario 4 — CTA navigation not blocked when PostHog CDN blocked) not yet executed. Code-level typeof guard asserted by T7. Risk: LOW.

**Follow-up actions:**
- Run bee.3-verification.md Scenario 4 post-deployment: block PostHog CDN in browser devtools → verify CTA navigates to /auth/github without JS error. Record result. (owner: Hamish King, timing: before first external user promotion)
- Create PostHog Cloud (EU) account, obtain project API key, set `POSTHOG_KEY` as Fly env var via `fly secrets set` ... wait — POSTHOG_KEY is NOT a fly secret (DEC-003), it is a fly env var: `fly env set POSTHOG_KEY=<key>`. (owner: Hamish King, blocking for M3/M4)
- Once PostHog is active and first external user signs up: verify posthog.identify() is correctly linking users to PostHog Persons with utm_source properties for M4 coverage. (owner: Hamish King)

---

## DoD Observations

1. T11 (canary security test) is the critical regression guard for the accessToken-in-HTML vulnerability. The canary value `SECRET_GITHUB_TOKEN_CANARY` was used as the req.session.accessToken in the test, and its absence from HTML was asserted. This pattern should be propagated to any future story that injects session values into HTML.
2. The `buildDashboardPostHogScript` helper intentionally omits the req.session.accessToken parameter — only `key`, `login`, and `tenantId` are accepted. The function signature is the architectural enforcement point; T11 is the test enforcement point.
3. bee.3 merged after bee.1 and bee.2, as required by its dependency on both. The merge-conflict resolution (keeping bee.3's PostHog additions over master's plain bee.1+bee.2 base) was straightforward — all conflicts were HEAD-wins.

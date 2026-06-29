# Definition of Done: bee.1 — Public landing page

**PR:** #420 feat(bee.1): public landing page with GitHub auth CTA | **Merged:** 2026-06-29
**Story:** artefacts/2026-06-29-beta-entry-experience/stories/bee.1.md
**Test plan:** artefacts/2026-06-29-beta-entry-experience/test-plans/bee.1-test-plan.md
**DoR artefact:** artefacts/2026-06-29-beta-entry-experience/dor/bee.1-dor.md
**Assessed by:** /definition-of-done skill (agent-auto)
**Date:** 2026-06-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | T1 (200 status), T2 (product name + CTA href="/auth/github"), T10 (dispatch integration) | Automated — check-bee1-landing-page.js | None |
| AC2 | ✅ | T3 (302 to /journeys), T4 (req.session.token not treated as authenticated), T9 (full session → 302) | Automated — check-bee1-landing-page.js | None |
| AC3 | ✅ | T5 (no CDN CSS URLs), T6 (page usable after script removal) | Automated — check-bee1-landing-page.js | None |
| AC4 | ✅ | T2 (product name + CTA text), T7 (platform description + "governed artefact" description) | Automated — check-bee1-landing-page.js | None |
| AC5 | ✅ | T10 (GET / dispatch), T11 (GET /health still 200); /auth/github 302 and /journeys 200 confirmed at system level with bee.2 + wuce deployed | Automated (health + dispatch) + system verification post bee.2/bee.3 deploy | None — AC5 full route gap noted at plan time resolved by bee.2 deployment |
| AC6 | ✅ | T8 — source inspection confirms no req.url/req.params in path.join or readFileSync; path uses __dirname + literal 'landing.html' | Automated — check-bee1-landing-page.js | None |

---

## Scope Deviations

None. PostHog snippet (bee.3 scope), styling beyond legibility, /about page, and OAuth flow changes were all absent from the merged implementation, as required.

---

## Test Plan Coverage

**Tests from plan implemented:** 11/11 unit+integration tests + 2 NFR tests
**Tests passing in CI:** 11/11 (25 assertions)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 — unauthenticated 200 | ✅ | ✅ | |
| T2 — body contains product name + CTA | ✅ | ✅ | |
| T3 — authenticated → 302 /journeys | ✅ | ✅ | |
| T4 — req.session.token not treated as authenticated | ✅ | ✅ | |
| T5 — no CDN CSS framework URLs | ✅ | ✅ | |
| T6 — renders without script blocks | ✅ | ✅ | |
| T7 — platform description + skill session description | ✅ | ✅ | |
| T8 — path uses __dirname literal | ✅ | ✅ | |
| T9 — 302 with full session | ✅ | ✅ | |
| T10 — route dispatch integration | ✅ | ✅ | |
| T11 — GET /health unaffected | ✅ | ✅ | |
| NFR-T1 — no external calls | ✅ | ✅ | Rolled into 25 assertions |
| NFR-T2 — balanced HTML tags | ✅ | ✅ | Rolled into 25 assertions |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Landing page responds <200ms | ✅ | Handler reads HTML at module init (synchronous, no network I/O per request); NFR-T1 asserts no external calls |
| HTML response valid (no unclosed tags) | ✅ | NFR-T2 asserts balanced html/body/head/title open+close counts |
| No external network calls in handler | ✅ | NFR-T1 spy confirms zero http/fetch calls during handler execution |

---

## Metric Signal

| Metric | Signal | Evidence note | Date measured |
|--------|--------|---------------|---------------|
| M1 — Beta activation rate | not-yet-measured | Feature deployed 2026-06-30. No external users have signed up yet. PostHog account pending creation; measurement will be via PostHog `journey_completed` events. | null |
| M3 — Landing page conversion rate | not-yet-measured | PostHog account not yet created. No `landing_page_view` or `cta_clicked` events recorded. Measurement becomes possible once PostHog Cloud (EU) account and project are created and POSTHOG_KEY is set as a Fly env var. | null |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
- Create PostHog Cloud (EU) account and set `POSTHOG_KEY` as Fly env var — prerequisite for M3 measurement (owner: Hamish King)
- Run bee.3-verification.md Scenario 4 (CTA navigation when PostHog CDN blocked) — pending manual browser test post-deployment (owner: Hamish King)

---

## DoD Observations

1. AC5 full route regression gap (noted in test plan — required bee.2 for /journeys route) is now resolved: bee.2 deployed in PR #421, /journeys route live. The test plan gap was correctly scoped and closed naturally by delivery sequencing.
2. The `req.session.token` guard in T4 is the canonical test that the coding standard (`req.session.accessToken`) is enforced in the landing page handler. This pattern should be in every DoD for routes that check authenticated state.

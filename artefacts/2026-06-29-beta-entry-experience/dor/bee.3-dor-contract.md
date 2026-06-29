# DoR Contract — bee.3 — PostHog instrumentation

**Story:** `artefacts/2026-06-29-beta-entry-experience/stories/bee.3.md`
**Date:** 2026-06-29
**Status:** Approved

---

## What will be built

- `src/web-ui/routes/landing.js` updated — conditionally inject PostHog CDN `<script async src="https://eu-assets.i.posthog.com/static/array.js">` snippet with `POSTHOG_KEY` embedded when `process.env.POSTHOG_KEY` is set and non-empty. Inject inline `<script>` after the snippet with: `posthog.capture('landing_page_view')` on load and `posthog.capture('cta_clicked')` on CTA click (with `typeof posthog !== 'undefined'` guard for cta_clicked). When `POSTHOG_KEY` is unset or empty string: omit all PostHog references (no snippet, no inline script).
- `src/web-ui/routes/journey.js` updated — same conditional logic: inject PostHog CDN snippet + inline `<script>` calling `posthog.identify(login, { tenant_id: tenantId })` then `posthog.capture('login_completed')`. Values server-injected from `req.session.login` and `req.session.tenantId`.
- `src/web-ui/routes/skills.js` updated — `handleGetChatHtml` conditionally injects inline `<script>` calling `posthog.capture('journey_created')` (with POSTHOG_KEY guard) in the `GET /skills/:name/sessions/:id/chat` response HTML.
- `POSTHOG_KEY` read as `process.env.POSTHOG_KEY` in each handler. Empty string treated same as unset — no snippet injected.

## What will NOT be built

- PostHog npm package (`posthog-js`, `posthog-node`) — CDN only, no require()
- PostHog server-side event tracking (no Node.js SDK)
- PostHog feature flags, session recordings, cohort analysis, A/B tests, custom dashboards
- Any analytics platform other than PostHog

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — CDN snippet in landing page when key set | T1, T2: call `handleLanding` with `POSTHOG_KEY='phc_test123'`; assert body contains key value + CDN reference + async attribute | Unit |
| AC2 — CDN snippet in dashboard when key set | T9: call `handleJourneys` with key set; assert snippet + key in body | Unit |
| AC3 — landing_page_view capture on landing page | T5: assert `posthog.capture('landing_page_view')` in body when key set | Unit |
| AC4 — cta_clicked capture on CTA; navigation not blocked | T7: assert capture call + typeof guard; edge case manual scenario in verification script | Unit + Manual 🔴 |
| AC5 — posthog.identify(login, {tenant_id}) in dashboard | T10, T11: assert identify call with 'alice' as distinct_id; canary token 'SECRET_GITHUB_TOKEN_CANARY' absent from body | Unit |
| AC6 — login_completed after identify | T12: assert capture call; assert loginCompleted index > identify index in body | Unit |
| AC7 — journey_created in GET /skills/:name/sessions/:id/chat HTML | T14: call `handleGetChatHtml`; assert `posthog.capture('journey_created')` in body | Unit |
| AC8 — POSTHOG_KEY from env; unset/empty → no snippet | T3, T4, T6, T8, T13, T15: assert no `posthog.` reference in any response when key absent | Unit |
| AC9 — no posthog npm package | T16: parse package.json; assert no posthog key in dependencies or devDependencies | Unit |

## Assumptions

- `handleGetChatHtml` in `src/web-ui/routes/skills.js` is the handler for `GET /skills/:name/sessions/:id/chat` (confirmed from server.js routing)
- `req.session.login` and `req.session.tenantId` are set by the OAuth callback and available on all authenticated requests
- PostHog EU CDN URL: `https://eu-assets.i.posthog.com/static/array.js` (or equivalent PostHog CDN snippet from posthog.com docs). If using standard PostHog snippet, it includes the stub array — `typeof posthog` guard is still added for cta_clicked as belt-and-suspenders.
- Implementation approach for graceful degradation: server-side conditional omission (all posthog references omitted when POSTHOG_KEY unset) — simpler than per-call typeof guards

## Estimated touch points

Files: `src/web-ui/routes/landing.js`, `src/web-ui/routes/journey.js`, `src/web-ui/routes/skills.js`
Services: None (string injection — no network calls in handler)
APIs: None

## schemaDepends

[] — bee.3 depends on bee.1 and bee.2 to exist before PostHog events are testable end-to-end, but consumes no specific pipeline-state schema fields from either upstream story

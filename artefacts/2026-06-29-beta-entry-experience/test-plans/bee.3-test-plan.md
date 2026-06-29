# Test Plan: bee.3 — PostHog instrumentation

**Story reference:** `artefacts/2026-06-29-beta-entry-experience/stories/bee.3.md`
**Epic reference:** `artefacts/2026-06-29-beta-entry-experience/epics/bee-entry-surface.md`
**Test plan author:** /test-plan skill (agent-auto)
**Date:** 2026-06-29

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | POSTHOG_KEY set → PostHog CDN snippet in landing page HTML | 2 tests | — | — | — | — | 🟢 |
| AC2 | POSTHOG_KEY set → PostHog CDN snippet in dashboard HTML | 2 tests | — | — | — | — | 🟢 |
| AC3 | landing_page_view capture call in landing page HTML | 2 tests | — | — | — | — | 🟢 |
| AC4 | cta_clicked capture call on CTA element; navigation not blocked | 3 tests | — | — | 1 scenario | — | 🟡 |
| AC5 | posthog.identify(login, { tenant_id }) in dashboard HTML; server-side values | 3 tests | — | — | — | — | 🟢 |
| AC6 | login_completed capture call after identify in dashboard HTML | 2 tests | — | — | — | — | 🟢 |
| AC7 | journey_created capture call in GET /skills/:name/sessions/:id/chat HTML | 2 tests | — | — | — | — | 🟢 |
| AC8 | POSTHOG_KEY from process.env; unset → no snippet in any page | 4 tests | — | — | — | — | 🟢 |
| AC9 | No posthog npm package in package.json | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| CTA click does not block navigation when PostHog is unavailable in a real browser | AC4 | DOM-behaviour | Cannot execute JS or simulate click events in Node.js without a browser; `typeof posthog` guard is assertable on HTML string | Manual scenario in bee.3-verification.md verifies non-blocking navigation with PostHog absent |

---

## Test Data Strategy

**Source:** Synthetic — test data generated inline; route handlers called directly with mock req/res
**PCI/sensitivity in scope:** No — only login (GitHub username) and tenantId are injected; neither is sensitive
**Availability:** Available now
**Owner:** Self-contained — tests use process.env stubs and mock sessions

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1–AC4 | POSTHOG_KEY set / unset; unauthenticated session | Inline mock + process.env | None | Set/delete `process.env.POSTHOG_KEY` per test |
| AC5–AC6 | Authenticated session with login + tenantId; POSTHOG_KEY set | Inline mock | None | `{ accessToken: 'tok', login: 'alice', tenantId: 'org-1' }` |
| AC7 | Chat page handler for GET /skills/:name/sessions/:id/chat; POSTHOG_KEY set | Inline mock | None | Requires chat page handler to be loadable |
| AC8 | POSTHOG_KEY unset | `delete process.env.POSTHOG_KEY` | None | |
| AC9 | package.json | fs.readFileSync | None | Verify no posthog keys in dependencies |

### PCI / sensitivity constraints

None. GitHub `login` and `tenantId` are not sensitive values and are intentionally sent to PostHog (see bee.3 Architecture Constraints). The GitHub OAuth `accessToken` (`req.session.accessToken`) must NOT appear in any HTML response — asserted in NFR tests.

### Gaps

None.

---

## Unit Tests

### T1 — handleLanding with POSTHOG_KEY set: HTML contains PostHog CDN snippet

- **Verifies:** AC1
- **Precondition:** `process.env.POSTHOG_KEY = 'phc_test123'`; `req.session = {}`
- **Action:** Call `handleLanding(req, res)`; inspect `res.body`
- **Expected result:** `res.body` contains a `<script>` tag that references the PostHog CDN (e.g. `eu.posthog.com` or `us.posthog.com`) with the key `phc_test123` embedded
- **Edge case:** No

### T2 — handleLanding with POSTHOG_KEY set: snippet contains async attribute

- **Verifies:** AC1, NFR (non-blocking CDN load)
- **Precondition:** `process.env.POSTHOG_KEY = 'phc_test123'`; `req.session = {}`
- **Action:** Call `handleLanding(req, res)`; inspect `res.body`
- **Expected result:** The PostHog `<script>` tag contains the `async` attribute
- **Edge case:** No

### T3 — handleLanding with POSTHOG_KEY unset: no PostHog script in HTML

- **Verifies:** AC8
- **Precondition:** `delete process.env.POSTHOG_KEY`; `req.session = {}`
- **Action:** Call `handleLanding(req, res)`; inspect `res.body`
- **Expected result:** `res.body` does NOT contain any reference to `posthog` (no `<script>` tag, no `posthog.capture`, no CDN URL)
- **Edge case:** No

### T4 — handleLanding with POSTHOG_KEY empty string: no PostHog script in HTML

- **Verifies:** AC8 (empty string treated same as unset)
- **Precondition:** `process.env.POSTHOG_KEY = ''`; `req.session = {}`
- **Action:** Call `handleLanding(req, res)`; inspect `res.body`
- **Expected result:** `res.body` does NOT contain any PostHog references
- **Edge case:** Yes — empty string must be treated as "unset"

### T5 — handleLanding: landing_page_view capture call present when key set

- **Verifies:** AC3
- **Precondition:** `process.env.POSTHOG_KEY = 'phc_test123'`; `req.session = {}`
- **Action:** Call `handleLanding(req, res)`; inspect `res.body`
- **Expected result:** `res.body` contains `posthog.capture('landing_page_view')` or `posthog.capture("landing_page_view")`
- **Edge case:** No

### T6 — handleLanding: landing_page_view absent when POSTHOG_KEY unset

- **Verifies:** AC3, AC8 (graceful degradation — no posthog reference when key absent)
- **Precondition:** `delete process.env.POSTHOG_KEY`; `req.session = {}`
- **Action:** Call `handleLanding(req, res)`; inspect `res.body`
- **Expected result:** `res.body` does NOT contain `posthog.capture('landing_page_view')` or any other `posthog.*` call
- **Edge case:** No

### T7 — handleLanding: cta_clicked capture call present with typeof guard when key set

- **Verifies:** AC4, Architecture Constraint (typeof guard)
- **Precondition:** `process.env.POSTHOG_KEY = 'phc_test123'`; `req.session = {}`
- **Action:** Call `handleLanding(req, res)`; inspect `res.body`
- **Expected result:** `res.body` contains `posthog.capture('cta_clicked')` or `posthog.capture("cta_clicked")`, AND the capture call is wrapped in a `typeof posthog !== 'undefined'` guard (or the PostHog init snippet includes the standard stub array)
- **Edge case:** No

### T8 — handleLanding: cta_clicked absent and no posthog reference when key unset

- **Verifies:** AC4, AC8 (graceful degradation)
- **Precondition:** `delete process.env.POSTHOG_KEY`; `req.session = {}`
- **Action:** Call `handleLanding(req, res)`; inspect `res.body`
- **Expected result:** `res.body` does NOT contain `posthog.capture('cta_clicked')` and does NOT contain any `posthog.` reference
- **Edge case:** No

### T9 — handleJourneys (dashboard) with POSTHOG_KEY set: snippet in HTML

- **Verifies:** AC2
- **Precondition:** `process.env.POSTHOG_KEY = 'phc_test123'`; authenticated session with `login: 'alice'` and `tenantId: 'org-1'`; `setListJourneys(() => [])` wired
- **Action:** Call `handleJourneys(req, res)`; inspect `res.body`
- **Expected result:** `res.body` contains the PostHog CDN `<script>` snippet with key `phc_test123` and the `async` attribute
- **Edge case:** No

### T10 — handleJourneys: posthog.identify called with login and tenant_id

- **Verifies:** AC5
- **Precondition:** `process.env.POSTHOG_KEY = 'phc_test123'`; `req.session = { accessToken: 'tok', login: 'alice', tenantId: 'org-1' }`; `setListJourneys(() => [])`
- **Action:** Call `handleJourneys(req, res)`; inspect `res.body`
- **Expected result:** `res.body` contains `posthog.identify('alice'` (with alice as the distinct_id) and `tenant_id` with value `org-1`; the values are injected server-side (present in raw HTML string)
- **Edge case:** No

### T11 — handleJourneys: identify uses login, not accessToken

- **Verifies:** AC5, NFR (no credential exposure)
- **Precondition:** `process.env.POSTHOG_KEY = 'phc_test123'`; `req.session = { accessToken: 'SECRET_GITHUB_TOKEN', login: 'alice', tenantId: 'org-1' }`; `setListJourneys(() => [])`
- **Action:** Call `handleJourneys(req, res)`; inspect `res.body`
- **Expected result:** `res.body` contains `'alice'` and does NOT contain `'SECRET_GITHUB_TOKEN'`
- **Edge case:** Yes — critical security test

### T12 — handleJourneys: login_completed capture call after identify

- **Verifies:** AC6
- **Precondition:** `process.env.POSTHOG_KEY = 'phc_test123'`; authenticated session; `setListJourneys(() => [])`
- **Action:** Call `handleJourneys(req, res)`; inspect `res.body`
- **Expected result:** `res.body` contains `posthog.capture('login_completed')` or `posthog.capture("login_completed")`, appearing AFTER the `posthog.identify(` call in the HTML
- **Edge case:** No

### T13 — handleJourneys: no posthog snippet when POSTHOG_KEY unset

- **Verifies:** AC2, AC8
- **Precondition:** `delete process.env.POSTHOG_KEY`; authenticated session; `setListJourneys(() => [])`
- **Action:** Call `handleJourneys(req, res)`; inspect `res.body`
- **Expected result:** `res.body` does NOT contain any `posthog` reference
- **Edge case:** No

### T14 — chat page HTML contains journey_created capture call when key set

- **Verifies:** AC7
- **Precondition:** `process.env.POSTHOG_KEY = 'phc_test123'`; authenticated session with `login: 'alice'`, `tenantId: 'org-1'`; chat page handler loaded for `GET /skills/:name/sessions/:id/chat`
- **Action:** Call the chat page handler for `/skills/definition/sessions/sess-1/chat`; inspect `res.body`
- **Expected result:** `res.body` contains `posthog.capture('journey_created')` or `posthog.capture("journey_created")`
- **Edge case:** No

### T15 — chat page: no journey_created reference when POSTHOG_KEY unset

- **Verifies:** AC7, AC8
- **Precondition:** `delete process.env.POSTHOG_KEY`; authenticated session; chat page handler loaded
- **Action:** Call the chat page handler; inspect `res.body`
- **Expected result:** `res.body` does NOT contain `posthog.capture('journey_created')` or any other `posthog.*` reference
- **Edge case:** No

### T16 — No posthog npm package in package.json

- **Verifies:** AC9
- **Precondition:** Read `package.json` from repo root
- **Action:** Parse `package.json`; inspect `dependencies` and `devDependencies` keys
- **Expected result:** No key in either block matches `/posthog/i` (case-insensitive)
- **Edge case:** No

---

## Integration Tests

None. All PostHog ACs are verifiable via unit tests (HTML string inspection of route handler output). Integration-level PostHog verification (events reaching PostHog Cloud) is explicitly out of scope per the story.

---

## NFR Tests

### NFR-T1 — No accessToken in any HTML response

- **NFR addressed:** Security (no credential exposure)
- **Measurement method:** Set `req.session.accessToken = 'CANARY_TOKEN_VALUE'`; call all three handlers (landing, dashboard, chat page); assert none of the response bodies contains `'CANARY_TOKEN_VALUE'`
- **Pass threshold:** Zero occurrences of the canary token in any HTML response
- **Tool:** Node.js string `includes`

### NFR-T2 — No JavaScript error when POSTHOG_KEY unset (typeof guard or server-side omission)

- **NFR addressed:** Reliability (no JS error on page load when PostHog absent)
- **Measurement method:** Call `handleLanding` with POSTHOG_KEY unset; assert `res.body` contains no `posthog.` reference anywhere; OR assert that every `posthog.*` call in the HTML is preceded by `typeof posthog !== 'undefined'`. If the server omits all posthog calls when key is absent, this assertion is trivially satisfied.
- **Pass threshold:** If POSTHOG_KEY unset: zero `posthog.` references in any response body, OR every `posthog.` call has a typeof guard
- **Tool:** Node.js string assertion

### NFR-T3 — PostHog CDN script has async attribute

- **NFR addressed:** Performance (non-blocking CDN load)
- **Measurement method:** Parse the PostHog `<script>` tag from `res.body` when POSTHOG_KEY is set; assert the tag contains the `async` attribute
- **Pass threshold:** `async` attribute present in the script tag
- **Tool:** Node.js string `includes`

---

## Out of Scope for This Test Plan

- Verifying that PostHog actually receives events in the PostHog Cloud UI — this is explicitly out of scope per the story
- PostHog feature flags, session recordings, cohort analysis
- A/B testing
- PostHog server-side SDK (`posthog-node`)
- Custom PostHog dashboards

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| CTA click does not block navigation in-browser when PostHog is absent | Requires real browser JS execution; jsdom cannot simulate click + navigation blocking | Manual scenario in verification script; typeof guard assertion in T7 mitigates the gap at code level |
| PostHog event data actually reaches PostHog Cloud | Requires a live PostHog project and real browser session | Deferred to post-deployment monitoring; covered in discovery pendingActions (create PostHog account) |

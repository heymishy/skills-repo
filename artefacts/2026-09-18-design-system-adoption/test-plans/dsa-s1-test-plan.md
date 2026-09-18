## Test Plan: Restyle the Artefact Viewer and Build Its Sign-Off/Comments UI to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s1.md
**Epic reference:** artefacts/2026-09-18-design-system-adoption/epics/visual-restyle-rollout.md
**Test plan author:** Claude (agent)
**Date:** 2026-09-18 (amended following story scope expansion — run 2)

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Dark-mode computed CSS custom-property values match DESIGN.md's dark token table | — | — | 1 test | — | — | 🟢 |
| AC2 | Light-mode computed CSS custom-property values match DESIGN.md's light token table | — | — | 1 test | — | — | 🟢 |
| AC3 | Layout matches DESIGN.md's "Artefact/document viewer" pattern and the real mock, with real working Sign-off/Comments cards | — | — | 1 test | — | — | 🟢 |
| AC4 | No functional regression to pre-existing artefact-viewer behavior | — | — | 6 pre-existing specs re-run | — | — | 🟢 |
| AC5 | Sign Off button sends real POST /sign-off with correct artefactPath; card updates on success | 2 tests (server-side render logic) | — | 1 test (request-sending only) | 1 scenario | External-dependency | 🟡 |
| AC6 | Already-signed-off artefact shows approver/date, not an active button | 3 tests (detectExistingSignOff integration at render time) | — | 1 test | — | — | 🟢 |
| AC7 | Comments card lists all existing comments, oldest first, empty state if none | 2 tests | 2 tests | 1 test | — | — | 🟢 |
| AC8 | Comment submission persists and appears without reload | 2 tests | 2 tests | 1 test | — | — | 🟢 |

---

## Coverage gaps

**AC5's real backend success/409 round trip (the actual GitHub commit, and the actual 409-on-duplicate response) cannot be automated in E2E** — confirmed via direct investigation of this codebase's own existing, already-shipped `tests/e2e/sign-off.spec.js`: its own header comment and 3 `test.skip()` entries establish that `POST /sign-off`'s real success path (AC1 in that story) and the 409-conflict path (AC5 in that story) both require real GitHub write access unavailable in the test environment, deferred to manual verification since that story shipped (`wuce.3-attributed-signoff-verification.md`). This story's own new UI-request-sending behavior (correct `artefactPath`, real dispatch) IS automatable and covered by a real E2E test (call-observation via `page.route(..., route.continue())`, matching `tests/e2e/s3.1-drag-to-advance.spec.js`'s own established pattern) — only the full success-response UI update (card refreshing to show the new sign-off) is the actual gap, handled as a manual scenario. All other ACs (AC1-AC4, AC6-AC8) are fully automatable — AC6 in particular is now LOWER risk than in run 1's test plan, since the "already signed off" detection reuses real, already-unit-tested `detectExistingSignOff` logic at render time (no live GitHub call needed to test it — a fixture markdown string with an existing `## Approved by` section is enough).

Gap type for AC5's manual portion: **External-dependency** (relies on a third-party API — GitHub's Contents API — unavailable in test), not CSS-layout-dependent — Step 3a's trigger patterns (drag-drop, `getBoundingClientRect`, CSS-position) do not apply here; this gap exists because of an external write dependency, not because of browser-layout limitations.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A real journey/session with an artefact to view (dark mode active) | Synthetic — seeded via this feature's own test-only fixture endpoint, matching this repo's established `/test/seed-*` convention (e.g. `ep2-s3`'s own `/test/seed-approval-journey` precedent) | None | No PII, no real user data |
| AC2 | Same as AC1, with the Settings light-mode toggle applied | Synthetic | None | |
| AC3 | Same seeded artefact-view session | Synthetic | None | |
| AC4 | Pre-existing test fixtures already used by `artefact-preview.spec.js`, `artefact-read.spec.js`, `artefact-writeback.spec.js`, `wuce20-artefact-index-html.spec.js` | Existing fixtures — no new data needed | None | Reuse, do not duplicate |
| AC5 | A seeded artefact-view session; a real `page.route` observer on `/sign-off` (request-sending test only) | Synthetic | None | No real GitHub write attempted in automated tests |
| AC6 | Fixture markdown strings — one with an existing `## Approved by` section, one without — passed directly to `detectExistingSignOff` and to `handleArtefactRoute`'s own render logic | Synthetic — matches `tests/check-wuce3-attributed-signoff.js`'s own existing fixture-string pattern for this same function | None | |
| AC7 | A seeded artefact with 0 comments (empty state) and a seeded artefact with 2+ comments (list ordering) | Synthetic — via the new module's own `createComment` called directly in test setup | None | |
| AC8 | A seeded artefact with 0 comments; a real comment body string | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

AC5's real GitHub-write-dependent success/409 round trip is not covered by automated test data — see Coverage gaps above. Manual verification only for that portion.

---

## Unit Tests

AC1-AC4 have no unit-testable seam (computed-style/layout/regression assertions requiring a real rendered DOM). AC5-AC8 (new sign-off/comments functionality) do have real unit-testable seams:

### handle-artefact-route-shows-active-sign-off-button-when-not-signed-off

- **Verifies:** AC6 (negative case)
- **Precondition:** Fixture markdown with no `## Approved by` section
- **Action:** Call `detectExistingSignOff(markdown)` directly
- **Expected result:** Returns `null`
- **Edge case:** No

### handle-artefact-route-shows-existing-approver-when-already-signed-off

- **Verifies:** AC6 (positive case)
- **Precondition:** Fixture markdown with a real `## Approved by\n\nJane Doe — 2026-09-18T...` section
- **Action:** Call `detectExistingSignOff(markdown)` directly
- **Expected result:** Returns `{approver: 'Jane Doe', date: '2026-09-18T...'}`
- **Edge case:** No

### handle-artefact-route-renders-sign-off-card-state-from-detection-result

- **Verifies:** AC6 (integration between detection and rendering)
- **Precondition:** Both fixture markdown strings above
- **Action:** Call the new render logic with each fixture's `detectExistingSignOff` result
- **Expected result:** Not-signed-off fixture renders an active "Sign Off" button; already-signed-off fixture renders the approver/date, no active button
- **Edge case:** Yes — this is the exact AC6 requirement ("the user is not shown an active Sign Off button that would only fail on click")

### new-comments-module-create-comment-persists-row

- **Verifies:** AC7/AC8 (data layer)
- **Precondition:** New comments table exists (migration run in test setup)
- **Action:** Call the new module's `createComment(pool, resourceType, resourceId, userId, body)` directly
- **Expected result:** Returns the created row with a real `comment_id`, `created_at`
- **Edge case:** No

### new-comments-module-list-comments-returns-oldest-first

- **Verifies:** AC7
- **Precondition:** 3 comments created via `createComment`, out of chronological insertion order relative to any assumed default sort
- **Action:** Call `listCommentsForResource(pool, resourceType, resourceId)`
- **Expected result:** Rows returned oldest-`created_at`-first
- **Edge case:** No

---

## Integration Tests

AC1-AC4 have no component/service handoff in scope (pure presentation change). AC7/AC8 (new comment endpoints) do:

### post-comments-endpoint-persists-and-responds-with-comment

- **Verifies:** AC8
- **Components involved:** New create-comment route handler, new comments module, real Postgres pool
- **Precondition:** Authenticated session, valid CSRF token, seeded artefact
- **Action:** Dispatch a real `POST` request through the router to the new comments-create route with `{resourceType, resourceId, body}`
- **Expected result:** 200 response with `{success: true, comment: {...}}`; a subsequent direct `listCommentsForResource` call shows the new row
- **Expected result (negative):** Missing `resourceId` or `body` → 400, matching `handleCreateAgencyComment`'s own established validation shape

### get-comments-endpoint-lists-all-comments-for-artefact

- **Verifies:** AC7
- **Components involved:** New list-comments route handler, new comments module
- **Precondition:** Authenticated session, seeded artefact with 2+ comments already created
- **Action:** Dispatch a real `GET` request through the router to the new comments-list route
- **Expected result:** 200 response with `{comments: [...]}`, all comments present, oldest first
- **Expected result (empty state)**: seeded artefact with 0 comments returns `{comments: []}`, not an error

---

## E2E Tests (Playwright)

### artefact-viewer-dark-mode-tokens-match-design-md

- **Verifies:** AC1
- **Precondition:** A real, seeded artefact-view session exists (dark mode is the default)
- **Action:** Navigate to the real artefact-viewer page; read the computed values of every color custom property (`--bg`, `--surface`, `--ink`, `--ink-2`, `--muted`, `--muted-2`, `--muted-3`, `--accent`, `--accent-soft`, `--accent-ink`, `--success`, `--warn`, `--danger`) via `getComputedStyle`
- **Expected result:** Every value exactly matches `DESIGN.md`'s dark-mode token table
- **Edge case:** No

### artefact-viewer-light-mode-tokens-match-design-md

- **Verifies:** AC2
- **Precondition:** Same seeded session, with the Settings light/dark toggle switched to light
- **Action:** Same computed-style read as above, after toggling light mode
- **Expected result:** Every value exactly matches `DESIGN.md`'s light-mode token table
- **Edge case:** No

### artefact-viewer-layout-matches-design-md-pattern

- **Verifies:** AC3
- **Precondition:** Same seeded session
- **Action:** Assert presence and structure of the two-column layout (`minmax(0,1fr) 320px`), the Source Serif 4 doc body on a surface card, and the sidebar's real, functional Sign-off card and Comments card (not static/placeholder markup — assert the Sign Off button and comment form are real interactive elements)
- **Expected result:** All named structural elements are present, positioned per the layout pattern, and are genuinely interactive
- **Edge case:** No

### artefact-viewer-pre-existing-specs-still-pass

- **Verifies:** AC4
- **Precondition:** Restyle implemented
- **Action:** Re-run `tests/e2e/artefact-preview.spec.js`, `tests/e2e/artefact-read.spec.js`, `tests/e2e/artefact-writeback.spec.js`, `tests/e2e/wuce20-artefact-index-html.spec.js` unmodified
- **Expected result:** All 4 pre-existing spec files pass with no changes required to their own assertions
- **Edge case:** No — if any of these 4 fail, that is the regression this AC exists to catch, not an edge case

### sign-off-button-sends-real-post-with-correct-artefact-path

- **Verifies:** AC5 (request-sending only — see Coverage gaps for the manual-only success-response portion)
- **Precondition:** Seeded artefact-view session, not yet signed off
- **Action:** Install a `page.route('**/sign-off', route => { ...observe...; route.continue(); })` observer (matching `s3.1-drag-to-advance.spec.js`'s own established call-observation pattern); click the Sign Off button
- **Expected result:** Exactly one request observed, `POST /sign-off`, body contains the correct `artefactPath` matching this artefact's real path
- **Edge case:** No

### already-signed-off-artefact-shows-approver-not-active-button

- **Verifies:** AC6
- **Precondition:** Seeded artefact whose underlying markdown already has a real `## Approved by` section (via the same seeding mechanism used elsewhere in this feature)
- **Action:** Navigate to the artefact-view page
- **Expected result:** Sign-off card shows the approver name and date; no active "Sign Off" button is present (confirmed via both DOM query and a real click-target check — nothing clickable in that card triggers a POST)
- **Edge case:** No

### comments-card-lists-existing-comments-oldest-first-and-empty-state

- **Verifies:** AC7
- **Precondition:** Two artefacts — one seeded with 0 comments, one seeded with 3 comments via direct `createComment` calls in test setup
- **Action:** Navigate to each artefact's page
- **Expected result:** Empty-state artefact shows "No comments yet"; multi-comment artefact shows all 3, oldest first, each with author/body/timestamp visible
- **Edge case:** Yes — the empty state is the edge case for this AC

### comment-submission-appears-without-reload

- **Verifies:** AC8
- **Precondition:** Seeded artefact with 0 comments
- **Action:** Type a comment body into the Comments card's form and submit
- **Expected result:** The new comment appears in the list without a full page reload (assert via a real DOM mutation observation, not just a subsequent `page.reload()` + re-check)
- **Edge case:** No

---

## NFR Tests

### artefact-viewer-page-load-no-regression

- **NFR addressed:** Performance
- **Measurement method:** Compare page-load timing before/after the restyle, same seeded session
- **Pass threshold:** No measurable regression (CSS/markup-only change, no new network calls expected) — informal comparison, not a hard millisecond budget, per the story's own NFR wording
- **Tool:** Manual timing comparison during implementation, not a dedicated automated gate

### artefact-viewer-accessibility-no-regression

- **NFR addressed:** Accessibility
- **Measurement method:** Compare contrast ratios and keyboard-navigation behavior before/after the restyle, INCLUDING the new Sign Off button and comment form (real `<form>`/`<textarea>` elements, keyboard-navigable by construction, matching `handleCreateAgencyComment`'s own sibling feature's established accessibility approach — no custom-widget-only interaction)
- **Pass threshold:** No regression to any existing accessibility property (WCAG 2.1 AA floor, per `product/constraints.md` #9); new Sign Off button and comment form are keyboard-operable
- **Tool:** Manual comparison during implementation, or an automated contrast-check tool if one becomes available — no existing automated a11y gate found in this repo for this page

### new-comment-body-escaped-before-rendering

- **NFR addressed:** Security
- **Measurement method:** Submit a comment containing raw HTML/script-like content (e.g. `<script>alert(1)</script>`); inspect the rendered page source
- **Pass threshold:** The submitted content appears as literal escaped text, never executes, matching this codebase's own established `_escapeHtml` convention
- **Tool:** Direct test assertion on rendered HTML output

### new-comment-endpoints-require-authentication

- **NFR addressed:** Security
- **Measurement method:** Dispatch the new create/list comment requests with no session
- **Pass threshold:** Both reject (401 or redirect via `authGuard`), matching `handleSignOff`'s own established unauthenticated-rejection pattern
- **Tool:** Direct request dispatch, assert status code

### comment-creation-is-audit-logged

- **NFR addressed:** Audit
- **Measurement method:** Create a comment; inspect the logger call
- **Pass threshold:** A log entry is emitted with author, resource reference, and timestamp, matching `agency-client-comments.js`'s own established `comment_created` audit-log shape
- **Tool:** Logger spy/mock inspection in the integration test

---

## Out of Scope for This Test Plan

- Testing the light/dark toggle mechanism itself — already tested by its own existing coverage; this plan only tests that the *new token values* apply correctly once toggled.
- Testing any of the other 3 real screens (dashboard, landing, skill-session chat) — each has its own test plan.
- Testing the `design.system` DoR governance mechanism — `dsa-s5`'s own test plan.
- Testing `handleSignOff`'s own existing backend logic (rate limiting, path validation, GitHub commit mechanics, 409-duplicate detection) — already covered by `tests/e2e/sign-off.spec.js` and `tests/check-wuce3-attributed-signoff.js`, unaffected by this story, not re-tested here.
- Comment editing or deletion — out of scope for this story's own MVP (append-only).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| No dedicated automated accessibility-regression tool | This repo has no existing automated a11y gate for this page | Manual comparison during implementation; matches this repo's own established pattern for other stories' accessibility NFRs |
| AC5's real GitHub-write-dependent success/409 round trip cannot be automated in E2E | Same real, already-established constraint as this codebase's own existing `tests/e2e/sign-off.spec.js` (external GitHub Contents API dependency) | Manual verification scenario in the AC verification script; request-sending behavior (the actually-new part of this story) is fully automated |

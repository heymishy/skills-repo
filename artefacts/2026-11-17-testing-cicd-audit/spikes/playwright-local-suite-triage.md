# Local Playwright suite triage, 2026-11-17

Follows `playwright-local-suite-trial.md` (308 tests, 186 passed, 90 failed, 32 skipped, one CI run). Every one of the 90 failures is placed in a group below by reading its first error, the failing line and the locator or URL involved. Two causes were reproduced locally; the rest are classified from the CI report and not yet re-run, so a group is a strong hint, not a proven cause.

## Summary

| Group | Tests | What it is | Likely action |
|---|---|---|---|
| 1. Test database double lacks the journey tables | 17 | `fake-test-db.js` has no `customer_journeys` or `customer_journey_stages`, so `POST /journeys` fails and setup crashes (`reading 'split'`) | add the tables to the double (reproduced locally) |
| 2. Signup rate limit | 5 | the local-suite job sends no stub secret, so the limiter's bypass header is never sent (`HTTP 429`) | set a stub secret in the job |
| 3. Kanban board shows no cards | 12 | `[data-journey-id]`, `.kb-card`, `.bmau-item-checkbox` and the 8 columns are not found; one board cause is likely | investigate in CI |
| 4. Feature creation and the new-feature flow | 14 | feature creation answers 409 (`frsr-s1`), or the page never navigates (`pnfc-s1`, `ep3-s1`); `reference-upload` (7) and `dsda-s1` land on the skill chat instead of a reference modal or story list, so the flow they test has changed | decide per spec: real defect, or superseded flow to retire |
| 5. Pod manager times out | 9 | `ep1-s1`, `ep1-s2`, `ep1-s3-feature-pod`, `ep4-s1` time out at 30 to 60 s; fake database does have pod tables | not reproduced locally (Chromium crashed); needs CI |
| 6. Needs a real model session | 8 | `design-definition-canvas-render` (4), `ep2-s1-presence-sidebar`, `ep2-s2-stage-visibility` (2), `rdac-s1-resume` time out after 90 to 150 s on "a real /design session turn" and similar | give the job the mock model gateway, or move to a real-model lane |
| 7. Stale expectation in the spec | 8 | hard-coded `localhost:3000` where the server runs on 3999 (`artefact-read`, `feature-navigation`, `wuce20`, `wuce23`: 4); `locator('nav')` now matches two elements (`wuce23`, `wuce24`, `wuce25` x2: 4) | one-line spec fixes |
| 8. Right-panel layout spec | 7 | `iwu2-right-panel-layout`: `#assumption-cards` and `#draft-content` are not in the page at all, so the element was removed or renamed | check whether the feature still exists; retire or rewrite |
| 9. Singles to look at one by one | 10 | see below | per test |
| 10. Same cause as group 1 | included in 17 | `ep1-s3-stage-panel-focus-management` (`handlePostJourneys redirects 302`) | with group 1 |

Group counts add to 90: 17 + 5 + 12 + 14 + 9 + 8 + 8 + 7 + 10 = 90.

## Group 9: single failures

| Test | First error | Note |
|---|---|---|
| `dsa-s2-dashboard-restyle` AC7 (2 tests) | in-progress count 3 vs 2, and 1 vs 0 | state left over from other specs sharing one server |
| `fpux.1-visual-consistency-theme` (2) | token `rgb(20,23,26)`, spec expects `rgb(24,24,27)` | design tokens changed; spec stale |
| `fpd-s4-caption-sync` | `.playback-ac__video` not found | missing playback fixture |
| `csd-s2` AC4 keyboard navigation | "expected no focus trap", re-focus count 4 | could be a real accessibility defect |
| `bri-s3.6` AC1 | first-time GitHub sign-in lands on `/dashboard`, spec expects `/welcome` | product behaviour change, or leftover state; related to the earlier first-login navigation report |
| `ep1-s4-stage-selector` Scenario 2 | back links exist for 2 stages where the spec expects 0 | product change or real |
| `spdr-s2-metric1-timing`, `wuce18-keyboard-nav` | 30 s timeouts | slow, unclear |

## What this means

- About 30 tests (groups 1, 2 and 7) look like cheap test-environment fixes, not product problems.
- About 20 more (groups 3 and 6) probably have one environment cause each.
- About 14 (group 8 and the 7 `reference-upload` tests) probably belong to features that have changed or gone, and should be retired or rewritten rather than fixed.
- Three places might be genuine product defects and are worth checking on staging: feature creation answering 409, the first sign-in landing on the dashboard, and the diagram keyboard focus trap.

## Local running notes

- The suite needs `NODE_ENV=test` locally, as CI sets it; without it every `withAuth` test fails at once with "auth bypass only available in NODE_ENV=test".
- Browser tests are unreliable on this Windows machine (a Chromium page crashed during the pod spec), so cause-finding for browser-heavy specs should use CI runs.

## The three suspected product defects, checked (2026-11-17)

None is a product defect.

- **Feature creation answers 409 (`frsr-s1`).** The 409 is the deliberate "Connect a repo to get started" gate (das-s2, `routes/products.js` around line 3995): a product with no connected repository cannot start a feature. The specs create products with no repository. The other group 4 specs (`pnfc-s1`, `ep3-s1`, `reference-upload`, `dsda-s1`) also create a product and start a feature without connecting a repository, so they probably hit the same gate; that is not yet confirmed. Fix: a test fixture that gives the product a repository.
- **First sign-in lands on `/dashboard` (`bri-s3.6` AC1).** The first-login flag lives in a `github_first_login` table. When no database URL is set (the local and CI test mode) the real flag adapter is not wired and the fake database has no such table, so every sign-in counts as a returning user. Production has a database and the real adapter. Fix: support the flag in the fake database.
- **Diagram keyboard "focus trap" (`csd-s2` AC4).** Reproduced locally. The walk reaches the chat input in 23 Tab presses, so there is no trap. The test's heuristic compares tag, id and class, and four consecutive navigation links (`A.sw-nav-item`, no id, same class) count as "the same element four times". A false positive from the heuristic; fix the test to compare element identity.

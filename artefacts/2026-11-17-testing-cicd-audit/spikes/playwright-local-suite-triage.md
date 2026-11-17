# Local Playwright suite triage, 2026-11-17

Follows `playwright-local-suite-trial.md` (308 tests, 186 passed, 90 failed, 32 skipped, one CI run). This reads the first error of each failing test and reproduces two of the causes locally. It does not fix anything.

## How the 90 failures split by first error

36 assertion failures, 30 timeouts, 24 other.

## Causes found so far

| Cause | Specs | Tests | Evidence | Kind |
|---|---|---|---|---|
| The test database double has no `customer_journeys` or `customer_journey_stages` tables, so `POST /journeys` fails and the spec's seed step crashes on a missing `Location` header (`Cannot read properties of undefined (reading 'split')`) | `ep1-s4-stage-reorder`, `ic-s2-canvas-drag-position`, `ic-s4-keyboard-node-movement`, `jae-s5-delivery-swimlane-grid`, `jcx-s3-emotion-curve`, `jcx-s6-swimlane-grid`, `jcx-s7-panel-entry-and-save-feedback` | 11 | Reproduced locally. `src/web-ui/adapters/fake-test-db.js` has 0 mentions of either table; the handler (`routes/journeys.js`) reads `r.rows[0].id` from an empty result; the server logs `[fake-test-db] unhandled query (returning empty rows)` | test double drift (fixable in one place) |
| Signup rate limit: the local-suite job sends no stub secret, so the limiter's bypass header is never sent and a spec that signs up repeatedly gets `HTTP 429 Too many attempts` | `b1-formed-idea-outer-loop-story-map`, `dsh-s4-resume-conversation-survives-restart` (more may be hidden behind timeouts) | 5 | `fixtures/staging-auth.js` sends the bypass header only when a stub secret is set; the Scenario jobs set one (sep-s1), the local-suite job does not | test environment (fixable in the workflow) |
| Pod specs time out waiting for the pod manager | `ep1-s1-pod-creation`, `ep1-s2-product-default-pod`, `ep1-s3-feature-pod-inheritance`, `ep4-s1-multi-pod-assign` | 9 | CI: every test times out at 30 to 60 seconds. Locally the browser crashed on Windows, so this is not yet reproduced; the fake database does have pod tables, so the cause is something else | unknown |
| Everything else (about 55 tests: kanban drag and advance, new-feature choice, reference upload, canvas render, right-panel layout, restyle assertions, text matches) | about 30 specs | about 55 | not yet examined | unknown |

## Local running notes

- The suite needs `NODE_ENV=test` locally, as CI sets it; without it every `withAuth` test fails at once with "auth bypass only available in NODE_ENV=test".
- Browser tests are unreliable on this Windows machine (a Chromium page crashed during the pod spec), so cause-finding for browser-heavy specs should use CI runs.

## What this means for the plan

Two of the causes are test-environment gaps, not product bugs, and fixing them should turn about 16 tests across 9 specs from red to a real signal. The rest need a second triage pass in CI with the first two fixed, because several timeouts may be knock-on effects.

# Staging capability walk for the core (lpw-s2)

Date 2026-11-17. For each capability that has a core spec, a read-only check against `wuce-staging.fly.dev`: plain GET requests made from the operator's already signed-in browser session, looking for the page structure the core spec asserts. Nothing was created, changed or submitted. Limits: GET requests see server-rendered HTML only (not client-rendered content, not pages that need a live in-progress session, not flows that create data), so "not verifiable" below means "not verifiable this way", not "broken".

| Capability | Core specs | Result on staging | Verdict |
|---|---|---|---|
| dashboard-and-nav | b1-nav-toggle | `/dashboard` 200, 2 nav sub-items; `/dashboard?view=board` has `.kb-board` | Confirmed |
| kanban-board | psh-s7-org-kanban | `/org/kanban`: 8 `[data-stage]` columns, 40 cards, visible (214 x 172 px), 118 `data-journey-id` elements; a product's board with features shows 8 stages and 7 cards | Confirmed |
| skill-launch | skill-launcher, ep1-s3-launcher-layout | `/skills`: `.el-primary` 1, `details.el-advanced` 1, `.el-advanced-summary` 1 | Confirmed |
| journey-canvas | ep1-s4-stage-reorder, ic-s2, jcx-s3, tfhc-s1 | `/journeys/<id>`: view toggle (3 buttons), `#sw-drawflow-canvas`, 10 stage-move buttons, `#sw-stage-reorder-error`, swimlane grid, emotion curve | Confirmed |
| session-flow | dsh-s6, fjcv-s1, wuce25 | `/journey/<id>/stage/<skill>` answered 200 for 11 of 12 journeys sampled and 4 skills, with chat messages, artefact panel, canvas panel, stage nav and done markers | Confirmed for completed sessions; in-progress controls (`.sw-journey-gate`, `#sw-clarify-btn`) not verifiable this way |
| presence-and-signals | ep2-s3-approval, ep2-s3-signals-pagination, ep2-s4-concurrent-merge | `/signals`: 50 items each with a primary button, a page link and "load more" text | Signals list confirmed; the approval modal and concurrent merge are not verifiable this way |
| stage-model | wnl-s2-journey-gate-sticky | the sticky gate only appears in an in-progress session | Not verifiable this way |
| definition-canvas, diagrams | dic-canvas, csd-s1 | the canvas panel is present on every stage page (7 of 11 discovery, 9 of 11 definition, 10 of 11 ideate and review); `.dm-canvas`, `.story-card`, `.canvas-block` are rendered from live session data | Panel confirmed; block rendering not verifiable this way |
| artefact-view | annotation, dsa-s1, wuce20 | the feature page (HTML) answers 200 with 4 `nav` elements (which is why `lpw-s1` changed the locator to `.first()`). My own check of the artefact viewer was inconclusive (I followed `/artefacts/...` from the features list, which is not the `/artefact/...` route that renders the viewer). **The operator opened `https://wuce-staging.fly.dev/artefact/2026-09-29-test/benefit-metric` and confirmed an artefact displays.** | Confirmed (by the operator, 2026-11-17) |
| billing | bri-s3.5 | `/settings/billing` redirects to `/settings?error=no_billing_account` (this account has no billing account); the page and plan text exist | Page confirmed; the billing journey itself creates data and was not exercised (Scenario A covers sign-up and plan selection against the PR build) |
| signup-and-auth | bri-s3.2 | `/signup`, `/auth/login`, `/login` all answer 200 | Pages confirmed; the journey creates a tenant and was not exercised |
| tenant-isolation | bri-s3.3, bri-s3.4 | needs two tenants | Not verifiable read-only; protected by the core specs and the 20x repeat gate |
| walkthrough-capture, platform-checks | ppc-s5, actr-s2 | no playback-evidence links on the products sampled | Not verified |
| accessibility-and-responsive | dsa-s4 | needs rendered CSS and a mobile viewport | Not walked |

**Summary.** Five capabilities confirmed on staging by this walk (dashboard-and-nav, kanban-board, skill-launch, journey-canvas, session-flow for completed sessions) the signals list and, by the operator's own check, the artefact viewer; the rest cannot be checked read-only and rest on the core specs, Scenario A and B and the 20x isolation gate.

## What the walk and the local runs changed

- The kanban quarantine reason I had written was wrong (see `decisions.md`, "CORRECTION"): the board renders on staging and locally.
- Locally, the three kanban tests that click Advance fail because the card does not move after `{advanced: true}`. Staging was not clicked (that would change data). Whether this is a harness gap or a product defect is the first question for `lpw-s3`.
- The pod failures are confirmed as one cause: the test roster is empty.

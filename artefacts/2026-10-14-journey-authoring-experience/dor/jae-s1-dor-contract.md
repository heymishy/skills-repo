# DoR Contract: jae-s1

**Story:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s1.md
**Test plan:** artefacts/2026-10-14-journey-authoring-experience/test-plans/jae-s1-test-plan.md

## What will be built

- A new `seedDefaultStages` boolean field read from `POST /journeys`'s own request body in `handlePostJourneys` (`src/web-ui/routes/journeys.js`), defaulting to `true` when omitted (`req.body.seedDefaultStages !== false`).
- When `true`, after the journey's own INSERT succeeds (same transaction), loop a hardcoded 5-name array (`['Evaluate','Discover','Purchase','Onboard','Retain']`) and call the exact same single-stage INSERT `handlePostJourneyStage` already performs, once per name, with `position` 0-4.
- A new checkbox, "Start with a default stage outline," checked by default, added to the existing "+ New journey" modal markup (client-side form, submits `seedDefaultStages` alongside the existing `name`/`description`/`productId` fields).

## What will NOT be built

- No `templates` table, no template-selection UI — exactly one hardcoded skeleton.
- No pre-filling of any field beyond `name`/`position` on the seeded stages.
- No change to `handlePostJourneys`'s own existing name-validation (empty-name 400) or response shape.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Render the modal markup, assert the checkbox exists and carries `checked` | unit |
| AC2 | Call `handlePostJourneys` with a mock pool, assert 6 total INSERT calls with the correct 5 names/positions/null-other-fields | integration |
| AC3 | Call `handlePostJourneys` with `seedDefaultStages: false`, assert exactly 1 INSERT call | integration |
| AC4 | Call `handlePostJourneys` under a known tenant, assert every seeded stage INSERT's own `tenant_id` parameter matches | integration |

## Assumptions

- The existing "+ New journey" modal's own submit handler already serializes arbitrary form fields into the POST body (consistent with how `description`/`productId` are already optional fields on the same form) — no new serialization mechanism needed for the checkbox.
- `handlePostJourneyStage`'s own INSERT is reused by direct SQL call within `handlePostJourneys`, not by an internal HTTP call to the stage route — matching this codebase's own existing convention of calling shared query logic directly rather than self-invoking routes.

## Estimated touch points

Files: `src/web-ui/routes/journeys.js` (handlePostJourneys, "+ New journey" modal markup), `tests/check-jae-s1-default-skeleton.js` (new)
Services: none (same existing web-UI process)
APIs: `POST /journeys` (request body gains one new optional field; response shape unchanged)

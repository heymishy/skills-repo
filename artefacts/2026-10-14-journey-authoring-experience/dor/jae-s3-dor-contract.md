# DoR Contract: jae-s3

**Story:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s3.md
**Test plan:** artefacts/2026-10-14-journey-authoring-experience/test-plans/jae-s3-test-plan.md

## What will be built

- `extractProblemStatement(discoveryMdContent)` — a new sibling function in `src/web-ui/adapters/persona-scanner.js`, mirroring `extractWhoItAffects` exactly (regex-extract raw text under `## Problem Statement` until the next `## ` heading or EOF; `null` if absent/empty).
- `getFieldSuggestions(pool, productId, repoRoot)` — a new route-level function in `journeys.js`, mirroring `getPersonaSuggestions` exactly (same `journeys` table / `feature_slug` query, calls `_personaScanner.extractProblemStatement` per matched slug via a new `scanForFieldSuggestions`-style helper in `persona-scanner.js`).
- Two new suggestion buttons in the stage-edit panel markup, under `customer_actions` and `pain_points`, rendered only when (a) a suggestion exists and (b) the field's own current value is empty — reusing `sw-persona-suggestion-btn`'s own existing markup/CSS/click-delegation pattern.

## What will NOT be built

- No LLM/AI-generated content — deterministic scan only, per `/clarify`'s own confirmed decision.
- No suggestion mechanism for any field other than `customer_actions`/`pain_points`.
- No change to `jcx-s4`'s own existing persona-suggestion mechanism — `getPersonaSuggestions`/`extractWhoItAffects` are read, not modified.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit: `extractProblemStatement` against a fixture string. Integration: `getFieldSuggestions` against a real temp `discovery.md` file on disk | unit + integration |
| AC2 | jsdom: click the suggestion button, assert the field's own value is set and no PATCH has fired yet | unit |
| AC3 | Unit: `getFieldSuggestions` with no `product_id` and with a `product_id` whose feature has no discovery.md | unit |
| AC4 | Unit: render the panel with a field already populated, assert no suggestion button for that field | unit |
| AC5 | Integration: cross-tenant mock pool, compare `getFieldSuggestions`'s result directly against `getPersonaSuggestions`'s own result for the equivalent scenario | integration |

## Assumptions

- `_personaScanner` (the existing injected/required reference to `persona-scanner.js` inside `journeys.js`) is reused as-is — no new adapter injection point needed, since `extractProblemStatement`/the new scan helper are added to the SAME already-required module.
- The suggestion button's own `data-text` attribute (or equivalent) can carry the raw suggestion text the same way `sw-persona-suggestion-btn` already does, with no new escaping concerns beyond what `escHtml` already handles elsewhere in this file.

## Estimated touch points

Files: `src/web-ui/adapters/persona-scanner.js` (new `extractProblemStatement`, new scan helper), `src/web-ui/routes/journeys.js` (new `getFieldSuggestions`, 2 new suggestion-button render sites in the panel markup), `tests/check-jae-s3-field-suggestions.js` (new)
Services: none
APIs: none changed (no new route; suggestions are rendered server-side as part of the existing canvas GET response)

# Contract Proposal — Session-origin indicator on the /journey dashboard

**What will be built:**
- In `src/web-ui/routes/journey.js`'s `_renderJourneyHome` (or its calling route handler), import `deriveSessionOrigin` from `features.js` (sob-s1's output) and call it once per card, mapping each `journeys` array entry to `{ hasJourney, completedStages }`: a real journey object supplies `hasJourney: true, completedStages: journey.completedStages`; a synthesized entry from `_mergeStateFeaturesIntoJourneyList` (no `completedStages` property at all) supplies `hasJourney: false, completedStages: []`.
- Render the resulting indicator inline on each card using the identical markup/class sob-s1 introduces (shared visual treatment, no new CSS).

**What will NOT be built:**
- Any change to what `_mergeStateFeaturesIntoJourneyList` synthesizes or when.
- Org kanban wiring (sob-s3).
- Any new bulk-lookup seam — `listJourneys()` already returns full journey objects with `completedStages` intact; no new query.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration test: real-journey fixture, all stages session-backed, renders "fully-session-backed" | integration |
| AC2 | Integration test: mixed real-journey fixture renders "mixed" | integration |
| AC3 | Integration test: synthesized-entry fixture (no `completedStages` property) renders "no-session" without throwing | integration |
| AC4 | Integration test: real-journey fixture with `completedStages: []` renders no indicator | integration |
| AC5 | Integration test: call-count spy on `listJourneys`/`_mergeStateFeaturesIntoJourneyList`, asserted unchanged from pre-story baseline | integration |

**Assumptions:**
- `_mergeStateFeaturesIntoJourneyList`'s real synthesized-entry shape (`{ featureSlug, currentStage, productProfile, createdAt, stages: {} }`, no `completedStages`) is stable and was confirmed directly against the real code during `/design`/`/definition` — if this shape changes in a future story, this story's `hasJourney: false` mapping logic must be revisited.

**Estimated touch points:**
Files: `src/web-ui/routes/journey.js` (card-rendering call site), `tests/check-sob-s2-journey-dashboard-integration.js` (new), `scripts/run-all-tests.js` (register the new test file).
Services: None new — reuses `_journeyStore.listJourneys()` unchanged.
APIs: None new.

**Dependencies / schemaDepends:**
Upstream: sob-s1 must be DoD-complete (this story imports its `deriveSessionOrigin` function).
`schemaDepends: []` — this dependency is on exported application code, not any `pipeline-state.json` field, so no schema fields are declared or need to exist in `pipeline-state.schema.json`.

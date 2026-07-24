## Test Plan: Completing /definition moves straight into /review

**Story reference:** artefacts/2026-07-24-definition-to-review-autostart/stories/dtra-s1-auto-start-review-after-definition.md

## AC Coverage

| AC | Description | Integration | Gap type | Risk |
|----|-------------|-------------|----------|------|
| AC1 | Parseable artefact -> redirect straight to a new /review session | 1 test | — | 🟢 |
| AC2 | Full story list (not just first) passed to setStoryList | 1 test | — | 🟢 |
| AC3 | Unparseable artefact -> falls back to /journey/:id/stories | 1 test | — | 🟢 |
| AC4 | Manual /journey/:id/stories page still works unchanged | 1 test | — | 🟢 |

## Integration Tests

### autoStartsReviewWhenStoriesParseable
- **Verifies:** AC1
- **Precondition:** A journey with a completed `definition` stage whose artefact has 2+ parseable `# Story x.y — ...` headers
- **Action:** Call `handlePostGateConfirm` completing the `definition` stage
- **Expected result:** Response redirects (303) to `/skills/review/sessions/:sid/chat`, not `/journey/:id/stories`

### fullStoryListPassedToSetStoryList
- **Verifies:** AC2
- **Action:** Same as above; spy on `journeyStore.setStoryList`
- **Expected result:** Called with the full array of extracted story IDs (length matches the artefact's story count), not a 1-element array

### fallsBackToManualPageWhenUnparseable
- **Verifies:** AC3
- **Precondition:** A journey with a completed `definition` stage whose artefact has no recognisable story headers
- **Action:** Call `handlePostGateConfirm` completing the `definition` stage
- **Expected result:** Response redirects (303) to `/journey/:id/stories`, unchanged from today's behaviour

### manualStoriesPageStillWorks
- **Verifies:** AC4
- **Action:** `GET /journey/:id/stories` directly, then `POST /api/journey/:id/stories` with a manual story list
- **Expected result:** Both routes behave exactly as before this story (pre-filled textarea on GET; review session started on POST)

## Out of Scope for This Test Plan

- `extractStoryIdsFromDefinitionArtefact`'s own parsing logic — already covered by dsda-s1's test suite.

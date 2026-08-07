## Test Plan: Feature display name at creation + rename

**Story reference:** artefacts/2026-07-25-feature-display-name-and-progress/stories/fdn-s1-feature-display-name.md

## AC Coverage

| AC | Description | Integration | Gap type | Risk |
|----|-------------|-------------|----------|------|
| AC1 | New-feature modal accepts optional displayName, persisted | 2 tests | — | 🟢 |
| AC2 | No displayName -> raw slug shown, unchanged | 2 tests | — | 🟢 |
| AC3 | displayName set -> shown instead of slug, no duplication | 2 tests | — | 🟢 |
| AC4 | Rename route updates displayName, never featureSlug | 2 tests | — | 🟢 |
| AC5 | PG _sanitise persists/round-trips displayName | 1 test | — | 🟢 |
| AC6 | mergeFeatureSources threads displayName into item.name | 1 test | — | 🟢 |

## Integration Tests

### newFeatureAcceptsOptionalDisplayName
- **Verifies:** AC1
- **Precondition:** none
- **Action:** `POST /products/:id/features` with `{ startSkill: 'discovery', displayName: 'Checkout redesign' }`
- **Expected result:** The created journey's `displayName` field equals `'Checkout redesign'` (read back via `_journeyStore.getJourney`)

### newFeatureOmittedDisplayNameDefaultsToNull
- **Verifies:** AC1
- **Action:** `POST /products/:id/features` with no `displayName` field
- **Expected result:** Created journey has `displayName: null` (or absent) — no forced value, matching today's behaviour

### noDisplayNameRendersSlug (2 tests: `_renderEpicRow`, `_renderPvcItemRow`)
- **Verifies:** AC2
- **Precondition:** item/journey with no `displayName`
- **Expected result:** Rendered row shows the raw `featureSlug`, byte-identical to pre-story output

### displayNameRendersInsteadOfSlug (2 tests: `_renderEpicRow`, `_renderPvcItemRow`)
- **Verifies:** AC3
- **Precondition:** item/journey with `displayName: 'Checkout redesign'`
- **Expected result:** Rendered row shows `'Checkout redesign'`; the raw slug does not appear as a second visible label in the row body

### renameRouteUpdatesDisplayNameOnly
- **Verifies:** AC4
- **Action:** Call the new rename route for an existing journey with a new name
- **Expected result:** `journey.displayName` updated; `journey.featureSlug` and its disk artefact path/pipeline-state key are untouched

### renameRouteEnforcesTenantOwnership
- **Verifies:** AC4 (Security NFR)
- **Action:** Call the rename route with a session belonging to a different tenant than the journey's owner
- **Expected result:** 404, matching the existing tenant-ownership pattern used by every other journey-scoped route

### pgSanitiseRoundTripsDisplayName
- **Verifies:** AC5
- **Action:** `saveJourney({ ..., displayName: 'X' })` via the PG adapter (stubbed pool), then `listJourneys()`
- **Expected result:** The returned journey object includes `displayName: 'X'` — proves `_sanitise()`'s allowlist was extended, not just that in-memory/disk paths work

### mergeFeatureSourcesUsesDisplayNameForJourneyItems
- **Verifies:** AC6
- **Action:** Call `mergeFeatureSources(taxonomy, [{ featureSlug: 'x', displayName: 'Checkout redesign' }])` for a slug with no taxonomy entry
- **Expected result:** The merged item's `name` equals `'Checkout redesign'`, not left undefined

## Out of Scope for This Test Plan

- Re-testing `_escapeHtml`'s own escaping behaviour — pre-existing, reused as-is for `displayName`.
- Any test of taxonomy-sourced items' pre-existing `name` resolution — unchanged by this story.

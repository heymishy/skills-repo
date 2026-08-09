## Test Plan: Fall back to Postgres-durable content when the artefact viewer's GitHub fetch 404s

**Story reference:** artefacts/2026-08-09-artefact-viewer-postgres-fallback/stories/avpf-s1-postgres-fallback-for-artefact-viewer.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | GitHub 404 + Postgres has content (same tenant) → Postgres content rendered | — | 1 test | — | — | — | 🟢 |
| AC2 | GitHub has content → GitHub content returned unchanged, Postgres never consulted | — | 1 test | — | — | — | 🟢 |
| AC3 | GitHub 404 + Postgres empty → existing "artefact not found" page, unchanged | — | 1 test | — | — | — | 🟢 |
| AC4 | GitHub 404 + Postgres lookup throws → degrades to "artefact not found", no 500 | — | 1 test | — | — | — | 🟢 |
| AC5 | GitHub 404 + Postgres has content but different tenant → "artefact not found", fallback not used | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. All 5 ACs are exercised at the route-handler (integration) level, reusing the existing `mockReq`/`mockRes`/`setFetcher` harness already established in `tests/check-wuce2-read-render-artefact.js`, plus a new injectable `setJourneyStore` override for this story.

---

## Test Data Strategy

**Source:** Synthetic — an in-memory fake `journeyStore` double injected via the new `setJourneyStore` seam (no real Postgres connection required).
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

---

## Integration Tests

New file: `tests/check-avpf-s1-postgres-fallback.js`

### avpf1_postgresFallback_rendersContent_whenGithub404sAndSameTenant

- **Verifies:** AC1
- **Precondition:** `setFetcher` throws `ArtefactNotFoundError`; fake `journeyStore.getJourneyByFeatureSlug` returns `{ journeyId: 'j1', tenantId: 't1' }`; fake `journeyStore.getArtefactsForJourney('j1')` returns `[{ skill_name: 'benefit-metric', content: '## Benefit Metric\n\nReal content.' }]`; request session has `tenantId: 't1'`
- **Action:** `handleArtefactRoute(req, res, 'new-feature-32ded088', 'benefit-metric')`
- **Expected result:** `res.statusCode === 200`; body contains rendered HTML derived from the Postgres content (e.g. contains `<h2>` for the `## Benefit Metric` heading); body does not contain "artefact not found"

### avpf2_githubContent_preferredAndUnchanged_whenGithubHasIt

- **Verifies:** AC2
- **Precondition:** `setFetcher` resolves successfully with real markdown; fake `journeyStore.getJourneyByFeatureSlug`/`getArtefactsForJourney` set up to return DIFFERENT content, as a canary
- **Action:** `handleArtefactRoute(req, res, 'example-feature', 'discovery')`
- **Expected result:** `res.statusCode === 200`; body matches the GitHub-sourced content; body does NOT contain the canary Postgres content; assert the fake `journeyStore.getArtefactsForJourney` was never called (Postgres fallback is not consulted when GitHub succeeds)

### avpf3_notFoundPage_unchanged_whenNeitherSourceHasContent

- **Verifies:** AC3
- **Precondition:** `setFetcher` throws `ArtefactNotFoundError`; fake `journeyStore.getJourneyByFeatureSlug` returns `null` (no matching journey)
- **Action:** `handleArtefactRoute(req, res, 'truly-unknown-feature', 'discovery')`
- **Expected result:** `res.statusCode === 404`; body contains "artefact not found" — byte-identical behaviour to the existing `IT2` test in `check-wuce2-read-render-artefact.js`

### avpf4_degradesTo404_whenPostgresLookupThrows

- **Verifies:** AC4
- **Precondition:** `setFetcher` throws `ArtefactNotFoundError`; fake `journeyStore.getJourneyByFeatureSlug` throws an `Error` (simulating a DB failure)
- **Action:** `handleArtefactRoute(req, res, 'some-feature', 'discovery')`
- **Expected result:** No exception escapes `handleArtefactRoute`; `res.statusCode === 404`; body contains "artefact not found" — never a 500

### avpf5_crossTenant_neverServesOtherTenantsContent

- **Verifies:** AC5
- **Precondition:** `setFetcher` throws `ArtefactNotFoundError`; fake `journeyStore.getJourneyByFeatureSlug` returns `{ journeyId: 'j2', tenantId: 't-OTHER' }`; fake `journeyStore.getArtefactsForJourney('j2')` returns real content; request session has `tenantId: 't1'` (different tenant)
- **Action:** `handleArtefactRoute(req, res, 'someone-elses-feature', 'benefit-metric')`
- **Expected result:** `res.statusCode === 404`; body contains "artefact not found"; body does NOT contain the other tenant's content anywhere in the response

---

## Regression check

Re-run `tests/check-wuce2-read-render-artefact.js` unchanged after this fix — all 18 existing tests (T1.1–T5.2, IT1–IT3, NFR1–NFR3) must still pass, confirming the GitHub-success and GitHub-error paths are untouched by this addition.

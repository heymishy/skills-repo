## Test Plan: Artefact-list repo-root fallback

**Story reference:** artefacts/2026-07-26-canvas-render-and-story-extraction-fix/stories/alrf-s1-artefact-list-repo-root-fallback.md
**Epic reference:** csd-e1-code-shape-diagrams
**Test plan author:** Claude (agent) — retrospective backfill, 2026-08-21
**Date:** 2026-08-21

**Backfill note:** reconstructed after the fact — implementation and its test file (`tests/check-alrf-s1-artefact-list-repo-root-fallback.js`) already existed and were merged (PR #614, 2026-07-26); documents existing coverage per `templates/retrospective-story.md`'s convention.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `listArtefacts` finds real local artefacts via `repoRoot` when `WUCE_REPOSITORIES` is unset | 1 test | — | — | 1 (also manually verified) | — | 🟢 |
| AC2 | An existing-but-empty local artefacts directory returns `noArtefacts: true`, not a silent fall-through | 1 test | — | — | — | — | 🟢 |
| AC3 | No regression to the GitHub-API path when no local directory exists or `repoRoot` is omitted | 1 test | 3 regression suites | — | — | — | 🟢 |
| AC4 | Repo-relative artefact paths use forward slashes on all platforms | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All 4 ACs have direct test coverage.

---

## Test Data Strategy

**Source:** Synthetic (temp fixture directories under `artefacts/`) plus this repo's own real `artefacts/2026-07-26-canvas-render-and-story-extraction-fix/` directory for AC1's manual cross-check.
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained.

---

## Unit Tests

Tests live in `tests/check-alrf-s1-artefact-list-repo-root-fallback.js` (8 assertions total):

- **AC1:** `listArtefacts(featureSlug, token, repoRoot)` checks the local filesystem first via `listLocalArtefacts()` when `repoRoot` is supplied; correctly maps results to `{name, path, sha, type, viewUrl}`.
- **AC2:** An existing-but-empty local directory returns `noArtefacts: true` explicitly, rather than silently falling through to the GitHub-API path.
- **AC3:** No local directory or `repoRoot` omitted → unchanged GitHub-API behaviour.
- **AC4:** `path.relative(repoRoot, artefactPath).split(path.sep).join('/')` — forward slashes regardless of platform.

---

## Integration Tests

**AC3 (regression):** `check-wuce6-feature-navigation.js`, `check-wuce20-artefact-index-html.js`, `check-kfd1-kanban-card-and-detail-page-cx.js` — 139/139 combined, all pass unchanged.

---

## E2E Tests

None.

---

## NFR Tests

None named.

---

## Out of Scope for This Test Plan

- Reconciling the third artefact-listing mechanism (`journey-store-pg.js`'s Postgres-based counts) — story's own Out of Scope; addressed separately by `alrf-s4`.
- Removing `listArtefacts`'s GitHub-API path entirely — kept as fallback.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |

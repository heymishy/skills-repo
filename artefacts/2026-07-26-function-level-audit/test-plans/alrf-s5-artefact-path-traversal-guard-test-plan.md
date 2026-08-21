## Test Plan: Path-traversal guard for as-built diagram artefact writes

**Story reference:** artefacts/2026-07-26-function-level-audit/stories/alrf-s5-artefact-path-traversal-guard.md
**Epic reference:** csd-e1-code-shape-diagrams (vulnerable routes belong to this epic)
**Test plan author:** Claude (agent) — retrospective backfill, 2026-08-21
**Date:** 2026-08-21

**Backfill note:** reconstructed after the fact — implementation and its test file (`tests/check-alrf-s5-artefact-path-traversal-guard.js`) already existed and were merged (2026-07-26); documents existing coverage per `templates/retrospective-story.md`'s convention. This story closed an active, exploitable path-traversal vulnerability (CRITICAL finding).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `writeAsBuiltDiagramArtefact()` throws `ArtefactPathTraversalError` for a traversal `featureSlug`, writes nothing outside `repoRoot` | 1 test | — | — | — | — | 🔴 |
| AC2 | A legitimate `featureSlug` still writes successfully (no regression) | 1 test | 3 regression suites | — | — | — | 🟢 |
| AC3 | `GET /api/as-built-diagrams/data-model` returns 400 (never 500) for a traversal `featureSlug`, without echoing the raw value | 1 test | — | — | — | — | 🔴 |
| AC4 | `GET /api/as-built-diagrams/system-architecture` returns 400 (never 500) for a traversal `featureSlug`, same shared writer, confirms both call sites | 1 test | — | — | — | — | 🔴 |

---

## Coverage gaps

None. All 4 ACs have direct test coverage — 🔴 marks the security-critical nature of AC1/AC3/AC4, not a coverage gap.

---

## Test Data Strategy

**Source:** Synthetic — deliberately malicious `featureSlug` values (e.g. `../../../../tmp/evil`) alongside legitimate slugs.
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained.

---

## Unit Tests

Tests live in `tests/check-alrf-s5-artefact-path-traversal-guard.js` (10 assertions total):

- **AC1:** A traversal `featureSlug` throws `ArtefactPathTraversalError` by name, and no file is written outside `repoRoot`.
- **AC2:** A legitimate `featureSlug` still writes successfully.
- **AC3:** `GET /api/as-built-diagrams/data-model` with a traversal slug returns `400`, generic message, raw value never echoed.
- **AC4:** `GET /api/as-built-diagrams/system-architecture` (the second route sharing the same writer function) — same guard confirmed at the second call site.

---

## Integration Tests

**AC2 (regression):** full pre-existing `check-csd-s5-...`/`check-csd-s6-...`/`check-csd-s7-...` suites (37/37 combined) passing unchanged.

---

## E2E Tests

None.

---

## NFR Tests

### Security — path-traversal guard matches the codebase's existing convention

- **NFR addressed:** Security (this story's core purpose — closes an active, exploitable arbitrary-file-write vulnerability for any authenticated user).
- **Measurement method:** AC1/AC3/AC4 above ARE the security-relevant assertions; the guard shape matches the pre-existing `path.resolve` + `startsWith(repoRoot + path.sep)` pattern already used in `routes/journey.js` (per `CLAUDE.md`'s documented `ougl.5`/`ougl.6` convention).
- **Pass threshold:** N/A — see AC1/AC3/AC4.
- **Tool:** This repo's hand-rolled `test()`/`assert` harness.

---

## Out of Scope for This Test Plan

- The dormant tenant-isolation gap in these same two routes' `_repoRoot()` — separate finding, fixed in `alrf-s6`.
- The orphaned `assignFeatureToModule`/`unassignFeature` write path and `auth-email.js` rate-limiter duplication — also deferred, fixed/re-assessed in `alrf-s6`.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |

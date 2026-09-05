## Test Plan: Group a story's own bare-slug definition file into its own accordion section

**Story reference:** artefacts/2026-09-05-bare-slug-story-grouping-fix/stories/bsgm-s1-fix-bare-slug-story-file-grouping.md
**Test plan author:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-05

**Test runner confirmed from `package.json`:** `npm test` → `node scripts/run-all-tests.js` (custom Node/assert test runner, matching the existing `check-fapg-s1-group-artefacts-by-story.js` convention this story extends).

**E2E detection (Step 3a):** No AC in this story involves CSS layout, visual rendering, or coordinate-dependent behaviour — this is pure data-grouping logic. Not applicable.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Bare `<slug>.md` file groups into its own story's artefacts | 2 tests | — | — | — | — | 🟢 |
| AC2 (regression guard) | Descriptive-suffix filenames unchanged | 1 test | — | — | — | — | 🟢 |
| AC3 (regression guard) | `p3.1`/`p3.1a` prefix disambiguation preserved for the new bare case | 2 tests | — | — | — | — | 🟢 |
| AC4 | Live production confirmation on a real affected feature | — | — | — | 1 scenario | Untestable-by-nature (requires a real deployed environment) | 🔴 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in the current suite | Handling |
|-----|----|----------|------------------------------------------|---------|
| Whether the fix actually renders correctly on a real, already-affected production page | AC4 | Untestable-by-nature | Requires the fix to be deployed and a real browser check against real pipeline-state.json data — cannot be simulated meaningfully beyond what AC1-3's unit tests already prove at the data layer | Manual verification scenario in the AC verification script 🔴 — direct post-merge browser check against `/features/2026-09-02-product-dashboard-triage`, matching this session's own established live-verification convention (`stcs-s1`/`ptvs-s1`/`pebd-s1`) |

---

## Test Data Strategy

**Source:** Synthetic (temp-directory `pipeline-state.json` fixtures, matching `check-fapg-s1-group-artefacts-by-story.js`'s own established `makeTempRepoWithPipelineState` convention).
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A fixture feature with one story slug and an artefact list including a bare `<slug>.md` entry | Synthetic, temp `pipeline-state.json` | None | |
| AC2 | Same fixture shape, with a descriptive-suffix filename instead | Synthetic | None | |
| AC3 | A fixture with two slugs where one is a text-prefix of the other (`p3.1`, `p3.1a`), each with both a bare `.md` and a hyphenated artefact | Synthetic | None | |
| AC4 | The real, already-deployed `2026-09-02-product-dashboard-triage` feature | Real production data (read-only browser check, no data created/modified) | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### `groupArtefactsByStory` classifies a bare `<slug>.md` file into its own story's artefacts (AC1)

- **Verifies:** AC1
- **Precondition:** A `storyStructure` with one flat story slug `bsgm-x1`; an artefact list containing `{ path: 'artefacts/f/stories/bsgm-x1.md' }`.
- **Action:** Call `groupArtefactsByStory(artefacts, storyStructure)`.
- **Expected result:** `result.flatStories[0].artefacts` contains the `bsgm-x1.md` artefact; `result.featureLevel` does not.
- **Edge case:** No.

### `groupArtefactsByStory` classifies a bare `<slug>.md` file inside an epic-nested story (AC1)

- **Verifies:** AC1
- **Precondition:** A `storyStructure` with one epic containing story slug `p0.1`; an artefact list containing `{ path: 'artefacts/f/stories/p0.1.md' }`.
- **Action:** Call `groupArtefactsByStory(artefacts, storyStructure)`.
- **Expected result:** `result.epics[0].stories[0].artefacts` contains the `p0.1.md` artefact; `result.featureLevel` does not.
- **Edge case:** Yes — epic-nested (not flat) story structure.

### `groupArtefactsByStory` does not change existing descriptive-suffix matching (AC2, regression guard)

- **Verifies:** AC2
- **Precondition:** A `storyStructure` with slug `fpux.1`; an artefact list containing `{ path: 'artefacts/f/stories/fpux.1-unify-feature-page-visual-language.md' }`.
- **Action:** Call `groupArtefactsByStory(artefacts, storyStructure)`.
- **Expected result:** The artefact groups under `fpux.1` exactly as it already does today — unchanged behaviour.
- **Edge case:** No.

### `groupArtefactsByStory` never mis-attributes a longer slug's bare file to a shorter prefix slug (AC3, regression guard)

- **Verifies:** AC3
- **Precondition:** A `storyStructure` with two flat slugs, `p3.1` and `p3.1a`; an artefact list containing `{ path: '.../p3.1a.md' }` and `{ path: '.../p3.1.md' }`.
- **Action:** Call `groupArtefactsByStory(artefacts, storyStructure)`.
- **Expected result:** `p3.1a.md` groups under `p3.1a` only; `p3.1.md` groups under `p3.1` only — no cross-contamination in either direction.
- **Edge case:** Yes — the exact ambiguity case the existing hyphen-prefix rule was designed to prevent, now also proven for the new bare-filename case.

### `groupArtefactsByStory` never mis-attributes a longer slug's hyphenated file to a shorter prefix slug (AC3, regression guard — existing behaviour re-confirmed)

- **Verifies:** AC3
- **Precondition:** Same two-slug fixture as above; an artefact list containing `{ path: '.../p3.1a-review-1.md' }`.
- **Action:** Call `groupArtefactsByStory(artefacts, storyStructure)`.
- **Expected result:** Groups under `p3.1a`, not `p3.1` — confirms the fix did not regress the pre-existing hyphen-suffix disambiguation this AC also covers.
- **Edge case:** No — this is the existing, already-passing case, re-asserted as a regression guard.

---

## Integration Tests

None — `groupArtefactsByStory` is a pure function with no I/O; its only caller (`handleGetFeatureArtefacts`) is already covered end-to-end by the existing `check-fapg-s1-group-artefacts-by-story.js` suite, which this story's tests are added alongside, not replacing.

---

## NFR Tests

None — confirmed. This is a pure data-classification bug fix with no performance, security, or accessibility surface.

---

## Out of Scope for This Test Plan

- Migrating any existing story file to a different naming convention.
- Re-testing `deriveTypeFromPath`'s own folder-based type derivation — confirmed via this story's own audit to be a separate, unaffected mechanism.
- Full E2E Playwright coverage of the rendered accordion — AC1-3's unit tests directly exercise the actual data-classification bug; AC4's manual scenario confirms the real rendered outcome once deployed.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC4's live-production confirmation cannot run pre-merge | Requires the fix to be deployed to see the real page re-render correctly | Manual verification scenario 🔴 in the AC verification script, performed post-merge — matching this session's own established live-verification convention |

## Test Plan: Fix epic/flat story render duplication and missing story registration

**Story reference:** artefacts/2026-09-06-story-registration-integrity-fix/stories/sri-s1-fix-story-render-duplication-and-missing-registration.md
**Test plan author:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-06

**Test runner confirmed from `package.json`:** `npm test` → `node scripts/run-all-tests.js`.

**E2E detection (Step 3a):** No AC involves CSS layout or visual rendering — pure data-classification and data-integrity logic. Not applicable.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Slug in both epic + flat renders once (under its epic) | 2 tests | — | — | — | — | 🟢 |
| AC2 (regression guard) | Flat-only slug still renders once, unaffected | 1 test | — | — | — | — | 🟢 |
| AC3 | 4 specific missing-registration cases now correctly registered in real `pipeline-state.json` | 1 data-integrity test | — | — | — | — | 🟢 |
| AC4 | Live production confirmation, 2 originally-affected + 4 newly-registered features | — | — | — | 1 scenario | Untestable-by-nature (requires deployed environment) | 🔴 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in the current suite | Handling |
|-----|----|----------|------------------------------------------|---------|
| Whether the dedupe and registration fixes actually render correctly on real, already-affected production pages | AC4 | Untestable-by-nature | Requires the fix deployed against real `pipeline-state.json` data — cannot be simulated meaningfully beyond what AC1-3 already prove at the data layer | Manual verification scenario 🔴 — direct post-merge browser check against `phase3`, `wucp`, `phase4-opus`, `mfc`, `wfp`, matching this session's established live-verification convention (`bsgm-s1` et al.) |

---

## Test Data Strategy

**Source:** Synthetic fixtures for AC1/AC2 (matching `check-fapg-s1-group-artefacts-by-story.js`'s own `makeTempRepoWithPipelineState` convention); real, already-committed `.github/pipeline-state.json` for AC3 (read-only assertion against the actual post-fix data, not a fixture).
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A fixture feature with one story slug registered both as a bare-string epic member and a full flat object | Synthetic, temp `pipeline-state.json` | None | |
| AC2 | Same fixture shape, plus a second slug registered only in the flat list | Synthetic | None | |
| AC3 | The real, already-corrected `.github/pipeline-state.json` in this repo | Real repo data (read-only) | None | |
| AC4 | The real, already-deployed features listed above | Real production data (read-only browser check) | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### `getFeatureStoryStructure` excludes a flat slug already present in an epic (AC1)

- **Verifies:** AC1
- **Precondition:** A fixture feature with one epic (`stories: ['x.1']`) and a flat `stories: [{ id: 'x.1', ... }]` — the same slug in both places, matching the schema-documented "Phase 3+ style".
- **Action:** Call `getFeatureStoryStructure(repoRoot, featureSlug)`.
- **Expected result:** `epics[0].storySlugs` contains `'x.1'`; `flatStorySlugs` does NOT contain `'x.1'`.
- **Edge case:** No.

### `groupArtefactsByStory` renders a dual-registered story's artefacts once, under its epic (AC1)

- **Verifies:** AC1
- **Precondition:** A `storyStructure` already deduped as above (epic contains `x.1`, `flatStorySlugs` does not); an artefact list containing `{ path: '.../x.1-something.md' }`.
- **Action:** Call `groupArtefactsByStory(artefacts, storyStructure)`.
- **Expected result:** The artefact appears in `result.epics[0].stories[0].artefacts`; `result.flatStories` is empty (no duplicate group for `x.1`).
- **Edge case:** Yes — this is the exact duplication scenario from the reported defect.

### `getFeatureStoryStructure` does not exclude a flat-only slug with no epic membership (AC2, regression guard)

- **Verifies:** AC2
- **Precondition:** A fixture feature with one epic (`stories: ['x.1']`) and a flat `stories: [{id:'x.1'}, {id:'y.1'}]` — `y.1` has no epic membership.
- **Action:** Call `getFeatureStoryStructure(repoRoot, featureSlug)`.
- **Expected result:** `flatStorySlugs` contains `'y.1'` (unaffected) but not `'x.1'` (deduped per AC1).
- **Edge case:** No.

### Real `pipeline-state.json` correctly registers all 30 previously-missing story slugs (AC3)

- **Verifies:** AC3
- **Precondition:** None — reads the actual, already-committed `.github/pipeline-state.json`.
- **Action:** For each of the 4 target features, resolve the epic (or flat list, for `mfc`) each story should now belong to and check membership.
- **Expected result:** `2026-04-14-skills-platform-phase3`'s `e1-governance-chain-integrity` epic contains `p3.18`–`p3.22` (5); `2026-04-19-skills-platform-phase4-opus`'s 4 epics collectively contain all 23 of their own story files' slugs; `2026-05-05-web-ui-model-first-chat`'s flat `stories[]` contains an entry with `id: 'mfc.2'`; `2026-05-26-bsr-workforce-planner`'s `wfp-planning-dashboard` epic contains `wfp.11`.
- **Edge case:** No — this is a direct assertion against production data, not a fixture.

---

## Integration Tests

None — both functions under test are pure with no I/O beyond `getFeatureStoryStructure`'s own existing disk read (already exercised end-to-end by `check-fapg-s1-group-artefacts-by-story.js`, which this story's tests are added alongside, not replacing).

---

## NFR Tests

None — pure data-classification and data-integrity fix, no performance/security/accessibility surface.

---

## Out of Scope for This Test Plan

- The two follow-up items (`ougl` dot/dash mismatch, `wuce` missing sprint-0/sprint-2 epics) — not fixed in this story, so not tested here.
- Backfilling full tracking objects for phase4-opus's 23 stories or phase3's existing epic-only bare-string members — registration for rendering purposes only.
- Full E2E Playwright coverage of the rendered accordion — AC1-3's tests directly exercise the data-classification and data-integrity layers; AC4's manual scenario confirms the real rendered outcome once deployed.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC4's live-production confirmation cannot run pre-merge | Requires the fix deployed to see the real pages re-render correctly | Manual verification scenario 🔴 in the AC verification script, performed post-merge |

## Test Plan: Replace the multi-story artefact accordion with a compact feature-level table and document matrix

**Story reference:** artefacts/2026-09-06-feature-artefact-document-matrix/stories/fadm-s1-replace-artefact-accordion-with-document-matrix.md
**Test plan author:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-06

**Test runner confirmed from `package.json`:** `npm test` → `node scripts/run-all-tests.js`.

**E2E detection (Step 3a):** AC1/AC2/AC3/AC4 assert generated HTML structure (table/matrix markup, cell content, link hrefs) via unit tests against the render functions directly — no CSS layout, visual alignment, or browser rendering dependency. Not applicable for E2E.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Feature-level documents render as one table | 2 tests | — | — | — | — | 🟢 |
| AC2 | Story/epic documents render as one matrix, dynamic columns | 4 tests | — | — | — | — | 🟢 |
| AC3 | DoR vs DoR Contract column disambiguation | 3 tests | — | — | — | — | 🟢 |
| AC4 | Epic document linked from divider row, not duplicated | 2 tests | — | — | — | — | 🟢 |
| AC5 (regression guard) | Single-story rendering unchanged | 1 test | — | — | — | — | 🟢 |
| AC6 (regression guard) | Resume-conversation affordance preserved | 1 test | — | — | — | — | 🟢 |
| AC7 | Live production confirmation, 3 real features | — | — | — | 1 scenario | Untestable-by-nature (requires deployed environment) | 🔴 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in the current suite | Handling |
|-----|----|----------|------------------------------------------|---------|
| Whether the new table/matrix actually renders correctly on real, already-approved production features | AC7 | Untestable-by-nature | Requires the fix deployed against real GitHub-hosted repo content and real pipeline-state.json shapes — cannot be simulated meaningfully beyond what AC1-6's unit tests already prove at the render-logic layer | Manual verification scenario 🔴 — direct post-merge browser check against the 3 features named in the story, matching this session's established live-verification convention |

---

## Test Data Strategy

**Source:** Synthetic fixtures (matching `check-fapg-s1-group-artefacts-by-story.js`'s own `makeTempRepoWithPipelineState` convention) for AC1-6; real, already-deployed features for AC7.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A fixture feature with feature-level artefacts of multiple types | Synthetic | None | |
| AC2 | A fixture feature with 2+ epics, several stories, and stories that intentionally have differing document sets (to prove columns are the union, and dashes appear for gaps) | Synthetic | None | |
| AC3 | A fixture story with both a `dor/<slug>-dor.md` and a `dor/<slug>-dor-contract.md` | Synthetic | None | |
| AC4 | A fixture with an epic that has its own `epics/<slug>.md` document | Synthetic | None | |
| AC5 | A fixture single-story feature | Synthetic | None | |
| AC6 | A fixture with a completed, resumable journey stage | Synthetic | None | |
| AC7 | The real, already-deployed `psh`, `phase3`, and one further multi-story feature | Real production data (read-only browser check) | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Feature-level documents render as one table, not per-type cards (AC1)

- **Verifies:** AC1
- **Precondition:** A fixture feature with `discovery.md`, `benefit-metric.md`, `decisions.md`, `nfr-profile.md` at the feature root.
- **Action:** Render the artefact index page.
- **Expected result:** Exactly one `<table>` contains all 4 rows; zero `.sw-card` sections exist for these 4 types (the old per-type-card markup is gone).
- **Edge case:** No.

### Feature-level table includes an artefact type not in the 4 known labels (AC1, regression guard)

- **Verifies:** AC1
- **Precondition:** A fixture feature with a `reference/some-doc.md` file at the feature level.
- **Action:** Render the artefact index page.
- **Expected result:** The reference document still appears as a row in the feature-level table — no document is silently dropped by the table's own type handling.
- **Edge case:** Yes — an artefact type outside the 4 named in the story.

### Matrix columns are the union of document kinds actually present, not a fixed set (AC2)

- **Verifies:** AC2
- **Precondition:** A fixture with 2 stories: story A has `dor`, `dod`; story B has `dor`, `plan`, `test-plan` (no overlap beyond `dor`).
- **Action:** Render the matrix.
- **Expected result:** Exactly 4 columns exist (`dor`, `dod`, `plan`, `test-plan`) — the union, not the intersection and not a hardcoded fixed list.
- **Edge case:** Yes — proves columns are computed, not assumed.

### A story missing a document shows a dash in that column (AC2)

- **Verifies:** AC2
- **Precondition:** Same fixture as above.
- **Action:** Render the matrix.
- **Expected result:** Story A's `plan` and `test-plan` cells show a dash (not a checkmark, not blank, not an error).
- **Edge case:** No.

### A present document's cell is a link to the real document (AC2)

- **Verifies:** AC2
- **Precondition:** A fixture story with a `dor/x-dor.md` file.
- **Action:** Render the matrix.
- **Expected result:** The `dor` column's cell for that story contains an `<a>` whose decoded href resolves to that exact document's real relative path (matching `adlr-s1`'s own link-encoding convention).
- **Edge case:** No.

### Epic-nested stories render under a non-interactive epic-divider row, flat stories do not (AC2)

- **Verifies:** AC2
- **Precondition:** A fixture with one epic-nested story and one flat story.
- **Action:** Render the matrix.
- **Expected result:** The epic-nested story's row is preceded by a divider row naming its epic; the flat story's row has no such divider.
- **Edge case:** Yes — mixed epic-nested/flat fixture.

### `dor/<slug>-dor.md` and `dor/<slug>-dor-contract.md` occupy two distinct columns (AC3)

- **Verifies:** AC3
- **Precondition:** A fixture story with both files present.
- **Action:** Derive matrix columns and render the matrix for this story.
- **Expected result:** Two separate columns exist ("Ready check" and "Ready check contract" or equivalent distinct labels); the story's row shows a checkmark in both, not one column covering both files.
- **Edge case:** Yes — the exact ambiguity this AC exists to close.

### A story with only `dor/<slug>-dor.md` (no contract) shows a dash in the contract column (AC3, regression guard)

- **Verifies:** AC3
- **Precondition:** A fixture story with only the `-dor.md` file.
- **Action:** Render the matrix.
- **Expected result:** "Ready check" column ticks; "Ready check contract" column shows a dash — proves the two columns are genuinely independent, not one column silently covering both cases.
- **Edge case:** No.

### The column-derivation helper is independently unit-tested apart from rendering (AC3)

- **Verifies:** AC3
- **Precondition:** A list of raw file paths covering `dor`, `dor-contract`, `dod`, `plan`, `review`, `test-plan`, `verification-scripts`, and a bare `stories/<slug>.md`.
- **Action:** Call the dedicated column-derivation function directly on each path.
- **Expected result:** Each path maps to its own distinct, correct column key — confirmed independent of any HTML rendering.
- **Edge case:** No.

### An epic's own document links from its divider row, not a separate row (AC4)

- **Verifies:** AC4
- **Precondition:** A fixture epic with its own `epics/e1-something.md` file and 2 stories.
- **Action:** Render the matrix and the feature-level table.
- **Expected result:** The epic document's link appears in the epic's own divider row; it does not appear as a matrix row, and it does not appear in the feature-level table.
- **Edge case:** No.

### An epic with no epic-level document renders its divider row without a broken or empty link (AC4, regression guard)

- **Verifies:** AC4
- **Precondition:** A fixture epic with stories but no `epics/<slug>.md` file of its own.
- **Action:** Render the matrix.
- **Expected result:** The divider row renders with the epic's name only, no link markup at all — no `href="#"` or empty-href artefact.
- **Edge case:** Yes.

### Single-story feature rendering is unchanged (AC5, regression guard)

- **Verifies:** AC5
- **Precondition:** A fixture single-story feature (matching `check-fapg-s1-group-artefacts-by-story.js`'s own existing single-story fixture).
- **Action:** Render the artefact index page.
- **Expected result:** No `<table class="doc-matrix">` (or equivalent) markup appears — output matches today's existing flat rendering exactly.
- **Edge case:** No.

### Resume-conversation affordance still renders for a resumable feature-level document (AC6, regression guard)

- **Verifies:** AC6
- **Precondition:** A fixture matching `check-fapg-s1-group-artefacts-by-story.js`'s own existing resume-link fixture (a completed, resumable discovery stage).
- **Action:** Render the artefact index page.
- **Expected result:** "Resume conversation" text still appears in the output, associated with the feature-level table's own discovery row.
- **Edge case:** No.

---

## Integration Tests

None — the render functions under test are pure (given artefact/story-structure input, produce HTML output); `handleGetFeatureArtefacts`'s own existing end-to-end wiring is already covered by `check-fapg-s1-group-artefacts-by-story.js`'s existing suite, which this story's tests extend, not replace (the one accordion-specific assertion in that suite is updated in place to assert the new matrix markup instead, per this story's own supersession of that rendering).

---

## NFR Tests

None — pure rendering-logic change, no performance/security/accessibility surface beyond what already exists (link generation reuses `adlr-s1`'s own already-tested encoding, not reintroduced here).

---

## Out of Scope for This Test Plan

- Any test of `getFeatureStoryStructure`/`groupArtefactsByStory` themselves — both are unchanged, already covered by `bsgm-s1`/`sri-s1`'s own existing suites.
- Sorting/filtering within the matrix — not built, not tested (explicitly out of scope per the story).
- Full E2E Playwright coverage of the rendered table/matrix's visual layout — AC1-6's unit tests directly exercise the generated markup; AC7's manual scenario confirms the real rendered outcome once deployed.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC7's live-production confirmation cannot run pre-merge | Requires the fix deployed to see the real pages re-render correctly against real, already-approved feature data | Manual verification scenario 🔴 in the AC verification script, performed post-merge |

# Test Plan: Collapse five independent label tables into one shared, corrected table

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s2-unified-label-table.md
**Epic reference:** artefacts/2026-09-06-canonical-artefact-trace/epics/canonical-artefact-trace.md
**Test plan author:** Copilot (Claude)
**Date:** 2026-09-06

**Target module (new):** `src/web-ui/adapters/artefact-labels.js`, exporting `resolveLabel(subdir, filename)` and `resolveColumnKey(subdir, filename)` (the latter reusing `features.js`'s existing `_deriveMatrixColumn` logic per AC2, not reimplementing it)
**Test runner:** `node scripts/run-all-tests.js`
**Test file:** `tests/check-cat-s2-unified-label-table.js`

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | All 14 subdirectories (11 existing + review, decisions, spikes) resolve to a defined, non-generic label | 1 (parameterised over 14 cases) | — | — | — | — | 🟢 |
| AC2 | `dor/` splits into `dor` vs `dor-contract` keys via reused `_deriveMatrixColumn` logic | 2 | 1 | — | — | — | 🟢 |
| AC3 | `CLAUDE.md`'s directory-tree list is updated with `review/`, `decisions/`, `spikes/` | — | — | — | 1 scenario | Untestable-by-nature | 🟡 |
| AC4 | Every existing test asserting an old-table label string passes unchanged or is updated with an explicit note | — | 1 (full-repo grep + suite run) | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in the configured runner | Handling |
|-----|----|----------|--------------------------------------------|---------|
| `CLAUDE.md` is a prose markdown file, not code — no automated assertion can verify its own directory-tree list was edited correctly ("correctly" here means human-legible, not machine-parseable) | AC3 | Untestable-by-nature | The check-*.js convention has no established pattern for asserting the *content* of `CLAUDE.md` prose sections, and inventing one would over-fit a single one-line list edit | Manual scenario in the verification script — a human reads the updated list and confirms `review/`, `decisions/`, `spikes/` are present, in the existing comma-separated format |

---

## Test Data Strategy

**Source:** Mixed
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | One filename per each of the 14 subdirectories | Synthetic: literal filename strings per subdir, table-driven | None | Parameterised single test with a 14-row fixture array inline in the test file |
| AC2 | A `-dor-contract.md` filename and a plain `-dor.md` filename | Synthetic: literal strings, e.g. `'psh-s1-dor-contract.md'` and `'psh-s1-dor.md'` | None | Cross-checked against `features.js`'s real, already-shipped `_deriveMatrixColumn` output for the identical inputs |
| AC3 | The current text of `CLAUDE.md`'s directory-tree list | Fixture: real file, `CLAUDE.md` at repo root | None | Manual scenario only — see gap table |
| AC4 | The set of existing tests referencing any of the 5 old label tables | Fixture: real repo — full-repo grep for `artefact-labels.js`, `plain-language-labels.js`, `SUBDIR_TYPE_MAP`, `ARTEFACT_SUBDIRS`, `SUBDIR_KEY` under `tests/` | None | Grep-then-run: identify affected test files, then run the full suite and diff pass/fail against pre-change baseline |

### PCI / sensitivity constraints

None.

### Gaps

None — AC3's gap is handled as an acknowledged manual-only scenario (see Coverage gaps table), not an unaddressed data gap.

---

## Unit Tests

### resolves each of the 14 recognised subdirectories to a non-generic label (AC1)

- **Verifies:** AC1
- **Precondition:** A table-driven fixture array of the 14 subdirectory names: `stories, epics, test-plans, verification-scripts, dor, plans, dod, trace, coverage, reference, research, review, decisions, spikes`
- **Action:** Call `resolveLabel(subdir, 'example.md')` for each of the 14
- **Expected result:** Every call returns a defined string that is not the raw filename `'example.md'` itself (the "generic fallback" the AC guards against) — asserted via a loop with one `assert.notStrictEqual(label, 'example.md')` per subdirectory
- **Edge case:** No

### spikes/ resolves to a real label, not a fallback (AC1, specific regression guard)

- **Verifies:** AC1
- **Precondition:** `resolveLabel('spikes', 'phase4-spike-1.md')`
- **Action:** Call the function
- **Expected result:** Returns a defined label distinct from the raw filename — this is the specific case the audit found unrecognised by any of the 5 old tables (seen in the legacy `phase4` feature)
- **Edge case:** Yes — this is the story's own named motivating gap

### review/ and decisions/ resolve to distinct labels from each other and from research/ (AC1, specific regression guard)

- **Verifies:** AC1
- **Precondition:** `resolveLabel('review', 'x.md')`, `resolveLabel('decisions', 'x.md')`, `resolveLabel('research', 'x.md')`
- **Action:** Call all three
- **Expected result:** All three return distinct, defined, non-generic labels — these are the two specific subdirectories the audit found "missing from some existing tables" plus one already-recognised control case
- **Edge case:** Yes

### distinguishes dor-contract.md from plain dor.md into two distinct column keys (AC2)

- **Verifies:** AC2
- **Precondition:** `resolveColumnKey('dor', 'psh-s1-dor-contract.md')` and `resolveColumnKey('dor', 'psh-s1-dor.md')`
- **Action:** Call both
- **Expected result:** `assert.notStrictEqual(key1, key2)` — the two resolve to different keys (e.g. `dor-contract` vs `dor`)
- **Edge case:** No

### reuses features.js's existing _deriveMatrixColumn rather than reimplementing the split (AC2)

- **Verifies:** AC2
- **Precondition:** `freshRequire` both `artefact-labels.js` and `features.js`
- **Action:** Compare `resolveColumnKey('dor', 'x-dor-contract.md')`'s output against `features.js`'s own exported `_deriveMatrixColumn('dor/x-dor-contract.md')` output for the equivalent path
- **Expected result:** The two agree — confirming `artefact-labels.js` calls into the same logic rather than duplicating it (a source-read check at test-authorship time confirms this is a call-through, not a lookalike reimplementation, since two independently-written functions could coincidentally agree on this one input while diverging on others)
- **Edge case:** Yes — this is the specific "not reimplementing it a second time" requirement in the AC text

---

## Integration Tests

### full existing test suite passes unchanged or with explicitly-noted updates after the shared table replaces the 5 old ones (AC4)

- **Verifies:** AC4
- **Components involved:** `artefact-labels.js` (new), every test file identified by the pre-implementation grep for the 5 old table names/functions
- **Precondition:** Full-repo grep completed (per the story's own Implementation note), affected test list recorded
- **Action:** Run `node scripts/run-all-tests.js` after the shared table lands
- **Expected result:** Every affected test either passes with zero changes, or was updated in the same commit with an inline comment explaining the label change (mirroring `fadm-s1`'s own precedent of updating `check-fapg-s1-group-artefacts-by-story.js` and `check-fpux.1-unify-visual-language.js` in place with documented rationale) — no affected test is silently deleted or left failing
- **Edge case:** No

---

## NFR Tests

None — confirmed with story owner. The story's own NFR section states table lookup has "no measurable cost, no dedicated NFR test needed," and accessibility/audit are marked not applicable for this data-layer-only story.

---

## Out of Scope for This Test Plan

- Any test of the storage convention itself (which folder an artefact type lives in) — out of scope per the story's own Out of Scope section; this story only changes labeling/keying of existing folders.
- Any UI-visible rendering test — covered in `cat-s4`'s test plan, which consumes this table's output.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC3 (`CLAUDE.md` prose edit) has no automated test | Markdown prose content has no established assertion convention in this repo's test suite | Manual verification scenario in the AC verification script; low risk given it is a single-line, human-reviewable list edit |

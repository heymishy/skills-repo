## Test Plan: Selector derivation generalises beyond one AC, with a manual fallback for ACs with no E2E coverage

**Story reference:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s2-selector-derivation-from-e2e-specs.md
**Epic reference:** artefacts/2026-10-19-real-playback-capture-automation/epics/real-playback-capture-cli.md
**Review reference:** artefacts/2026-10-19-real-playback-capture-automation/review/rpca-s2-review-1.md (PASS, run 1)
**Test plan author:** Claude Sonnet 5
**Date:** 2026-10-19
**Test runner:** `node scripts/run-all-tests.js`

---

## Note on Step 2 (test context) and Step 3 (test data strategy)

**Test context:** Option 1 — this repo's own configured runner, no stack deviation.
**Test data strategy:** Option 1 — Synthetic. Unlike `rpca-s1`, this story's own logic (parsing local `tests/e2e/*.spec.js` files, reading a local `selectors-manual.json` fallback file) needs no real secret or network access — all 4 ACs are fully testable with fixture files.

---

## Note on Step 3a (E2E / browser-layout detection)

No AC triggers a CSS-layout-dependent pattern or an external-dependency pattern. All 4 ACs are pure local file-parsing logic.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Derives `{acId, selector}` from an E2E spec file naming the AC | 1 test | — | — | — | — | 🟢 |
| AC2 | Falls back to `selectors-manual.json` when no E2E match exists | 1 test | — | — | — | — | 🟢 |
| AC3 | Skips + warns (not crash) when neither source has an entry | 1 test | — | — | — | — | 🟢 |
| AC4 | A full multi-AC run captures what it can and reports counts | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. All 4 ACs are fully covered by this repo's own unit/integration runner with synthetic fixtures.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Fixture `.spec.js` file content with an AC-naming comment and a `page.locator(...)` call | Synthetic | None | Modelled on the real convention already used in `tests/e2e/fpd-s4-caption-sync.spec.js`'s own header comment |
| AC2 | Fixture `selectors-manual.json` with one AC's `{url, selector}` entry | Synthetic | None | |
| AC3 | Fixture set with one AC in neither source | Synthetic | None | |
| AC4 | Fixture directory combining all 3 cases at once | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### AC1 (unit): derives a selector from a real-shaped E2E spec fixture

- **Verifies:** AC1
- **Precondition:** Fixture spec file content: `// fixture-spec.spec.js -- E2E for X (rpca-fixture-story AC1)\n...page.locator('.fixture-selector')...`
- **Action:** Call the spec-parsing function with the fixture content and the AC id to look for
- **Expected result:** Returns `{acId: 'AC1', selector: '.fixture-selector'}`
- **Edge case:** No

### AC2 (unit): falls back to the manual file when no E2E match exists

- **Verifies:** AC2
- **Precondition:** No fixture spec file names the AC; fixture `selectors-manual.json` has `{"AC2": {"url": "/fixture", "selector": ".fixture"}}`
- **Action:** Call the acList-building function for an AC with no E2E match
- **Expected result:** Returns the manual fallback entry
- **Edge case:** No

### AC3 (unit): skips with a named warning, doesn't crash

- **Verifies:** AC3
- **Precondition:** An AC present in neither the E2E specs nor the manual fallback file
- **Action:** Call the acList-building function for that AC
- **Expected result:** Returns no entry for that AC, and a warning naming the specific AC id is produced (captured via a spied `console.warn` or equivalent) — the function does not throw
- **Edge case:** Yes — this is the "neither source" boundary

---

## Integration Tests

### AC4 (integration): a full multi-AC run reports correct capture/skip counts

- **Verifies:** AC4
- **Components involved:** The acList-building function, the CLI's own summary-output logic
- **Precondition:** A fixture feature with 4 ACs: 2 derivable from E2E specs, 1 from the manual fallback, 1 in neither
- **Action:** Run the CLI's own acList-building + summary step against this fixture
- **Expected result:** 3 ACs appear in the final capture list (2 E2E-derived + 1 manual), 1 is skipped with a named warning, and the summary output states "3 captured, 1 skipped" (or equivalent exact counts)

---

## NFR Tests

None — confirmed with story owner. The story's own NFR section states no new NFR beyond what `rpca-s1` already established.

---

## Out of Scope for This Test Plan

- Real network/staging behaviour — this story's own logic needs none; `rpca-s1`'s test plan already covers the auth/network layer
- Auto-generating E2E spec files — story's own Out of Scope item 2

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | All 4 ACs are pure local file-parsing logic, fully coverable with synthetic fixtures | N/A |

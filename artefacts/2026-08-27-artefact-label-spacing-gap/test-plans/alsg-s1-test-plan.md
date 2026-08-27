## Test Plan: Add a visible separator between an artefact's type label and its file link

**Story reference:** artefacts/2026-08-27-artefact-label-spacing-gap/stories/alsg-s1-fix-artefact-item-label-separator.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-27

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Label and link visually separated | 1 test | — | — | — | — | 🟢 |
| AC2 | Existing T5.2 regression unaffected | — | — | — | — | — | 🟢 |
| AC3 | Full-page render regression (dates, resume links) | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — minimal artefact fixtures, following `tests/check-wuce6-feature-navigation.js`'s existing `renderArtefactItem`/`renderArtefactIndexHtml` test pattern.
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained.

---

## Unit Tests

Tests added to a new file, `tests/check-alsg-s1-artefact-label-separator.js`, following `tests/check-wuce6-feature-navigation.js`'s existing plain-`assert` style.

### AC1: label and link are visually separated

- **Action:** Call `renderArtefactItem({ type: 'Discovery', name: 'artefacts/x/discovery.md', viewUrl: '/artefact/x/discovery' })`.
- **Expected result:** The returned HTML contains `Discovery:` immediately before the `<a` tag opens — confirming a real separator exists between the label span's closing tag and the link's opening tag, not just that both strings are present somewhere.

### AC2: existing regression suite unaffected

- **Action:** Re-run `tests/check-wuce6-feature-navigation.js` in full (not just T5.2).
- **Expected result:** All existing assertions pass unchanged.

### AC3: full-page render regression

- **Action:** Call `renderArtefactIndexHtml` with 2 artefacts of different types, one with a matching `resumeLookup` entry and one without.
- **Expected result:** Both rows show the new `Type:` separator; the row with a resume lookup still includes a correctly-spaced `Resume conversation` link; the row without one does not; both rows still include their `<time>` date element correctly spaced.

---

## Integration Tests

None beyond the existing `check-wuce6-feature-navigation.js` suite confirmed unaffected.

---

## E2E Tests

None. This is a static string-generation fix verifiable via direct function calls.

---

## NFR Tests

None named — story's own NFR section: no new risk.

---

## Out of Scope for This Test Plan

- Visual/screenshot regression testing — not warranted for a 2-character string change; the story's own NFR section already covers this reasoning.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |

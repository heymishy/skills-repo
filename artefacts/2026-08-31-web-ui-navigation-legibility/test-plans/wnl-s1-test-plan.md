## Test Plan: Collapse the always-expanded "Ref docs" context manifest into a single summary indicator

**Story reference:** artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s1-collapse-context-manifest.md
**Epic reference:** artefacts/2026-08-31-web-ui-navigation-legibility/epics/web-ui-navigation-legibility.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-09-10

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Collapsed summary shown by default | 2 tests | — | — | — | — | 🟢 |
| AC2 | Expand reveals unchanged chip list | 1 test | — | — | — | — | 🟢 |
| AC3 | Toggle is reversible (native `<details>`) | — | — | — | — | Untestable-by-nature (jsdom cannot simulate a real click-to-toggle round trip against a static-HTML unit test — this repo's own test convention for this file is string/DOM-shape assertion, not simulated interaction) | 🔴 |
| AC4 | Collapsed summary shows a warning cue without expanding | 2 tests | — | — | — | — | 🟢 |
| AC5 | Per-file chip markup byte-identical to today | 1 test | — | — | — | — | 🟢 |
| AC6 | Keyboard focus/activation via native semantics | — | — | — | — | Untestable-by-nature (native `<details>`/`<summary>` keyboard operability is a browser-spec guarantee, not something this story's own implementation can break without removing the native element entirely — AC3 covers the structural presence of native `<details>`, which is the only thing under this story's control) | 🔴 |

Step 3a note: none of this story's ACs are `CSS-layout-dependent` in the sense that trips Step 3a's trigger patterns (no `getBoundingClientRect`, no scroll/pointer-coordinate assertions, no on-screen-position verification). The collapse/expand state is native HTML `<details>`/`open`-attribute semantics, not a CSS layout computation — testable via the same raw-HTML-string-assertion convention this repo already uses for the pre-existing `tests/check-iwu1-context-manifest.js` (confirmed by reading that file directly before writing this plan). AC3 and AC6 are flagged `Untestable-by-nature` instead — not because they're layout-dependent, but because a static-HTML unit test cannot simulate the click-then-click-again interaction sequence or a real Tab/Enter keypress; native `<details>` provides both by browser specification, not by any code this story writes, so the meaningful test is confirming the native element is actually used (AC3) and nothing else re-implements or breaks that (no violation found across AC1/AC2/AC4/AC5's own tests).

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in this repo's unit-test convention | Handling |
|-----|----|----------|----------------------------------------------------------|---------|
| Reversible toggle interaction | AC3 | Untestable-by-nature | No interaction simulation in this repo's plain-string `check-*.js` convention; native `<details>` guarantees this behaviour | Manual scenario — see AC verification script 🔴 |
| Keyboard focus/activation | AC6 | Untestable-by-nature | Native browser keyboard semantics, not implementation-controlled behaviour | Manual scenario — see AC verification script 🔴 |

---

## Test Data Strategy

**Source:** Synthetic — literal in-test file-list arrays (`{ path, status }` objects), same pattern as the existing `tests/check-iwu1-context-manifest.js`.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1, AC2, AC5 | A small list of `{ path: 'x.md', status: 'ok' }` entries | Literal in-test array | None | Mirrors `check-iwu1`'s own T1/T2 fixtures |
| AC4 | A mixed list including at least one `status: 'warn'` entry | Literal in-test array | None | Mirrors `check-iwu1`'s own T5 fixture |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

New file: `tests/check-wnl-s1-context-manifest-collapse.js`, following the exact style of the pre-existing `tests/check-iwu1-context-manifest.js` (direct function import, custom `assert()` helper, `[wnl-s1]`-prefixed console output).

### collapsed-by-default-all-loaded

- **Verifies:** AC1
- **Precondition:** A list of 3 `{ path, status: 'ok' }` files.
- **Action:** Call the (modified) context-manifest builder.
- **Expected result:** Output contains a summary element (e.g. `id="context-manifest-summary"` or equivalent) whose text reads "Context loaded (3 files) ✓" (or the story's chosen exact copy), and the per-file chip markup is present but nested inside a `<details>` element that does **not** carry the `open` attribute.
- **Edge case:** No.

### collapsed-summary-reflects-exact-file-count

- **Verifies:** AC1
- **Precondition:** A list of 1 file vs. a list of 5 files (two sub-cases).
- **Action:** Call the builder for each.
- **Expected result:** Summary text reflects the exact count each time ("1 file" singular / "5 files" plural, or however the story's chosen copy pluralises) — not a hardcoded string.
- **Edge case:** Yes — singular/plural boundary.

### expand-reveals-unchanged-chip-list

- **Verifies:** AC2
- **Precondition:** Same 2-file fixture as `check-iwu1`'s own T1 (`product/mission.md`, `product/tech-stack.md`, both `status: 'ok'`).
- **Action:** Call the builder; extract the content inside the `<details>` element.
- **Expected result:** The extracted inner content, when compared against `buildContextManifestHtml()`'s own pre-existing (unmodified) output for the same input, is byte-identical for the per-chip markup portion (allows for the new wrapping structure around it, but not for any change inside it).
- **Edge case:** No.

### native-details-element-present-not-custom-js

- **Verifies:** AC3
- **Precondition:** Any non-empty file list.
- **Action:** Call the builder.
- **Expected result:** Output contains a real `<details>` opening tag (not a `<div>` with a custom `onclick` handler, not a new `<script>` block implementing toggle logic) — confirms the native, JS-free mechanism named in Architecture Constraints was actually used, which is the structural guarantee AC3's reversibility and AC6's keyboard operability both depend on.
- **Edge case:** No.

### warning-cue-visible-without-expanding

- **Verifies:** AC4
- **Precondition:** A list of 5 files where 1 has `status: 'warn'`.
- **Action:** Call the builder; extract only the summary element's own text (not the full output).
- **Expected result:** The summary text itself (outside the collapsed `<details>` body) contains a non-colour warning indicator — e.g. "4 of 5" and a ⚠ symbol or the word "missing" — distinguishable from the all-loaded case without needing to inspect the collapsed inner content.
- **Edge case:** Yes — this is the story's own explicitly-named edge case (AC4).

### warning-cue-absent-when-all-loaded

- **Verifies:** AC4 (negative case)
- **Precondition:** A list of files, all `status: 'ok'`.
- **Action:** Call the builder; extract the summary text.
- **Expected result:** No warning symbol or "missing"/partial-count language present in the summary.
- **Edge case:** Yes — negative-case companion to the above.

### per-file-markup-regression-guard

- **Verifies:** AC5
- **Precondition:** The same fixture set `check-iwu1`'s own T1, T5, T6, T7, T8 use (loaded files, a warn file, an empty list, and a file with a path attempting HTML injection).
- **Action:** Run both the pre-existing `buildContextManifestHtml()` (unmodified) and the new wrapping builder side by side; extract the inner per-chip markup from each.
- **Expected result:** Identical — `chip-ok`/`chip-warn` classes, escaped basenames, ✓/⚠ symbols, "loaded"/"missing" labels, and the empty-state placeholder are byte-for-byte unchanged from what exists today.
- **Edge case:** Yes — covers the empty-list and HTML-injection-attempt cases explicitly.

---

## Integration Tests

### iwu1-existing-suite-still-passes

- **Verifies:** AC5 (cross-check), general non-regression
- **Components involved:** `tests/check-iwu1-context-manifest.js` (pre-existing, unmodified test file) against the modified `src/web-ui/routes/skills.js`.
- **Precondition:** Implementation complete.
- **Action:** Run `node tests/check-iwu1-context-manifest.js` directly.
- **Expected result:** All 8 existing tests + the integration test still report PASS — confirmed by actually running the file, not assumed from reading its assertions (which is what `/review` flagged as the real gap in Run 1).

---

## NFR Tests

None — confirmed with story owner. Story's own NFR section states no material performance/security impact beyond the existing accessibility requirements, which are covered by the AC-level tests above (AC4's non-colour indicator, AC3/AC6's native-element structural check) rather than a separate NFR-specific test.

---

## Out of Scope for This Test Plan

- Real-browser keyboard interaction testing (AC6) — out of scope for this repo's plain-string unit-test convention; native `<details>` keyboard semantics are a browser guarantee, verified structurally (AC3's test) not behaviourally.
- Visual styling/appearance of the collapsed summary or expand icon — this story's ACs describe structural/textual behaviour, not visual design, matching the story's own scope.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC3 (toggle reversibility) and AC6 (keyboard activation) have no automated test | Native `<details>` behaviour, not implementation-controlled logic; this repo's plain-string unit-test convention cannot simulate a click/keypress interaction sequence | Manual verification scenario in the AC verification script (🔴), plus AC3's structural unit test confirming the native element is genuinely present (the only thing that could break this) |

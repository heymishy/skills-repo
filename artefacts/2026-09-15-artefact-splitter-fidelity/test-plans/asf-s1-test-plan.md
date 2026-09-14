# Test Plan: Fix web-UI-to-CLI artefact splitter parity bugs (asf-s1)

**Story:** artefacts/2026-09-15-artefact-splitter-fidelity/stories/asf-s1-fix-splitter-parity-bugs.md
**Track:** Short-track

---

## Test Cases

New test file `tests/check-asf-s1-splitter-parity-bugs.js`, using the real, unmodified fixtures that originally exposed both bugs (`artefacts/new-feature-2b74a292/definition.md` and `.../review.md`), matching the existing regression-fixture pattern already established by `check-defs-s1-definition-artefact-splitter.js` (`artefacts/new-feature-af17f555/definition.md`).

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Behavioural | `ep1-s1`'s generated `## User Story` has three distinct `As a` / `I want` / `So that` lines, with `I want`/`So that` sourced from the real `So that [goal], I need [need].` sentence |
| T2 | AC1 | Regression | Every one of the 13 real stories in the fixture has a genuine `I want` line, not just the one directly inspected |
| T3 | AC1 | Regression | The `So that` clause is never a verbatim duplicate of that story's own `## Benefit Linkage` section |
| T4 | AC2 | Behavioural | `ep1-s1`'s `## Architecture Constraints` section contains no `Given`/`When`/`Then` text (previously absorbed the adjacent unlabeled AC block) |
| T5 | AC2 | Regression | Across all 13 real stories, the word "Given" appears exactly once in each generated file — under `## Acceptance Criteria` only, never duplicated |
| T6 | AC3 | Behavioural | A synthetic story with no `So that ..., I need ...` sentence at all falls back to an explicit placeholder for both `I want` and `So that` — never reuses Benefit Linkage text as a fallback |
| T7 | AC4 | Behavioural | The real `review.md` fixture (13 stories, each `### Verdict: **FAIL** (Category C)` — heading-prefixed, trailing parenthetical) resolves every story to `**Outcome:** FAIL` |
| T8 | AC5 | Behavioural | A synthetic review artefact where one story has no recognisable Verdict line produces no split file for that story, while a sibling story with a real verdict still produces its own file |
| T9 | AC5 | Behavioural | A Verdict line containing both "PASS" and "FAIL" (genuinely ambiguous) is treated as unparseable — skipped, not guessed either way |
| T10 | AC6 | Behavioural | The real `review.md` fixture's split output states plainly that per-severity findings could not be reliably extracted (Category-based source format, no `### HIGH findings` heading), rather than presenting an empty findings list as `None.` |

## Regression coverage

- `tests/check-defs-s1-definition-artefact-splitter.js` (9 tests) — existing `af17f555` fixture regression, confirms the `sectionFor`/`findSpecialRegions` refactor doesn't change any already-correct extraction (field-order independence, Out of Scope bullet capture, AC block content, reference links, epic story listing, unrecognised-format graceful degradation, minimal-fields fallback, CRLF handling).
- `tests/check-revs-s1-review-artefact-splitter.js` (6 tests) — existing synthetic two-story fixture, confirms the instructed flat `**Verdict:** PASS|FAIL` format (the common case) still resolves correctly, per-story isolation still holds, run numbering still works, legacy flat-format graceful degradation still returns `[]`, CRLF handling still works.
- `tests/check-defs-revs-s1-wiring-into-turn-completion.js` (12 tests) — confirms both splitters remain correctly wired into `skills.js`'s turn-completion flow (flat artefact + split files both written/committed; repo-less products skip commit but still write to local disk).

## Out of Scope (per story)

- Strengthening the REVIEW PROTOCOL (Web UI) system-prompt instructions.
- Retroactively re-splitting any already-affected feature (all confirmed instances already manually corrected in a prior session).
- Any change to the flat, un-split artefact save path.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.

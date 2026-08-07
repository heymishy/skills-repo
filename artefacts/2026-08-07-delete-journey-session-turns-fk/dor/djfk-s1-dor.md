# Definition of Ready: Delete a journey's session_turns rows before the journey row, alongside artefacts

**Review artefact:** artefacts/2026-08-07-delete-journey-session-turns-fk/review/djfk-s1-review-1.md
**Story reference:** artefacts/2026-08-07-delete-journey-session-turns-fk/stories/djfk-s1-delete-session-turns-before-journey.md
**Test plan reference:** artefacts/2026-08-07-delete-journey-session-turns-fk/test-plans/djfk-s1-test-plan.md
**Assessed by:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## Contract Proposal

**What will be built:** In `src/web-ui/adapters/journey-store-pg.js`'s `deleteJourney(journeyId)`, add `await pool.query('DELETE FROM session_turns WHERE journey_id = $1', [journeyId])` before the existing `artefacts` and `journeys` deletes.

**What will NOT be built:** Any change to `session_turns_archive` (no FK, not affected); any change to the higher-level `journey-store.js` wrapper (unchanged signature/return shape).

**How each AC will be verified:** Per the test plan — 4 unit tests against a mocked pool asserting statement order, params, and return shape.

**Assumptions:** None beyond what's in the story.

**Estimated touch points:** `src/web-ui/adapters/journey-store-pg.js` (one function), a new `tests/check-djfk-s1-delete-journey-session-turns.js`.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: operator deleting a journey with recorded turns |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC3 all covered |
| H4 | Out-of-scope section is populated | ✅ | 3 items named |
| H5 | Benefit linkage field references a named metric | ✅ N/A (short-track) | Direct correctness fix with a real mechanism sentence |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 1: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Matches existing `artefacts` pattern exactly; Run 1 review: 0 HIGH |
| H-E2E | CSS-layout-dependent AC check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile or explicit "None" | ✅ | Story's NFR section: "None identified"/"Not applicable" |
| H-GOV | `## Approved By` in discovery | ✅ N/A | Short-track, no discovery artefact |
| H-ADAPTER | D37 wiring check | ✅ N/A | No new adapter |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script | Hamish King — solo-maintainer RISK-ACCEPT, consistent with this session's established pattern |

All other warnings: ✅.

---

## Standards injection

Domain tags: `[data]`. Matched standards files: `.github/standards/data/data-standards.md` (confirmed present).

---

## Oversight level

**Low** — no parent epic, Complexity 1, single-function fix matching an existing pattern.

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight)

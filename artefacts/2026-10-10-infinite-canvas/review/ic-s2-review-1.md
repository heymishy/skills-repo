# Review Report: Free node positioning persisted across reloads — Run 1

**Story reference:** artefacts/2026-10-10-infinite-canvas/stories/ic-s2.md
**Date:** 2026-10-10
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Completeness — NFRs state position-save is *"fire-and-forget... no blocking spinner"*, but **no AC or NFR covers the failure path** (network or server error on the position-save request). As written, a save that silently fails leaves the operator believing a drag persisted when it didn't — on reload, the node snaps back to its old position with no explanation given. This is the same class of gap this session's own post-delivery review of the prior `customer-journey-as-first-class` feature already found and logged (stage-panel autosave not reflecting failure/staleness without a reload — see `capture-log.md`, 2026-10-10). Fix: add an AC (or revise the NFR) specifying a minimum failure-surfacing behaviour — at minimum a console-logged error; ideally a visible toast matching this app's own existing "Stage order not saved — please try again" pattern from `ep1-s4`.
  Risk if proceeding: operators silently lose repositioning work and may distrust the canvas as "flaky" without ever being told why — directly undermines M2 (CX judgment).
  To acknowledge: run /decisions, category RISK-ACCEPT.

---

## LOW findings — note for retrospective

- **[1-L1]** Architecture Constraints doesn't name which real migration file (`scripts/migrate-schema-journeys.js`, following the established convention observed in `ep5-s1`/`ep5-s3`) the new `position_x`/`position_y` columns are added to, vs. a new migration script. Not blocking — `/definition-of-ready`'s Coding Agent Instructions typically pin this down — but worth naming explicitly here too, since AC4 already assumes a specific "idempotent `ADD COLUMN IF NOT EXISTS`" pattern that implies modifying the existing file.

---

## Summary

0 HIGH, 1 MEDIUM, 1 LOW across 1 story.
**Outcome:** PASS

---

## Score Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 5 | PASS |
| Completeness | 3 | PASS |
| Architecture compliance | 5 | PASS |

**Verdict:** PASS — all criteria scored 3 or above. The MEDIUM finding (1-M1, missing failure-path handling) should be resolved before `/definition-of-ready`, or explicitly RISK-ACCEPTed if the operator judges fire-and-forget acceptable for MVP.

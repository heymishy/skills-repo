# Review Report: ep1-s4 — Run 1

**Story reference:** artefacts/[feature]/stories/ep1-s4.md
**Date:** 2026-10-07
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

**4-M1:** AC3 (keyboard alternative) says "e.g. up/down controls on the stage card or reorder controls in the side panel" — the "e.g." leaves the implementation undefined at DoR time. The keyboard alternative mechanism must be specified (not "e.g.") because the test plan must assert a specific interaction. The design artefact defers this to story level — this story is that story-level decision point.

**4-M2:** AC1 ("updates `position` values of all affected stages in a single Postgres transaction") — "all affected" is ambiguous for drag-and-drop. Specify whether this is a full rebalance of all stages in the journey or only the contiguous range between the source and target positions.

---

## LOW findings — note for retrospective

**4-L1:** ADR-018 anti-pattern reference is correct ("drop target must not be at exact geometric center") — but the ACs don't include a test case asserting this. This should be a test-plan requirement, but noting it is not in the AC set.

---

## Summary

**Outcome:** PASS

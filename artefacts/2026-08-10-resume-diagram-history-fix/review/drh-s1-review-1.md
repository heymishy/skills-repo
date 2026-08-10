## Review: drh-s1 — Diagrams generated during a live /ideate session never appear when resuming/viewing that stage's history

**Story:** artefacts/2026-08-10-resume-diagram-history-fix/stories/drh-s1-resume-history-diagram-rendering.md
**Reviewer:** Claude (agent), operator-directed — found and reported directly by the operator on real production usage
**Date:** 2026-08-10

---

### Category A: Traceability

PASS. Exceptionally well-grounded: cites the exact route/function (`handleGetJourneyStageView`), the exact deliberate-but-undocumented sentinel-renaming trick causing the gap, and two independently-confirmed mechanical facts (markers live in raw turn content; `readOnly` mode suppresses the entire rendering script) that together fully explain the observed symptom. Directly traces to the operator's own words ("resuming... doesn't show the diagrams as I'd expect").

### Category B: Scope discipline

PASS. Explicitly and repeatedly draws the line between "diagrams" (in scope, static/replayable) and "interactive lens/assumption/condition controls" (out of scope, genuinely needs live state) — this distinction is the crux of the whole fix and is stated clearly and consistently across Architecture Constraints, AC4, and Out of Scope. Correctly extends scope to `design`/`definition` (AC5) rather than an `ideate`-only fix, since the underlying gap is identical across all three skills that can emit diagrams — this is the right call, not scope creep, since leaving `design`/`definition` broken would just relocate the same bug.

### Category C: AC quality

PASS. 6 ACs, Given/When/Then, each independently testable. AC3 and AC6 are explicit safety/regression guards (malformed-marker resilience, no-diagram case unaffected). AC4 is an unusually important negative assertion — it's the AC that prevents this fix from silently reintroducing the interactivity the original design correctly excluded.

### Category D: Completeness

PASS. NFRs correctly identify Security (reusing mermaid's existing strict security level, not inventing new escaping) and Performance (no new queries) as genuine, checkable properties rather than boilerplate. Complexity rated 2, appropriately — the fix is fully understood but touches two files and must thread a real constraint (preserve readOnly guarantees while adding new capability) carefully.

### Category E: Architecture compliance

PASS. Reuses the existing, already-proven `window.__SW_INITIAL_CANVAS_BLOCKS__` pattern (used for the live page's own analogous resume-after-redeploy case) rather than inventing a new mechanism — a good sign of pattern reuse discipline. Correctly identifies that a full reuse of the live `scriptHtml` would be wrong (it would restore excluded interactivity) and calls for a narrower, purpose-built addition instead.

---

### Verdict

**PASS — 0 HIGH findings.** A precisely root-caused fix for a real, operator-identified gap in a stated product differentiator. The AC4/Out-of-Scope discipline around not restoring interactivity is the single most important judgment call in this story, and it's made clearly and consistently. Cleared to proceed to `/test-plan`.

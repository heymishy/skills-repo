# Definition of Done: As-built System Architecture diagram generation via static service-call detection

**PR:** https://github.com/heymishy/skills-repo/pull/612 | **Merged:** 2026-07-26
**Story:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s7-as-built-system-architecture-diagram.md
**Test plan:** artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s7-test-plan.md
**DoR:** artefacts/2026-07-25-code-shape-diagrams/dor/csd-s7-dor.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — statically detects `require()` calls to allowlisted external-service packages, resolves to named service labels | ✅ | `check-csd-s7-as-built-system-architecture-diagram.js` | Automated test, re-run fresh 2026-08-17 | None |
| AC2 — renders as a mermaid `flowchart` in the exact shape `compareSystemArchitecture()` already parses, no comparator changes | ✅ | Same file | Automated test, re-run fresh | None |
| AC3 — zero services found produces a valid empty-edges flowchart, not an error | ✅ | Same file, "zeroServicesFoundProducesValidEmptyFlowchartNotAnError (AC3)" | Automated test, re-run fresh | None |
| AC4 — written to the feature's artefact folder as a versioned file, reusing csd-s5's `writeAsBuiltDiagramArtefact()` | ✅ | Same file | Automated test, re-run fresh | None |
| AC5 — end-to-end comparison against an as-designed diagram runs with no change to `drift-comparator.js` | ✅ | Same file | Automated test, re-run fresh | None |

---

## Scope Deviations

None identified in this retroactive pass. This story explicitly closed the last open gap in the `csd-e1-code-shape-diagrams` epic (csd-s6's drift-comparison logic previously had no real as-built System Architecture generator to exercise against) — confirmed by its own Benefit Linkage framing, consistent with `r-canvas-render-and-story-extraction-fix`'s own notes (a separate, later retrospective) describing this same story as "the epic's own follow-up (csd-s7)."

---

## Test Plan Coverage

**Tests passing:** 9/9 (`check-csd-s7-as-built-system-architecture-diagram.js`), re-run fresh 2026-08-17 — matches the test-plan's originally-recorded 9/9 exactly, no drift.
**Gaps:** None identified.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: static scan completes within the normal `/verify-completion` session time budget | ✅ | `staticScanCompletesWithinNormalSessionTimeBudget (NFR-Performance)`, re-run fresh, passing |
| Security: never surfaces credentials/connection strings/API keys, only package name + requiring file | ✅ | `noCredentialOrSecretContentInGeneratedDiagram (NFR-Security)`, re-run fresh, passing |
| Audit: generation events logged, consistent with csd-s5's convention | ✅ | `generationEventsAreLogged (NFR-Audit)`, re-run fresh, passing |

---

## Metric Signal

**Metrics:** P1 (Time-to-drift-determination), P3 (Diverged-flag true-positive rate), from `artefacts/2026-07-25-code-shape-diagrams/benefit-metric.md`.
**Status:** Prior to this story, P1/P3 could never be measured for System Architecture diagrams specifically (only Data Model and Program Design had real as-built generators) — this story closes that measurement gap by construction. No fresh production-usage measurement taken in this pass.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required — story's own text confirms it closes the epic's last open gap, no downstream story depends on it.

---

## DoD Observations

1. ~3 weeks live in production, no incidents reported.
2. This story was already referenced by name in an earlier DoD write-up in this same backlog pass (`r-canvas-render-and-story-extraction-fix-dod.md`, discussing outer-loop process precedent) before its own DoD had been written — now closed, resolving that forward reference.

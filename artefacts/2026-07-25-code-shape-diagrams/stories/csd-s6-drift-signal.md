# Story: Drift signal — as-designed vs as-built comparison

**Epic reference:** artefacts/2026-07-25-code-shape-diagrams/epics/csd-e1-code-shape-diagrams.md
**Discovery reference:** artefacts/2026-07-25-code-shape-diagrams/discovery.md
**Benefit-metric reference:** artefacts/2026-07-25-code-shape-diagrams/benefit-metric.md

## User Story

As a **Developer/engineer**,
I want **to see a match/diverged signal per diagram type in canvas, comparing the as-designed diagram against the as-built one, with type-specific drift rules**,
So that **I can determine in under 30 seconds whether what got built matches what was designed, without reading the diff**.

## Benefit Linkage

**Metric moved:** P1 — Time-to-drift-determination (directly — this is the mechanism); P3 — Diverged-flag true-positive rate (this story implements the type-specific rules designed to keep false positives low); M1 — Drift caught before it became a problem.
**How:** This story is the actual comparison mechanism the whole epic exists to deliver — every other story builds a precondition for this one.

## Architecture Constraints

- ADR-026: the Data Model drift rule specifically checks for non-optimal design (new/duplicate object where an existing one already served the purpose), not just structural add/remove/rename.
- Uses csd-s2's rendering mechanism to display the signal — no new rendering path.

## Dependencies

- **Upstream:** csd-s3, csd-s4 (as-designed diagrams), csd-s5 (as-built diagrams).
- **Downstream:** None — last story in the epic.

## Acceptance Criteria

**AC1:** Given an as-designed and as-built Data Model diagram for the same feature, When compared, Then the drift check flags "diverged" if any table, column, or relationship was added, removed, or renamed, and specifically flags a case where a new or duplicate entity was created where an existing one already served the purpose.

**AC2:** Given an as-designed and as-built Program Design diagram, When compared, Then the drift check flags "diverged" only on call-stack/file-tree structural changes — a renamed local variable within an otherwise-unchanged file structure does not trigger a diverged flag.

**AC3:** Given an as-designed and as-built System Architecture diagram, When compared, Then the drift check flags "diverged" on new or removed service-to-service calls.

**AC4:** Given no drift is detected for a diagram type, When the operator views canvas, Then a clear "Matches" signal is shown for that type — not silence or the absence of a flag — so the operator isn't left wondering whether the check ran at all.

**AC5:** Given a "diverged" signal, When the operator views canvas, Then the specific difference is named (e.g. "New table `x` added, no matching entity in the as-designed diagram") — not a bare "diverged" label with no detail, per discovery's own MVP requirement.

## Out of Scope

- Fully automated semantic verdict ("this diff is safe/unsafe") — the signal is a flagged comparison the operator interprets, per discovery's own out-of-scope decision.
- Automatically fixing the underlying drift — this story only surfaces the signal, it does not remediate.

## NFRs

- **Performance:** Drift comparison completes within the normal `/verify-completion` session time budget.
- **Security:** None identified beyond what csd-s4/csd-s5 already cover (structure only, never row-level data).
- **Accessibility:** The match/diverged signal must be conveyed through more than colour alone (e.g. an icon or text label), consistent with WCAG 2.1 AA — even though this feature is technical/architecture diagrams, not UX design artefacts, basic accessibility still applies to the canvas UI itself.
- **Audit:** Drift check results (matched/diverged, per diagram type, per feature) are logged, since this is the evidence P3 and M1 measurement depends on.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

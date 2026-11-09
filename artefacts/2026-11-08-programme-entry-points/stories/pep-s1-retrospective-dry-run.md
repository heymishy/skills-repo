## Story: Retrospective dry-run of /programme Steps 0-6 against skills-platform-phase4

**Epic reference:** artefacts/2026-11-08-programme-entry-points/epics/pep-e1-validate-entry-points.md
**Discovery reference:** artefacts/2026-11-08-programme-entry-points/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-programme-entry-points/benefit-metric.md

## User Story

As a **platform maintainer validating skill readiness**,
I want to **run `/programme`'s full Step 0–6 flow retrospectively against `skills-platform-phase4`'s real historical artefacts**,
So that **gaps in a never-exercised skill are found now, synthetically and cheaply, rather than live under pressure during a real transformation**.

## Benefit Linkage

**Metric moved:** Retrospective dry-run validity (meta)
**How:** This story's own output — a documented pass/fail/gap verdict per step — is literally what this meta-metric measures. There is no separate measurement step; the artefact this story produces is the evidence.

## Architecture Constraints

- None identified — this is a documentation/analysis story reading existing artefacts (`skills/programme/SKILL.md`, `artefacts/archived/2026-04-19-skills-platform-phase4/`); it does not modify any governed file itself (that's story 2's job).
- Must treat `skills-platform-phase4`'s real historical record as ground truth — this story answers Step 0's Q1–Q4 and the later steps' prompts *as if* an operator were answering them honestly about phase4's real history (1 operator, 5 epics, 2-day span, no cross-team dependencies, no phase gates, no consumer migration), not a hypothetical idealized version of phase4.

## Dependencies

- **Upstream:** None
- **Downstream:** pep-s2 (patches are scoped by what this story finds).

## Acceptance Criteria

**AC1:** Given `/programme`'s Step 0 Q1–Q4 are answered honestly against phase4's real historical profile, When the scoring table is applied, Then the dry-run records the actual verdict (pass/fail) with the specific signals that did or didn't apply — not an assumed outcome.

**AC2:** Given Steps 1–6 (`Basic identity`, `Timeline and phases`, `Workstream registration`, `Cross-workstream dependencies`, `Consumer registry`, `Programme artefact`) are each walked through using phase4's real archived artefacts (205 files at `artefacts/archived/2026-04-19-skills-platform-phase4/`) as the source of truth, When each step's prompts are answered from that real data, Then the dry-run records, per step, whether phase4's actual history would have satisfied that step's requirements, would have required real adaptation, or reveals a genuine gap in the step's own design.

**AC3:** Given the dry-run encounters a step whose instructions assume something phase4's real history doesn't have (e.g. Step 5's consumer registry, scoped to "service/library rewrite" types only — phase4 may not be that type), When this happens, Then the dry-run records this as a scoping mismatch, not a false "gap," and notes which of Step 1's 4 initiative types phase4's real history best matches.

**AC4:** Given all 7 steps have been walked through, When the dry-run is complete, Then a single write-up artefact exists (`artefacts/2026-11-08-programme-entry-points/reference/pep-s1-dry-run-findings.md` or equivalent) listing, per step, its verdict and any concrete, actionable gap found — this is the direct input to story 2's scope, not a narrative summary without actionable findings.

## Out of Scope

- Validating against any historical case other than `skills-platform-phase4`.
- Actually patching any gap found — that's pep-s2's job; this story only documents.

## NFRs

- **Performance:** Not applicable.
- **Security:** Not applicable — no credentials, no new code.
- **Accessibility:** Not applicable.
- **Audit:** The write-up artefact itself is the audit trail for this validation exercise.

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable (by design — see epic-level note)

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

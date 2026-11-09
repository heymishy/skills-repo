# DoR Contract: Retrospective dry-run of /programme Steps 0-6 against skills-platform-phase4

**Story reference:** artefacts/2026-11-08-programme-entry-points/stories/pep-s1-retrospective-dry-run.md
**Date:** 2026-11-09

## Contract Proposal — Retrospective dry-run of /programme Steps 0-6 against skills-platform-phase4

**What will be built:**
A single write-up artefact at `artefacts/2026-11-08-programme-entry-points/reference/pep-s1-dry-run-findings.md` produced by walking `skills/programme/SKILL.md`'s Step 0 (Q1-Q4 scoring) and Steps 1-6 (Basic identity, Timeline and phases, Workstream registration, Cross-workstream dependencies, Consumer registry, Programme artefact) against `skills-platform-phase4`'s real, already-archived history at `artefacts/archived/2026-04-19-skills-platform-phase4/` (205 files, 5 epics, 2-day git-committed span, 1 operator). Each step's inputs are read directly from that fixture's real files and git history — not hand-summarized — and each step's verdict is recorded as one of: satisfied, required-adaptation, genuine-gap, or scoping-mismatch.

**What will NOT be built:**
No patch to `/programme` or `/workflow` — that is pep-s2's job. This story is read-only analysis against the current, pre-patch skill files and produces findings only; it does not modify any governed file.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests computing Step 0's verdict and per-signal breakdown from phase4's real profile against the pre-patch scoring table | unit |
| AC2 | Integration test walking Steps 1-6 sequentially against the 205-file fixture, confirming no step is skipped or fed an invented input | integration |
| AC3 | Unit test classifying Step 5 as `scoping-mismatch` (not `gap`) against phase4's real epic content, naming the best-fit initiative type | unit |
| AC4 | Unit + integration tests parsing the generated write-up artefact for exactly 7 populated step entries, each gap entry naming a concrete file/mechanism | unit, integration |

**Assumptions:**
- `skills-platform-phase4`'s real git-committed history (operator count, timeline span, epic structure) is treated as ground truth, per the story's own Architecture Constraints — no idealized hypothetical substitution.
- The write-up artefact's per-step verdict fields are populated with real values derived from the fixture, not placeholder text — enforced by the unit test checking for non-blank, non-"TBD" verdicts.

**Estimated touch points:**
Files: `artefacts/2026-11-08-programme-entry-points/reference/pep-s1-dry-run-findings.md` (new, created by this story). Services: none. APIs: none. Read-only references (not modified): `skills/programme/SKILL.md`, `artefacts/archived/2026-04-19-skills-platform-phase4/` (205 files).

**schemaDepends:** Not applicable — this story has no upstream dependency (`Dependencies: Upstream: None`).

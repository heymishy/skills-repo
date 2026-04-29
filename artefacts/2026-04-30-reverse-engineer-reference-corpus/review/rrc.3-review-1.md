# Review Report: rrc.3 — Integrate `constraint-index.md` reading into `/discovery`

**Story:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/stories/rrc.3-discovery-integration.md`
**Run:** 1
**Date:** 2026-04-30
**Reviewer:** Copilot (platform maintainer session)
**Categories run:** A (Traceability), B (Scope discipline), C (AC quality), D (Completeness), E (Architecture compliance)

---

## FINDINGS

### Finding 3-H1 [HIGH]
**Location:** Dependencies section
**Quote:** "rrc.1 must be complete first — `discovery-seed.md` format must be defined before `/discovery` can be instructed how to read it. rrc.2 must be complete first — `constraint-index.md` format must be defined before `/discovery` can surface it."
**Problem:** The dependency is documented in prose but is not reflected in the story's ACs or DoR pre-check. No AC blocks rrc.3 implementation if rrc.1 or rrc.2 formats are undefined. A coding agent dispatched to implement rrc.3 may proceed with assumed formats that diverge from what rrc.1/rrc.2 ultimately define. This is a sequencing defect — the dependency must be enforced by the gate mechanism, not just noted.
**Recommended action:** Add a hard block to the story's DoR pre-check: "H-DEP: rrc.1 and rrc.2 must both have `reviewStatus: passed` and their format-defining SKILL.md additions must be committed to the implementation branch before rrc.3 is dispatched." Alternatively, add an AC: "Given this story proceeds to implementation, When the `/reverse-engineer` SKILL.md is checked, Then `discovery-seed.md` format (Output 9) and `constraint-index.md` format (Output 10) are both already defined — confirming rrc.1 and rrc.2 are merged."

### Finding 3-L1 [LOW]
**Location:** AC2 vs Out of Scope section
**Quote (AC2):** "the skill adds a 'Known legacy constraints' section to the discovery artefact"
**Quote (Out of Scope):** "the 'Known legacy constraints' section is surfaced as a standard Constraints section using the existing template"
**Problem:** AC2 implies a new named section "Known legacy constraints," while the out of scope section says it should use the existing Constraints section. A test writer would be uncertain whether to test for a new section heading or population of the existing one.
**Recommended action:** Align AC2 with the out of scope statement: "the skill populates the existing Constraints section of the discovery artefact with entries from `constraint-index.md`, prefixed with a source note."

### Finding 3-L2 [LOW]
**Location:** AC1 and AC2
**Quote (AC1):** "a `discovery-seed.md` exists in `artefacts/[system-slug]/reference/`"
**Problem:** No AC specifies how `/discovery` identifies the `[system-slug]` when an operator starts a session without explicitly naming the system. If the skill cannot infer the slug, it should ask — but no AC covers this interaction. Edge case but a test should verify graceful behaviour when the system name is ambiguous.
**Recommended action:** Add a note to AC1 or a separate AC: "When the operator does not name a system at session start, the skill asks which system the feature will touch before attempting to locate reference corpus files."

---

## SCORES

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 4 | PASS |
| AC quality | 2 | FAIL |
| Completeness | 4 | PASS |
| Architecture (E) | 5 | PASS |

**Traceability — 5:** Epic, discovery, and benefit-metric all explicitly referenced. Benefit linkage explains the MM1 mechanism (makes the seed useful by surfacing it proactively). Metric coverage matrix confirms rrc.3 under MM1.

**Scope integrity — 4:** Out of scope section names 3 excluded behaviours. Minor naming inconsistency between AC2 and out of scope statement around section name (3-L1). No scope additions beyond MVP.

**AC quality — 2:** FAIL. 3-H1 is a gating defect — without a DoR hard block or enforcing AC, rrc.3 can be implemented against undefined upstream formats. The remaining ACs (AC3–AC5) are Given/When/Then, independently testable, use observable behaviour language. But the HIGH finding causes the criterion to fail.

**Completeness — 4:** Named persona (platform maintainer), As/Want/So story, benefit linkage is a mechanism sentence, complexity rated (1), scope stability declared (Stable), NFRs present (size + security).

**Architecture E — 5:** SKILL.md-only change to `/discovery`. No code, no scripts. No guardrail violations. No Active ADRs violated.

---

## VERDICT

**FAIL ❌ — Run 1**

1 HIGH finding (3-H1) must be resolved before /test-plan can proceed. Required fix: add a DoR hard block (H-DEP) that prevents rrc.3 dispatch until rrc.1 and rrc.2 SKILL.md additions are merged. Optionally add a format-check AC. After this fix, re-run /review to confirm the HIGH finding is closed. 2 LOW findings can be addressed when rewriting the AC or during test plan authoring.

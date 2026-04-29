# Review Report: rrc.4 — Create `/reference-corpus-update` companion skill

**Story:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/stories/rrc.4-reference-corpus-update-skill.md`
**Run:** 1
**Date:** 2026-04-30
**Reviewer:** Copilot (platform maintainer session)
**Categories run:** A (Traceability), B (Scope discipline), C (AC quality), D (Completeness), E (Architecture compliance)

---

## FINDINGS

### Finding 4-M1 [MEDIUM]
**Location:** AC3 + Dependencies section
**Quote (AC3):** "a list of rule IDs from `corpus-state.md` whose `source-file` field matches one or more of the changed files"
**Quote (dependencies):** "rrc.2 must be complete first — `corpus-state.md` rule ID format is defined by the constraint index; the update skill reads these IDs to match changed files against known rules."
**Problem:** `corpus-state.md` is produced by `/reverse-engineer` (Output 8 in v2) — its rule ID format is established there, not in rrc.2. If that format is not explicitly defined in rrc.2's SKILL.md additions (rrc.2 finding 2-M1), AC3 of this story is testable in isolation but cannot be verified for cross-file consistency with `constraint-index.md`. The DEEPEN scope instruction would reference rule IDs that may use a different convention than the constraint index.
**Recommended action:** Confirm that rrc.2 defines the canonical rule-id format as part of its SKILL.md additions (resolving 2-M1). Then reference that format in this story's test plan. No change needed to this story's ACs if 2-M1 is resolved in rrc.2.

### Finding 4-L1 [LOW]
**Location:** AC6
**Quote:** "the skill description and trigger phrases in the YAML frontmatter accurately describe its purpose so it appears in the right context when a user searches for 'update corpus', 'corpus refresh', or 'did this feature break legacy rules'"
**Problem:** The AC does not specify how this is verified. A human reading the frontmatter? A governance check? Without a stated verification method, the AC is descriptive rather than testable.
**Recommended action:** State verification method: "Given the `triggers:` list in the YAML frontmatter, When reviewed, Then it contains entries that match (or closely approximate) 'update corpus', 'corpus refresh', and 'legacy rules'."

### Finding 4-L2 [LOW]
**Location:** AC1
**Quote:** "`check-skill-contracts.js` must report 41 skills"
**Problem:** The baseline on master is 40 skills. AC1 is correct for the post-merge state, but the test plan author should note that this check will report 40 on master before the PR is merged, and 41 only after. This is a sequencing clarification, not a defect. Noting for the test plan.
**Recommended action:** Add a test plan note: "AC1 count assertion (41 skills) is verified against the implementation branch, not against master baseline."

---

## SCORES

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 3 | PASS |
| Completeness | 5 | PASS |
| Architecture (E) | 5 | PASS |

**Traceability — 5:** Epic, discovery, and benefit-metric all explicitly referenced. Benefit linkage explains the MM3 mechanism (/reference-corpus-update is the skill that makes MM3 measurable). Metric coverage matrix confirms rrc.4 under MM3.

**Scope integrity — 5:** Out of scope section names 4 excluded behaviours (CI automation, confidence decay tracking, report updates, git history auto-querying). No scope additions beyond MVP.

**AC quality — 3:** All 6 ACs are Given/When/Then, describe observable behaviour, independently testable. No "should." Finding 4-M1 is a cross-story consistency risk (resolved if rrc.2's 2-M1 is addressed) rather than a structural AC defect. Finding 4-L1 is minor (AC6 verification method vague). Score 3 — passing.

**Completeness — 5:** Named persona (platform maintainer), As/Want/So story, benefit linkage is a mechanism sentence, complexity rated (1), scope stability declared (Stable), NFRs present and specific (≤100 lines, human-readable output, no credentials). Best-structured story in the set.

**Architecture E — 5:** New SKILL.md file. Platform change policy explicitly stated in Architecture Constraints (PR required, no direct master commit). `check-skill-contracts.js` AC present (AC1). No Active ADRs violated. Skill name matches directory convention.

---

## VERDICT

**PASS ✅ — Run 1**

1 MEDIUM finding (4-M1 — rule-id format cross-story consistency), 2 LOW findings. 4-M1 is resolved if rrc.2's finding 2-M1 is addressed — no change to this story's ACs required. Test plan author must reference the canonical rule-id format once defined. 4-L1 and 4-L2 are minor and can be addressed in the test plan annotations.

# Review Report: rrc.3 — Integrate `constraint-index.md` reading into `/discovery`

**Story:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/stories/rrc.3-discovery-integration.md`
**Run:** 2 (re-review after Run 1 HIGH finding fix)
**Date:** 2026-04-30
**Reviewer:** Copilot (platform maintainer session)
**Categories run:** A (Traceability), B (Scope discipline), C (AC quality), D (Completeness), E (Architecture compliance)
**Prior run:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/review/rrc.3-review-1.md`
**Run 1 verdict:** FAIL — 1 HIGH (3-H1: dependency not AC-enforced), 2 LOW

---

## CHANGES SINCE RUN 1

The following changes were made to the story artefact to address Run 1 findings:

- **3-H1 ADDRESSED:** Added a formal `H-DEP` hard block to the `## Definition of Ready Pre-check` section:
  > "H-DEP (Upstream dependency gate): rrc.1 and rrc.2 SKILL.md additions must both be merged to the implementation branch before rrc.3 is dispatched."
  This creates a machine-enforced gate: the DoR skill must confirm H-DEP is cleared before sign-off. The dependency is no longer only in prose — it is now a named, enumerable gate.

- **3-L1 / 3-L2:** Not addressed between runs (LOW findings, not blocking). Carry forward.

---

## FINDINGS

### Finding 3-H1 — CLOSED ✅
**Original finding:** Dependency on rrc.1+rrc.2 documented in prose only; no DoR hard block or enforcing AC.
**Resolution:** The `## Definition of Ready Pre-check` section now contains an explicit `H-DEP` gate naming both upstream stories and the specific outputs they must define. A coding agent cannot receive DoR sign-off for rrc.3 without the gate being explicitly cleared. Finding is resolved.

---

### Carry-forward LOW findings (not blocking)

### Finding 3-L1 [LOW] — CARRY FORWARD
**Location:** AC2 vs Out of Scope section
**Quote (AC2):** "the skill adds a 'Known legacy constraints' section to the discovery artefact"
**Quote (Out of Scope):** "the 'Known legacy constraints' section is surfaced as a standard Constraints section using the existing template"
**Status:** Unaddressed. The naming inconsistency between AC2 and the Out of Scope statement persists. Test plan author should resolve: test for population of the existing Constraints section (consistent with Out of Scope), not creation of a new "Known legacy constraints" section heading.

### Finding 3-L2 [LOW] — CARRY FORWARD
**Location:** AC1 and AC2
**Quote:** "a `discovery-seed.md` exists in `artefacts/[system-slug]/reference/`"
**Status:** Unaddressed. No AC specifies how `/discovery` identifies `[system-slug]` when the operator does not name a system. Test plan author should include a scenario: "When the operator does not name a system at session start, the skill asks before looking for reference corpus files."

---

## SCORES

| Criterion | Run 1 Score | Run 2 Score | Pass/Fail |
|-----------|------------|------------|-----------|
| Traceability | 5 | 5 | PASS |
| Scope integrity | 4 | 4 | PASS |
| AC quality | 2 | 3 | PASS |
| Completeness | 4 | 4 | PASS |
| Architecture (E) | 5 | 5 | PASS |

**Traceability — 5:** Unchanged. Epic, discovery, and benefit-metric all referenced. Benefit linkage retained.

**Scope integrity — 4:** Unchanged. H-DEP gate is not a scope change — it formalises a constraint that was already in the Dependencies section. Minor naming inconsistency (3-L1) persists but does not cause scope drift.

**AC quality — 3 (was 2):** The gating defect (3-H1) is resolved. The H-DEP hard block transforms a prose note into an enforced gate that DoR must clear. ACs AC1–AC5 remain Given/When/Then with observable outcomes. Score moves from 2 to 3: passes, but 3-L1 (section naming inconsistency) and 3-L2 (system-slug ambiguity) lower the ceiling from 4. Test plan author should address both LOWs.

**Completeness — 4:** Unchanged. Named persona, story structure, benefit linkage, complexity rating, scope stability all present.

**Architecture E — 5:** Unchanged. SKILL.md-only change. No guardrail violations.

---

## VERDICT

**PASS ✅ — Run 2**

High finding 3-H1 is closed. The DoR H-DEP gate now prevents dispatch until rrc.1 and rrc.2 are merged. 2 LOW findings (3-L1, 3-L2) carry forward as test plan notes — they are not blocking for /test-plan.

**Test plan notes (carry from LOWs):**
- 3-L1: Test AC2 as population of the existing Constraints section (not creation of a new section heading). Story Out of Scope takes precedence over AC2 wording.
- 3-L2: Include a test scenario for system-slug disambiguation: "When operator does not name a system, the skill asks before looking for corpus files."

**Next step:** /test-plan for rrc.3 (may now proceed; all 4 rrc stories are review-passed).

# Review Report: rrc.2 — Add Output 10 — Constraint index to `/reverse-engineer`

**Story:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/stories/rrc.2-constraint-index-output.md`
**Run:** 1
**Date:** 2026-04-30
**Reviewer:** Copilot (platform maintainer session)
**Categories run:** A (Traceability), B (Scope discipline), C (AC quality), D (Completeness), E (Architecture compliance)

---

## FINDINGS

### Finding 2-M1 [MEDIUM]
**Location:** Dependencies section + AC1
**Quote (dependency):** "rrc.4 (/reference-corpus-update) uses `corpus-state.md` rule IDs which must be consistent with the `rule-id` column in `constraint-index.md`."
**Quote (AC1):** "one header row (`rule-id | source-file | confidence | disposition | summary`) followed by one data row per PARITY REQUIRED and MIGRATION CANDIDATE rule"
**Problem:** The `rule-id` column format is not specified anywhere in this story. rrc.4 depends on rule IDs in `corpus-state.md` matching those in `constraint-index.md`, but without a canonical format defined here (e.g. `<layer>-NNN` or `<file-prefix>-<sequence>`), the two outputs can independently adopt inconsistent formats. The test plan and rrc.4 implementation cannot safely verify consistency without this specification.
**Recommended action:** Add a constraint to AC1 or the Architecture Constraints section: "The `rule-id` value must use the same identifier format as the `rule-id` field in `corpus-state.md` (established in `/reverse-engineer` v2)." If `/reverse-engineer` v2 does not specify a canonical rule-id format, define it in this story's SKILL.md addition.

### Finding 2-L1 [LOW]
**Location:** AC2
**Quote:** "includes the CHANGE-RISK notation in the summary column"
**Problem:** "CHANGE-RISK notation" is underspecified — the expected exact string is not given (e.g. should the summary say "[CHANGE-RISK]" verbatim, or "CHANGE-RISK", or something else?). A test can only check for a substring match without knowing the canonical string.
**Recommended action:** Specify the exact notation: "the summary column must append `[CHANGE-RISK]` (bracketed, uppercase, matching the corpus flag)."

### Finding 2-L2 [LOW]
**Location:** NFRs — Size
**Quote:** "combined budget for rrc.1 + rrc.2 is ~30 lines of new instruction"
**Problem:** A joint budget across two stories cannot be validated per story. If rrc.1 uses 25 lines and rrc.2 uses 10 lines, the combined budget is met but the constraint is untestable in isolation.
**Recommended action:** State a per-story budget for rrc.2, even if approximate (e.g. "~15 lines for this story's additions").

---

## SCORES

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 3 | PASS |
| Completeness | 4 | PASS |
| Architecture (E) | 5 | PASS |

**Traceability — 5:** Epic, discovery, and benefit-metric all explicitly referenced. Benefit linkage explains the MM2 mechanism (constraint-index.md is the file MM2 measures). Metric coverage matrix confirms rrc.2 under MM2.

**Scope integrity — 5:** Out of scope section names 3 excluded behaviours (DoR auto-injection, JSON/YAML format, non-PARITY/MIGRATION-CANDIDATE rules). No scope additions beyond declared MVP.

**AC quality — 3:** All 5 ACs are Given/When/Then, independently testable, observable behaviour. No "should." However, 2-M1 (rule-id format unspecified) creates a downstream consistency risk that must be acknowledged before test plan. 2-L1 (CHANGE-RISK notation string) is a minor ambiguity. Score 3 — passing, borderline; the MEDIUM finding requires acknowledgement.

**Completeness — 4:** Named persona (tech lead), user story in As/Want/So format, benefit linkage is a mechanism sentence, complexity rated (1), scope stability declared (Stable), NFRs present. Joint line-count budget (2-L2) makes per-story NFR validation ambiguous.

**Architecture E — 5:** SKILL.md-only change. No code, no scripts, no npm dependencies. No guardrail violations. Contract compliance AC present (AC5). No Active ADRs violated.

---

## VERDICT

**PASS ✅ — Run 1**

1 MEDIUM finding (2-M1 — rule-id format unspecified), 2 LOW findings. The MEDIUM finding must be acknowledged before writing the test plan. Recommend adding a canonical rule-id format definition to either this story's SKILL.md additions or to the rrc.4 test plan as a consistency constraint. Record in `/decisions`.

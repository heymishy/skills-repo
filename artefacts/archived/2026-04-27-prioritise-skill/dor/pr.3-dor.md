# Definition of Ready: Detect ambiguous single-framework results and explain divergence when multiple frameworks are run

**Story reference:** artefacts/2026-04-27-prioritise-skill/stories/pr.3.md
**Test plan reference:** artefacts/2026-04-27-prioritise-skill/test-plans/pr.3-test-plan.md
**Verification script:** artefacts/2026-04-27-prioritise-skill/verification-scripts/pr.3-verification.md
**Assessed by:** GitHub Copilot (Claude Sonnet 4.6)
**Date:** 2026-04-27

---

## Contract Proposal

### What will be built

The coding agent will extend `.github/skills/prioritise/SKILL.md` with the tie detection, multi-pass orchestration, and divergence explanation section, and create `tests/check-pr.3.js`.

**SKILL.md content (sections authored in this story):**

1. **Tie detection** — when a single-framework scoring pass produces two or more items with identical scores, identifies the tie explicitly and offers three options: (1) run a tiebreaker pass with a second framework, (2) manually reorder the tied items, (3) accept the tie as a deliberate draw; does not silently produce an arbitrary ordering
2. **Divergence threshold** — when comparing two framework passes, flags any item whose rank changed by two or more positions as a divergence point; does not flag every minor reorder
3. **Divergence explanation** — for each divergence point, names the specific model difference that causes it (e.g. "WSJF prioritises job-size efficiency — small high-value items rank higher; RICE weights confidence more heavily — items with low confidence scores drop regardless of value"); does not simply say "these frameworks disagree"
4. **Resolution offer** — after divergence explanation, offers three options: (1) accept one framework's ranking as primary and note the divergence, (2) manually reorder the divergent items based on the explanation, (3) run a third framework as tiebreaker; operator decides
5. **Record preservation** — divergence explanation and operator's resolution choice are preserved in the scoring record for pr.5 output
6. **Single-pass guard** — when only one framework pass has been run and no tie exists, does not prompt for a second pass; proceeds directly to the output offer

**Test script (`tests/check-pr.3.js`):**

Node.js script asserting text patterns in `.github/skills/prioritise/SKILL.md` for each AC:
- AC1: tie detection pattern + three-option offer
- AC2: rank-change threshold language (≥2 positions or "two or more positions")
- AC3: model-difference explanation pattern (specific model terms)
- AC4: three-option resolution offer
- AC5: record preservation marker
- AC6: single-pass guard / no-second-pass-prompt language

`schemaDepends: []` — upstream dependency is pr.2 (SKILL.md content); no pipeline-state.json schema fields involved.

### What will NOT be built

- Automatically running a second framework pass without operator confirmation
- Resolving divergence by averaging scores
- Workshopping/group facilitation of divergence discussion (pr.4)
- Output artefact generation (pr.5)

### AC → test mapping

| AC | Test(s) in test plan | Coverage |
|----|---------------------|---------|
| AC1 | T3.1 (tie detection pattern), T3.2 (three-option offer for ties) | Full |
| AC2 | T3.3 (rank-change ≥2 threshold language) | Full |
| AC3 | T3.4 (framework model terms in explanation), T3.5 (manual: divergence explanation quality) | Partial automated; AC3 explanation quality = manual scenario 3 in verification script |
| AC4 | T3.6 (three-option resolution offer after divergence) | Full |
| AC5 | T3.7 (record preservation marker for divergence + resolution) | Full |
| AC6 | T3.8 (single-pass guard language), T3.9 (no-second-pass-prompt marker) | Full |
| NFR | T3.10 (contracts script exits 0) | Full |

**Acknowledged gap:** AC3 divergence explanation language quality (whether the explanation is accurate and clear for a non-engineer) cannot be validated by automated text-pattern check. Manual scenario 3 in the verification script covers this. This gap is explicitly acknowledged in the test plan gap table (not UNCERTAIN — known limitation accepted).

### Assumptions

- pr.2 complete before this story is implemented.
- The manual scenario for AC3 (divergence explanation quality) will be conducted by the operator during pre-code review of the draft PR SKILL.md.

### Touch points

| File | Action | Notes |
|------|--------|-------|
| `.github/skills/prioritise/SKILL.md` | Extend | Add tie/multi-pass/divergence section after scoring section from pr.2 |
| `tests/check-pr.3.js` | Create | Node.js test script for pr.3 ACs |

---

## Contract Review

- AC1: tie detection + 3 options — testable via text patterns. ✅
- AC2: "rank changed by two or more positions" — testable via threshold language. ✅
- AC3: model-level explanation — automated test checks required framework model terms appear; explanation quality is manual scenario (acknowledged gap). ✅
- AC4: 3-option resolution offer — testable via text pattern. ✅
- AC5: record preservation marker — testable via text pattern. ✅
- AC6: no second-pass prompt when single pass + no tie — testable via guard language. ✅
- AC3 gap is acknowledged in test plan and will be covered by manual scenario 3. No mismatch. Contract clean.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a tech lead or product manager / I want / So that" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs, all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | All 6 ACs covered; AC3 quality gap is acknowledged in test plan as known limitation (not UNCERTAIN) |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 explicit out-of-scope items |
| H5 | Benefit linkage field references a named metric | ✅ | References M1 (Session completion rate) and M2 (Input quality / rationale completeness) |
| H6 | Complexity is rated | ✅ | Complexity: 2; scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | 1-H1 (script path) RESOLVED in Run 1. No other HIGH findings. Review verdict: PASS. |
| H8 | Test plan has no uncovered ACs | ✅ | All 6 ACs covered; AC3 quality gap explicitly acknowledged as known limitation, not UNCERTAIN |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream = pr.2 (SKILL.md content only); schemaDepends: [] — no schema fields involved |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | C6, markdown-only; review Category E: PASS |
| H-E2E | CSS-layout-dependent AC check | ✅ | No CSS-layout-dependent ACs |
| H-NFR | NFR profile or explicit None | ✅ | All NFR categories explicitly None in story |
| H-NFR2 | Compliance NFR sign-off | ✅ | No compliance NFRs |
| H-NFR3 | Data classification not blank | ✅ | No personal/sensitive data; Security: None confirmed |
| H-NFR-profile | NFR profile presence | ✅ | All NFR categories explicitly None; profile not required |

**All 15 hard blocks: PASS**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or explicitly None — confirmed | ✅ | — | All categories explicitly None |
| W2 | Scope stability declared | ✅ | — | Stable |
| W3 | MEDIUM review findings acknowledged | ✅ | — | No MEDIUM findings for pr.3. Review verdict: PASS — clean story. |
| W4 | Verification script reviewed by domain expert | ⚠️ | Script may miss edge cases; AC3 quality gap is partially manual | Solo project — operator is domain expert; manual scenario 3 validates divergence explanation quality at PR review stage |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | AC3 quality gap is documented as known limitation (not UNCERTAIN) |

**W4 acknowledged:** Solo project. AC3 quality gap (divergence explanation language) is explicitly a manual scenario — operator reviews the SKILL.md content at the draft PR stage. This is the intended review path.

---

## Oversight Level

**Oversight: High**
Rationale: Inherited from epic pr-e1 — new SKILL.md content, divergence explanation accuracy requires human validation (this is precisely the quality concern that cannot be caught by automated tests).

🔴 **High oversight** — operator reviews SKILL.md divergence explanation content before merging. Manual scenario 3 (divergence explanation quality) must be executed by the operator during PR review.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Detect ambiguous single-framework results and explain divergence when multiple frameworks are run — artefacts/2026-04-27-prioritise-skill/stories/pr.3.md
Test plan: artefacts/2026-04-27-prioritise-skill/test-plans/pr.3-test-plan.md
DoR contract: artefacts/2026-04-27-prioritise-skill/dor/pr.3-dor.md

Goal:
Make every test in tests/check-pr.3.js pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Pre-condition:
pr.1 and pr.2 must be complete. .github/skills/prioritise/SKILL.md must exist with
intake, framework selection, and scoring sections before implementing this story.

Files to modify/create:
1. .github/skills/prioritise/SKILL.md
   - EXTEND (do not rewrite pr.1 or pr.2 sections). Add the tie detection and divergence section.
   - Tie detection (AC1):
     * When a single-framework pass produces two or more items with identical scores, identify the tie explicitly.
     * Offer exactly THREE options: (1) run a tiebreaker pass with a second framework, (2) manually reorder the tied items, (3) accept the tie as a deliberate draw.
     * Do NOT silently produce an arbitrary ordering of tied items.
   - Divergence threshold (AC2):
     * When comparing two framework passes, flag any item whose rank changed by TWO OR MORE positions as a divergence point.
     * Do NOT flag every minor reorder (less than 2 positions is NOT a divergence point).
     * SKILL.md must contain language like "two or more positions" or "rank change of 2 or more" or "≥2 positions".
   - Divergence explanation (AC3):
     * For each divergence point, name the specific model difference (not just "frameworks disagree").
     * Include example explanations that reference actual framework model properties, e.g.:
       - "WSJF prioritises job-size efficiency — small high-value items rank higher"
       - "RICE weights confidence more heavily — items with low confidence scores drop regardless of value"
     * The explanation must contain framework-specific model terms (job-size, confidence, cost of delay, etc.).
   - Resolution offer (AC4):
     * After divergence explanation, offer THREE options: (1) accept one framework's ranking as primary and note the divergence, (2) manually reorder the divergent items, (3) run a third framework pass as tiebreaker.
     * Operator decides — skill does not choose.
   - Record preservation (AC5):
     * Divergence explanation AND operator's resolution choice MUST be preserved in the scoring record for the output artefact.
     * Include a marker phrase like "preserved in scoring record" or "included in output" or "noted for artefact".
   - Single-pass guard (AC6):
     * When only one framework pass has been run AND no tie exists, do NOT prompt for a second pass.
     * Include language like "if only one framework was used and no tie exists, proceed directly to output" or equivalent.

2. tests/check-pr.3.js
   - Create this file. Node.js script (CommonJS, no external dependencies).
   - Tests to implement:
     * T3.1: SKILL.md contains tie detection pattern (e.g. "identical scores" or "tied" or "tie detected")
     * T3.2: SKILL.md contains three-option offer near tie context (e.g. "tiebreaker" AND "reorder" AND "deliberate draw" or "accept")
     * T3.3: SKILL.md contains rank-change threshold language ("two or more positions" or "2 or more positions" or "≥2 positions" or "rank changed by")
     * T3.4: SKILL.md contains framework model terms in divergence explanation context — MUST include at least one of: "job-size efficiency" or "job size" AND one of: "confidence" or "cost of delay" in a divergence explanation context
     * T3.5: SKILL.md contains model-level explanation language (e.g. "model difference" or "prioritises" in framework-comparison context — NOT just "disagree")
     * T3.6: SKILL.md contains three-option resolution offer after divergence (e.g. "accept one framework" AND "manually reorder" AND "tiebreaker" or "third framework")
     * T3.7: SKILL.md contains record preservation marker ("preserved" or "scoring record" or "included in output" near divergence context)
     * T3.8: SKILL.md contains single-pass guard language ("only one framework" or "single pass" or "no second pass" with "proceed to output" or "no tie")
     * T3.9: Absence of language that would prompt a second pass unconditionally (e.g. no "always run a second pass" — negative assertion)
     * T3.10: Integration — run `node .github/scripts/check-skill-contracts.js`; assert exit code 0.
   - Script must exit 0 on pass, non-zero on fail.

Constraints:
- Do NOT touch any file other than .github/skills/prioritise/SKILL.md and tests/check-pr.3.js
- Do NOT rewrite or remove pr.1 or pr.2 sections
- Do NOT implement workshopping or output sections — those are pr.4–pr.5
- Architecture standards: read .github/architecture-guardrails.md. SKILL.md = Markdown only. Scripts = plain Node.js CommonJS.
- Open a draft PR when tests pass — do not mark ready for review
- Oversight: High — operator reviews divergence explanation content before merging; manual scenario 3 (divergence explanation quality) will be executed by the operator during PR review
- If you encounter an ambiguity: add a PR comment and do not mark ready for review

Oversight level: High
schemaDepends: []
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes — human review of SKILL.md divergence explanation content before merging; manual scenario 3 executed by operator at PR review
**Signed off by:** Operator review required at PR stage

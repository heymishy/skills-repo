# Definition of Ready: Score candidate items conversationally across WSJF, RICE, and MoSCoW with suggested values and rationale elicitation

**Story reference:** artefacts/2026-04-27-prioritise-skill/stories/pr.2.md
**Test plan reference:** artefacts/2026-04-27-prioritise-skill/test-plans/pr.2-test-plan.md
**Verification script:** artefacts/2026-04-27-prioritise-skill/verification-scripts/pr.2-verification.md
**Assessed by:** GitHub Copilot (Claude Sonnet 4.6)
**Date:** 2026-04-27

---

## Contract Proposal

### What will be built

The coding agent will extend `.github/skills/prioritise/SKILL.md` with the conversational scoring section (WSJF, RICE, MoSCoW passes) and create `tests/check-pr.2.js`.

**SKILL.md content (sections authored in this story):**

1. **WSJF scoring pass** — one item at a time; each WSJF dimension (Cost of Delay components: User/Business Value, Time Criticality, Risk Reduction/Opportunity Enablement; and Job Size) presented individually with a suggested value and one-sentence reasoning; confirm or override invite; does not present all dimensions at once
2. **RICE scoring pass** — same pattern; each dimension (Reach, Impact, Confidence, Effort) individually with suggested value and reasoning; confirm or override invite
3. **MoSCoW scoring pass** — one item at a time; assigned to bucket with one-sentence rationale; confirm or move invite; does not present all items simultaneously
4. **Override acceptance** — accepts corrected value without re-arguing; uses corrected value in subsequent calculations; notes correction without flagging as unusual
5. **Rationale elicitation** — at least one rationale question per item before output (e.g. "What's driving the high Cost of Delay score for [item]?"); does not skip even if operator moves quickly
6. **Placeholder recording** — when rationale is skipped, records "[rationale not provided]" marker and proceeds without blocking
7. **Final scored list** — items in descending score order with score, rationale (or placeholder), and offer to proceed to output or run another framework pass

**Test script (`tests/check-pr.2.js`):**

Node.js script asserting text patterns in `.github/skills/prioritise/SKILL.md` for each AC:
- AC1: WSJF dimension-by-dimension pattern + one-item-at-a-time marker
- AC2: RICE dimension-by-dimension pattern
- AC3: MoSCoW one-item-at-a-time pattern with bucket names
- AC4: override acceptance without re-arguing
- AC5: rationale question pattern per item
- AC6: "[rationale not provided]" placeholder marker
- AC7: descending order marker + rationale field in output description

`schemaDepends: []` — upstream dependency is pr.1 (SKILL.md content); no pipeline-state.json schema fields involved.

### What will NOT be built

- Triggering a second framework pass automatically (pr.3)
- Explaining why two frameworks produce different rankings (pr.3)
- Generating the final saved artefact (pr.5)
- Workshopping/group facilitation prompts (pr.4)

### AC → test mapping

| AC | Test(s) in test plan | Coverage |
|----|---------------------|---------|
| AC1 | T2.1 (WSJF dimension-by-dimension), T2.2 (one-item-at-a-time WSJF), T2.3 (WSJF dimension names: Cost of Delay, Job Size) | Full |
| AC2 | T2.4 (RICE pattern), T2.5 (RICE dimension names: Reach, Impact, Confidence, Effort) | Full |
| AC3 | T2.6 (MoSCoW one-item-at-a-time), T2.7 (MoSCoW bucket names) | Full |
| AC4 | T2.8 (override acceptance pattern) | Full |
| AC5 | T2.9 (rationale question pattern), T2.10 (per-item rationale requirement) | Full |
| AC6 | T2.11 ("[rationale not provided]" placeholder) | Full |
| AC7 | T2.12 (descending order marker), T2.13 (rationale field in scored list description), T2.14 (next-step offer) | Full |
| NFR | T2.15 (contracts script exits 0) | Full |

### Assumptions

- pr.1 is complete before this story is implemented (SKILL.md intake section exists).
- ASSUMPTION-03: conversational dimension-by-dimension scoring is acceptable UX — acknowledged; validated post-implementation.

### Touch points

| File | Action | Notes |
|------|--------|-------|
| `.github/skills/prioritise/SKILL.md` | Extend | Add scoring section after intake/framework-selection section from pr.1 |
| `tests/check-pr.2.js` | Create | Node.js test script for pr.2 ACs |

---

## Contract Review

- AC1: "does not present all dimensions at once" — testable via one-dimension-at-a-time pattern in SKILL.md. ✅
- AC2: same pattern as AC1 but for RICE — testable. ✅
- AC3: "does not present all items simultaneously" — testable via one-item-at-a-time pattern. ✅
- AC4: "without re-arguing" — testable via override acceptance language. ✅
- AC5: "at least one rationale question per item" — testable via text pattern. ✅
- AC6: "[rationale not provided]" placeholder — testable via exact string match. ✅
- AC7: descending order + rationale field — testable via text patterns. ✅
- No mismatches between proposed implementation and ACs. Contract is clean.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a tech lead, product manager, or business lead / I want / So that" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 7 ACs, all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | All 7 ACs covered (T2.1–T2.14 + NFR T2.15) |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 explicit out-of-scope items |
| H5 | Benefit linkage field references a named metric | ✅ | References M1 (Session completion rate) and M2 (Input quality / rationale completeness) |
| H6 | Complexity is rated | ✅ | Complexity: 2; scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | 1-H1 (script path) RESOLVED in Run 1. No other HIGH findings. Review verdict: PASS. |
| H8 | Test plan has no uncovered ACs | ✅ | All 7 ACs covered; no acknowledged gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream = pr.1 (SKILL.md content dependency only); schemaDepends: [] — no schema fields involved |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | C6, markdown-only constraint; review Category E: PASS |
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
| W3 | MEDIUM review findings acknowledged | ✅ | — | Only MEDIUM finding was 1-H1 (script path) which was categorised HIGH and RESOLVED. No open MEDIUM findings for pr.2. |
| W4 | Verification script reviewed by domain expert | ⚠️ | Unreviewed script may miss edge cases | Solo project — pipeline operator is domain expert; acknowledged for all 5 stories |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | No UNCERTAIN items |

**W4 acknowledged:** Same acknowledgement as pr.1 — solo project; operator is domain expert.

---

## Oversight Level

**Oversight: High**
Rationale: Inherited from epic pr-e1 — new SKILL.md content, errors in conversational design require human review. Per C2, SKILL.md merges require human review of draft PR.

🔴 **High oversight** — operator reviews SKILL.md scoring section content before merging.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Score candidate items conversationally across WSJF, RICE, and MoSCoW — artefacts/2026-04-27-prioritise-skill/stories/pr.2.md
Test plan: artefacts/2026-04-27-prioritise-skill/test-plans/pr.2-test-plan.md
DoR contract: artefacts/2026-04-27-prioritise-skill/dor/pr.2-dor.md

Goal:
Make every test in tests/check-pr.2.js pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Pre-condition:
pr.1 must be complete and .github/skills/prioritise/SKILL.md must exist with the intake
and framework selection section before implementing this story.

Files to modify/create:
1. .github/skills/prioritise/SKILL.md
   - EXTEND (do not rewrite the pr.1 section). Add the conversational scoring section after the framework selection section.
   - WSJF scoring pass content requirements:
     * Score one ITEM at a time.
     * Within each item, present each WSJF dimension individually (NOT all at once): User/Business Value, Time Criticality, Risk Reduction/Opportunity Enablement, and Job Size — these are 4 presentation steps per item.
     * For each dimension: suggest a plausible value with a one-sentence reasoning; invite confirm or override.
     * Must include the phrase "one dimension at a time" or equivalent and NOT "all dimensions at once".
   - RICE scoring pass content requirements:
     * Same one-dimension-at-a-time pattern.
     * Dimensions: Reach, Impact, Confidence, Effort — each presented individually.
   - MoSCoW scoring pass content requirements:
     * Score one item at a time (assign to bucket with one-sentence rationale; invite confirm or move).
     * Do NOT present all items simultaneously.
     * Bucket names MUST appear: Must-have, Should-have, Could-have, Won't-have.
   - Override acceptance:
     * Accept the corrected value without re-arguing.
     * Note the correction without flagging it as unusual.
   - Rationale elicitation:
     * Ask at least one rationale question per item (e.g. "What's driving the high [dimension] score for [item]?").
     * Do NOT skip rationale elicitation even if operator moves quickly.
   - Placeholder recording:
     * When rationale is not provided, record exactly "[rationale not provided]" as a placeholder.
     * Proceed without blocking.
   - Final scored list:
     * Present items in descending score order.
     * Each item shows: score, rationale (or placeholder).
     * Offer to proceed to output or run another framework pass.

2. tests/check-pr.2.js
   - Create this file. Node.js script (CommonJS, no external dependencies).
   - Reads .github/skills/prioritise/SKILL.md and asserts text patterns for each AC:
     * T2.1: "one dimension at a time" or "one at a time" or "individually" present (AC1 WSJF pattern)
     * T2.2: WSJF present AND dimension-by-dimension language present (AC1)
     * T2.3: "User/Business Value" AND "Time Criticality" AND "Job Size" present (AC1 WSJF dimension names)
     * T2.4: RICE scoring section present with dimension names (AC2)
     * T2.5: "Reach" AND "Impact" AND "Confidence" AND "Effort" present in scoring context (AC2)
     * T2.6: MoSCoW one-item-at-a-time pattern (AC3)
     * T2.7: "Must-have" AND "Should-have" AND "Could-have" AND "Won't-have" (or Wont-have) present (AC3)
     * T2.8: Override acceptance pattern — "accept" or "use" the corrected value language (AC4)
     * T2.9: Rationale question pattern — "what's driving" or "rationale" or "why" near scoring context (AC5)
     * T2.10: Per-item rationale requirement marker (AC5)
     * T2.11: "[rationale not provided]" exact string present (AC6)
     * T2.12: "descending" or "highest" or "ranked" in output description (AC7)
     * T2.13: Rationale field in scored list description (AC7)
     * T2.14: Next-step offer present — "proceed to output" or "run another" or "another framework" (AC7)
     * T2.15: Integration — run `node .github/scripts/check-skill-contracts.js` via child_process.execSync; assert exit code 0.
   - Script must exit 0 on pass, non-zero on fail.

Constraints:
- Do NOT touch any file other than .github/skills/prioritise/SKILL.md and tests/check-pr.2.js
- Do NOT rewrite or remove the pr.1 section of SKILL.md
- Do NOT implement divergence, workshopping, or output sections — those are pr.3–pr.5
- Architecture standards: read .github/architecture-guardrails.md. SKILL.md = Markdown only. Scripts = plain Node.js CommonJS.
- Open a draft PR when tests pass — do not mark ready for review
- Oversight: High — operator reviews SKILL.md scoring section content before merging
- If you encounter an ambiguity not covered by the ACs: add a PR comment and do not mark ready for review

Oversight level: High
schemaDepends: []
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes — human review of SKILL.md scoring section before merging draft PR
**Signed off by:** Operator review required at PR stage

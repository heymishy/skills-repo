# Definition of Ready: Accept candidate items and guide framework selection with rationale at session open

**Story reference:** artefacts/2026-04-27-prioritise-skill/stories/pr.1.md
**Test plan reference:** artefacts/2026-04-27-prioritise-skill/test-plans/pr.1-test-plan.md
**Verification script:** artefacts/2026-04-27-prioritise-skill/verification-scripts/pr.1-verification.md
**Assessed by:** GitHub Copilot (Claude Sonnet 4.6)
**Date:** 2026-04-27

---

## Contract Proposal

### What will be built

The coding agent will author the opening section of `.github/skills/prioritise/SKILL.md` — the candidate intake and framework selection phase of the `/prioritise` skill — and create the Node.js test script `tests/check-pr.1.js`.

**SKILL.md content (sections authored in this story):**

1. **Opening statement** — names the three available frameworks (WSJF, RICE, MoSCoW) each with a one-sentence plain-language description meeting the AC1 minimum content specification:
   - WSJF: names "cost of delay" as its primary signal
   - RICE: names all four factors (Reach, Impact, Confidence, Effort)
   - MoSCoW: names all four buckets (Must-have, Should-have, Could-have, Won't-have)
2. **Candidate intake** — acknowledges all items, asks for missing context (goals, time horizon, decision audience), does not proceed to framework selection until candidate list is confirmed
3. **Framework suggestion** — names the recommended framework, states the primary reason it fits the stated context, explicitly invites confirm or override, does not proceed to scoring without explicit confirm
4. **Override acceptance** — accepts override without re-arguing, confirms selected framework, proceeds to scoring
5. **Clarifying question limit** — at most 2 clarifying questions before making a suggestion

**Test script (`tests/check-pr.1.js`):**

Node.js script that reads `.github/skills/prioritise/SKILL.md` and asserts text patterns are present for each AC:
- AC1: framework names and required content terms (cost of delay, Reach/Impact/Confidence/Effort, Must-have/Should-have/Could-have/Won't-have)
- AC2: candidate acknowledgement pattern + context question pattern + no-proceed-until-confirmed marker
- AC3: framework suggestion pattern + rationale pattern + confirm/override invite
- AC4: override acceptance pattern (no re-argue language)
- AC5: clarifying question limit marker (at most 2 / max 2)
- AC6: `node .github/scripts/check-skill-contracts.js` exits 0 (integration test — run via child_process.execSync)

`schemaDepends: []` — upstream dependencies are None; no pipeline-state.json schema fields involved.

### What will NOT be built

- Scoring logic for any framework (pr.2)
- Tie detection or divergence explanation (pr.3)
- Workshopping or facilitation prompts (pr.4)
- Output format, artefact save, or extension point (pr.5)
- The `prioritise` entry in `CONTRACTS[]` in `check-skill-contracts.js` (pr.5)
- Any changes to files outside `.github/skills/prioritise/SKILL.md` and `tests/check-pr.1.js`

### AC → test mapping

| AC | Test(s) in test plan | Coverage |
|----|---------------------|---------|
| AC1 | T1.1 (WSJF cost-of-delay term), T1.2 (RICE all four factors), T1.3 (MoSCoW all four buckets), T1.4 (framework names all present) | Full |
| AC2 | T1.5 (acknowledge pattern), T1.6 (context question pattern), T1.7 (no-proceed marker) | Full |
| AC3 | T1.8 (suggestion + rationale pattern), T1.9 (confirm/override invite) | Full |
| AC4 | T1.10 (override acceptance — no re-argue language) | Full |
| AC5 | T1.11 (clarifying question limit marker) | Full |
| AC6 | T1.12 (integration: contracts script exits 0) | Full |

### Assumptions

- ASSUMPTION-03 (conversational scoring UX acceptable for non-engineers) — acknowledged; impacts AC1 framework description quality; validated post-implementation by verification script manual scenarios.
- AC6 passes vacuously before `prioritise` is added to `CONTRACTS[]` — this is expected; the full contract check is enforced by pr.5 AC6.

### Touch points (files the agent will create or modify)

| File | Action | Notes |
|------|--------|-------|
| `.github/skills/prioritise/SKILL.md` | Create | Partial file — intake + framework selection sections only |
| `tests/check-pr.1.js` | Create | Node.js test script for pr.1 ACs |

---

## Contract Review

- AC1: minimum content spec (cost of delay, RICE factors, MoSCoW buckets) is now in the story (1-M1 fix applied). ✅ Independently testable.
- AC2: "does not proceed until confirmed" — testable via SKILL.md text pattern (marker present). ✅
- AC3: "explicitly invites confirm or override" — testable via text pattern. ✅
- AC4: "without re-arguing" — testable via absence-of-re-argue-language assertion. ✅
- AC5: "at most two clarifying questions" — testable via text pattern (max-2 or at-most-2 marker). ✅
- AC6: contracts script integration test — testable via execSync. ✅
- No mismatches between proposed implementation and ACs. Contract is clean.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a tech lead, product manager, or business lead / I want / So that" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs, all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | All 6 ACs covered (T1.1–T1.12) |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | Populated with 4 explicit out-of-scope items |
| H5 | Benefit linkage field references a named metric | ✅ | References M3 (Non-engineer unassisted completion) and MM1 (Cold-start replication) |
| H6 | Complexity is rated | ✅ | Complexity: 2; rationale provided; scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | 1-H1 RESOLVED in Run 1. Only 1-M1 MEDIUM open; fix applied to AC1 content spec. |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | All 6 ACs covered; AC6 covered by integration test T1.12 |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: Upstream = None — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | ADR-011, C6, and markdown-only constraint all populated; review Category E: PASS |
| H-E2E | CSS-layout-dependent AC check | ✅ | No CSS-layout-dependent ACs — SKILL.md authoring story |
| H-NFR | NFR profile or explicit None | ✅ | Story NFR section explicitly states None for all categories (Performance, Security, Accessibility, Audit) |
| H-NFR2 | Compliance NFR with regulatory clause has human sign-off | ✅ | No compliance NFRs — not applicable |
| H-NFR3 | Data classification not blank | ✅ | No personal/sensitive data; Security: None confirmed |
| H-NFR-profile | NFR profile presence check | ✅ | All NFR categories explicitly None in story; nfr-profile.md not required |

**All 15 hard blocks: PASS**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or explicitly None — confirmed | ✅ | — | All categories explicitly None in story |
| W2 | Scope stability declared | ✅ | — | Stable |
| W3 | MEDIUM review findings acknowledged | ✅ | — | 1-M1 MEDIUM finding resolved by fix applied to AC1 (minimum content spec added to story). Finding is resolved, not merely acknowledged. |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | Pipeline operator is sole reviewer on this solo project — acknowledged, proceed |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | No UNCERTAIN items in gap table |

**W4 acknowledged:** This is a solo project. The pipeline operator is the domain expert. Proceeding without an independent domain review is accepted risk for all 5 prioritise stories.

---

## Oversight Level

**Oversight: High**
Rationale: Inherited from epic pr-e1 — "Oversight: High — The deliverable is a new SKILL.md. Errors in the skill's conversational design cannot be caught by automated tests; they require human review of the produced artefact and session transcript. Per constraint C2, the SKILL.md must be merged via PR with explicit human review."

🔴 **High oversight** — human review of the draft PR is required before merging. The coding agent opens a draft PR; the operator reviews the SKILL.md content before merging.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Accept candidate items and guide framework selection with rationale at session open — artefacts/2026-04-27-prioritise-skill/stories/pr.1.md
Test plan: artefacts/2026-04-27-prioritise-skill/test-plans/pr.1-test-plan.md
DoR contract: artefacts/2026-04-27-prioritise-skill/dor/pr.1-dor.md

Goal:
Make every test in tests/check-pr.1.js pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Files to create:
1. .github/skills/prioritise/SKILL.md
   - Create this file. This is the FIRST story — create the file from scratch.
   - Include ONLY the candidate intake and framework selection phase.
   - Do NOT include scoring logic, divergence handling, workshopping mode, or output format — those are pr.2–pr.5.
   - Content requirements (from ACs):
     * Opening statement that names WSJF, RICE, and MoSCoW each with a one-sentence plain-language description.
       - WSJF description MUST name "cost of delay" as its primary signal.
       - RICE description MUST name all four factors: Reach, Impact, Confidence, Effort.
       - MoSCoW description MUST name all four buckets: Must-have, Should-have, Could-have, Won't-have.
     * Candidate intake: acknowledge ALL items provided; ask for missing context (goals, time horizon, decision audience); do NOT proceed to framework selection until the candidate list is confirmed complete.
     * Framework suggestion: name the recommended framework; state the primary reason it fits the operator's stated context; explicitly invite the operator to confirm or override; do NOT proceed to scoring without explicit confirm.
     * Override acceptance: accept the operator's override without re-arguing; confirm the selected framework; proceed to scoring.
     * Clarifying question limit: ask AT MOST TWO clarifying questions before making a suggestion.
   - File must be valid Markdown — no embedded HTML except HTML comments.
   - Follow established section headings used in existing SKILL.md files.

2. tests/check-pr.1.js
   - Create this file. Node.js script (CommonJS, no external dependencies beyond Node built-ins).
   - Reads .github/skills/prioritise/SKILL.md and asserts required text patterns are present.
   - Tests to implement (one assertion per AC):
     * T1.1: SKILL.md contains "cost of delay" (case-insensitive) — AC1 WSJF signal
     * T1.2: SKILL.md contains "Reach" AND "Impact" AND "Confidence" AND "Effort" — AC1 RICE factors
     * T1.3: SKILL.md contains "Must-have" AND "Should-have" AND "Could-have" AND "Won't-have" (or "Wont-have") — AC1 MoSCoW buckets
     * T1.4: SKILL.md contains "WSJF" AND "RICE" AND "MoSCoW" — AC1 framework names
     * T1.5: SKILL.md contains a pattern for acknowledging candidate items (e.g. "acknowledge" or "confirm" near "items" or "list")
     * T1.6: SKILL.md contains at least one context question pattern (e.g. "goals" or "time horizon" or "decision audience")
     * T1.7: SKILL.md contains a "do not proceed" or "wait for confirmation" or equivalent no-proceed marker before framework selection
     * T1.8: SKILL.md contains a framework suggestion pattern with rationale (e.g. "recommend" or "suggest" near framework name with a reason)
     * T1.9: SKILL.md contains a confirm-or-override invite (e.g. "confirm" and "override" in proximity, or "happy with" or "would you like to")
     * T1.10: SKILL.md does NOT contain a re-argue pattern after override (e.g. no "original choice" or "I still recommend" or "reconsider" in override context) — OR positively asserts override acceptance language
     * T1.11: SKILL.md contains a clarifying question limit marker (e.g. "at most" near "question" or "two questions" or "maximum 2")
     * T1.12: Integration — run `node .github/scripts/check-skill-contracts.js` via child_process.execSync; assert exit code 0. (Note: this passes vacuously until pr.5 adds the prioritise CONTRACTS entry — that is expected behaviour for this story.)
   - Script must exit 0 on pass, non-zero on fail. Print each test name and PASS/FAIL.

Constraints:
- Do NOT touch any file other than .github/skills/prioritise/SKILL.md and tests/check-pr.1.js
- Do NOT add the prioritise entry to .github/scripts/check-skill-contracts.js — that is pr.5 scope
- Do NOT implement scoring, divergence, workshopping, or output sections — those are pr.2–pr.5
- Architecture standards: read .github/architecture-guardrails.md before implementing.
  Key constraints: SKILL.md = Markdown only (no embedded HTML except HTML comments).
  Scripts = plain Node.js, no external npm dependencies, CommonJS require().
- Open a draft PR when tests pass — do not mark ready for review
- Oversight: High — the operator will review the SKILL.md content before merging
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: High
schemaDepends: []
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes — human review of SKILL.md content before merging draft PR
**Signed off by:** Operator review required at PR stage

# Definition of Ready: Guide mixed groups through a workshopping session with facilitation prompts that build shared ownership of the result

**Story reference:** artefacts/2026-04-27-prioritise-skill/stories/pr.4.md
**Test plan reference:** artefacts/2026-04-27-prioritise-skill/test-plans/pr.4-test-plan.md
**Verification script:** artefacts/2026-04-27-prioritise-skill/verification-scripts/pr.4-verification.md
**Assessed by:** GitHub Copilot (Claude Sonnet 4.6)
**Date:** 2026-04-27

---

## Contract Proposal

### What will be built

The coding agent will extend `.github/skills/prioritise/SKILL.md` with the workshopping and facilitation mode section, and create `tests/check-pr.4.js`.

**SKILL.md content (sections authored in this story):**

1. **Mode selection offer** — after candidate list confirmation, skill offers two modes: (1) solo scoring, (2) workshopping/group session; does not default to solo without asking
2. **Facilitation prompts** — when workshopping mode is active, each scoring dimension gets a facilitation prompt that names the typical perspectives of at least two roles (e.g. "Tech lead: consider implementation risk and dependency chain. PM: consider user adoption urgency and business deadline.") with wording addressed to at least two named roles, posing an open question ("What's driving your score for this?") rather than an imperative directive
3. **Conflict detection** — when the group provides conflicting scores (range), skill surfaces the range explicitly naming both scores (e.g. "I heard 3 and 7 for this dimension — what's driving the gap?") and invites brief discussion before the facilitator confirms a final value; does not silently average or pick the first value
4. **Conflict recording** — records both the final agreed value and a brief note about the disagreement (e.g. "Range 3–7; agreed 5 — tech concern about integration effort outweighed by PM deadline pressure") for artefact rationale
5. **Dimension pause** — after completing a dimension for all items, pauses and asks if the group is ready to proceed; does not advance automatically
6. **Mode switch acceptance** — when operator switches to solo mode mid-session, accepts without re-prompting for workshopping mode
7. **Group-attribution closing** — final ranked list begins with "Based on your group's agreed scores..." or equivalent group-attribution phrasing; does NOT begin with "I recommend"

**Test script (`tests/check-pr.4.js`):**

Node.js script asserting text patterns in `.github/skills/prioritise/SKILL.md` for each AC:
- AC1: mode selection offer language
- AC2: facilitation prompt with ≥2 named roles + open question pattern
- AC3: conflict detection pattern (structural — explicit range surfacing with both scores; manual scenario for live workshop)
- AC4: conflict recording pattern (range + agreed value + note)
- AC5: dimension pause language
- AC6: mode switch acceptance language
- AC7: group-attribution closing pattern ("Based on your group's agreed scores" or equivalent)

`schemaDepends: []` — upstream dependencies are pr.1 and pr.2 (SKILL.md content); no pipeline-state.json schema fields involved.

### What will NOT be built

- Real-time multi-user concurrent input
- Recording individual participant names or votes
- Generating a separate facilitator debrief report
- Output artefact generation (pr.5)

### AC → test mapping

| AC | Test(s) in test plan | Coverage |
|----|---------------------|---------|
| AC1 | T4.1 (mode selection offer language) | Full |
| AC2 | T4.2 (facilitation prompt with ≥2 named roles), T4.3 (open question pattern "What's driving") | Full |
| AC3 | T4.4 (conflict detection structural — "I heard" pattern or range surfacing text), T4.5 (manual: live workshop scenario) | Partial automated; conflict trigger in live session = manual scenario 5 in verification script |
| AC4 | T4.6 (conflict recording: range + agreed value + note) | Full |
| AC5 | T4.7 (dimension pause language) | Full |
| AC6 | T4.8 (mode switch acceptance language) | Full |
| AC7 | T4.9 ("Based on your group's agreed scores" or group-attribution pattern), T4.10 (absence of "I recommend" in closing context) | Full |
| NFR | T4.11 (contracts script exits 0) | Full |

**Acknowledged gap (AC3):** The condition "group provides conflicting scores" cannot be triggered in an automated SKILL.md text-pattern test. The automated test (T4.4) verifies the structural presence of conflict-surfacing language in the SKILL.md. The live trigger scenario is covered by manual scenario 5 in the verification script. The test plan documents this explicitly (per review finding 1-L1). Both automated and manual coverage exist — this is the intended approach confirmed by the operator.

### Assumptions

- pr.1 complete (candidate intake section exists); pr.2 complete (scoring section exists) before this story is implemented.
- AC3 live workshop trigger is validated by operator during draft PR review via manual scenario 5.

### Touch points

| File | Action | Notes |
|------|--------|-------|
| `.github/skills/prioritise/SKILL.md` | Extend | Add workshopping/facilitation section after divergence section from pr.3 |
| `tests/check-pr.4.js` | Create | Node.js test script for pr.4 ACs |

---

## Contract Review

- AC1: mode selection offer — testable via text pattern. ✅
- AC2 (post-fix): "wording addressed to at least two named roles" and "poses a question...rather than an imperative directive" — testable via named-role pattern + open-question pattern. ✅ (1-M2 fix applied: observable proxy replaces behavioral intent assertion.)
- AC3: structural conflict-surfacing language in SKILL.md — testable; live workshop trigger = manual scenario. ✅ (1-L1 low finding acknowledged in test plan; both automated structural check AND manual scenario documented.)
- AC4: range + agreed value + note — testable via text pattern. ✅
- AC5: dimension pause — testable via text pattern. ✅
- AC6: mode switch acceptance — testable via text pattern. ✅
- AC7 (post-fix): "Based on your group's agreed scores..." + absence of "I recommend" — testable. ✅ (1-M3 fix applied: AC7 added to story.)
- All 7 ACs independently verifiable. No mismatches. Contract clean.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a workshop facilitator running a mixed group / I want / So that" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 7 ACs (including AC7 added post-review), all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | All 7 ACs covered; AC3 automated structural + manual scenario (acknowledged approach) |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 explicit out-of-scope items |
| H5 | Benefit linkage field references a named metric | ✅ | References M3 (Non-engineer unassisted completion) and M1 (Session completion rate) |
| H6 | Complexity is rated | ✅ | Complexity: 2; scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | 1-H1 (script path) RESOLVED in Run 1. 1-M2 and 1-M3 MEDIUM findings RESOLVED by fixes applied to AC2 and AC7. Review verdict: PASS. |
| H8 | Test plan has no uncovered ACs | ✅ | All 7 ACs covered; AC3 gap explicitly acknowledged as known limitation (automated structural + manual scenario) |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream = pr.1, pr.2 (SKILL.md content only); schemaDepends: [] — no schema fields involved |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | C6, markdown-only; review Category E: PASS |
| H-E2E | CSS-layout-dependent AC check | ✅ | No CSS-layout-dependent ACs |
| H-NFR | NFR profile or explicit None | ✅ | All NFR categories explicitly None in story |
| H-NFR2 | Compliance NFR sign-off | ✅ | No compliance NFRs |
| H-NFR3 | Data classification not blank | ✅ | No personal/sensitive data; "no credentials or personal data recorded" confirmed in story |
| H-NFR-profile | NFR profile presence | ✅ | All NFR categories explicitly None; profile not required |

**All 15 hard blocks: PASS**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or explicitly None — confirmed | ✅ | — | All categories explicitly None |
| W2 | Scope stability declared | ✅ | — | Stable |
| W3 | MEDIUM review findings acknowledged | ✅ | — | 1-M2 and 1-M3 MEDIUM findings RESOLVED by fixes applied to story (AC2 observable proxy added; AC7 group-attribution AC added). Not merely acknowledged — resolved. |
| W4 | Verification script reviewed by domain expert | ⚠️ | AC3 live workshop scenario cannot be fully automated; manual scenario 5 must be executed by operator | Solo project — operator is domain expert; manual scenario 5 executed during draft PR review of SKILL.md |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | AC3 gap is documented as known limitation (not UNCERTAIN) |

**W4 acknowledged:** AC3 live workshop conflict trigger is a manual scenario by design — the operator executes this as part of the High oversight PR review. This is the intended validation path.

---

## Oversight Level

**Oversight: High**
Rationale: Inherited from epic pr-e1. Additionally, facilitation prompt quality (AC2) and group-attribution phrasing (AC7) are subjective design decisions that require human judgment at PR review. AC3 live workshop scenario must be executed by the operator.

🔴 **High oversight** — operator reviews workshopping section content and executes manual scenario 5 (live workshop conflict trigger) before merging draft PR.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Guide mixed groups through a workshopping session with facilitation prompts — artefacts/2026-04-27-prioritise-skill/stories/pr.4.md
Test plan: artefacts/2026-04-27-prioritise-skill/test-plans/pr.4-test-plan.md
DoR contract: artefacts/2026-04-27-prioritise-skill/dor/pr.4-dor.md

Goal:
Make every test in tests/check-pr.4.js pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Pre-condition:
pr.1, pr.2, and pr.3 must be complete. .github/skills/prioritise/SKILL.md must exist
with intake, framework selection, scoring, and divergence sections.

Files to modify/create:
1. .github/skills/prioritise/SKILL.md
   - EXTEND (do not rewrite pr.1, pr.2, or pr.3 sections). Add the workshopping/facilitation mode section.
   - Mode selection (AC1):
     * After candidate list confirmation, offer TWO modes: (1) solo scoring, (2) workshopping/group session.
     * Do NOT default to solo without asking.
   - Facilitation prompts (AC2):
     * When workshopping mode is active, each scoring dimension gets a facilitation prompt.
     * The prompt MUST contain wording addressed to AT LEAST TWO named roles (e.g. "Tech lead:" and "PM:").
     * The prompt MUST pose an open question — e.g. "What's driving your score for this?" — NOT an imperative directive like "Give your score now."
     * Example: "Tech lead: consider implementation risk and dependency chain. PM: consider user adoption urgency and business deadline. What's driving your score for this item?"
   - Conflict detection (AC3):
     * When conflicting scores are heard, surface the range EXPLICITLY by naming both scores (e.g. "I heard 3 and 7 for this dimension — what's driving the gap?").
     * Invite a brief discussion before the facilitator confirms a final value.
     * Do NOT silently average or pick the first value.
     * SKILL.md must contain the conflict-surfacing pattern: language like "I heard [score] and [score]" or "heard a range" or "surface the range" or "conflicting scores".
   - Conflict recording (AC4):
     * Record BOTH the final agreed value AND a brief note about the disagreement.
     * Example: "Range 3–7; agreed 5 — tech concern about integration effort outweighed by PM deadline pressure."
     * SKILL.md must contain: range + agreed value + note structure.
   - Dimension pause (AC5):
     * After completing a dimension for all items, PAUSE and ask if the group is ready to proceed to the next dimension.
     * Do NOT advance automatically (as in solo mode).
   - Mode switch acceptance (AC6):
     * When operator requests a switch to solo mode mid-session, accept the switch.
     * Continue scoring in solo mode.
     * Do NOT re-prompt for workshopping mode for the remainder of the session.
   - Group-attribution closing (AC7):
     * When presenting the final ranked list in workshopping mode, the closing statement MUST begin with "Based on your group's agreed scores..." or use equivalent group-attribution phrasing.
     * Do NOT begin with "I recommend" or frame the ranking as the skill's own recommendation.
     * SKILL.md must contain: "Based on your group's agreed scores" or "your group's agreed" or "the group decided".

2. tests/check-pr.4.js
   - Create this file. Node.js script (CommonJS, no external dependencies).
   - Tests to implement:
     * T4.1: SKILL.md contains mode selection offer ("solo" AND "workshopping" or "group session" in mode-offer context)
     * T4.2: SKILL.md contains facilitation prompt with ≥2 named roles — at least "Tech lead" AND ("PM" or "Product Manager" or "Business" role) present in a facilitation context
     * T4.3: SKILL.md contains open question pattern — "What's driving your score" or "What's driving" in facilitation context
     * T4.4: SKILL.md contains conflict-surfacing language — "I heard" near score values AND "what's driving the gap" or "surface" or "conflicting" (structural check for AC3)
     * T4.5: SKILL.md contains conflict recording pattern — "Range" or "range" AND "agreed" AND "note" or description of disagreement in conflict-recording context
     * T4.6: SKILL.md contains dimension pause language — "ready to proceed" or "pause" or "before we move" in dimension-completion context
     * T4.7: SKILL.md contains mode switch acceptance — "switch" and "solo" and accept language (no re-prompt)
     * T4.8: SKILL.md contains group-attribution closing — "Based on your group's agreed scores" or "group's agreed" or "group decided" present
     * T4.9: SKILL.md does NOT contain "I recommend" as a closing phrase in workshopping mode context (negative assertion — check closing section does not use "I recommend")
     * T4.10: Integration — run `node .github/scripts/check-skill-contracts.js`; assert exit code 0.
   - Script must exit 0 on pass, non-zero on fail.

Constraints:
- Do NOT touch any file other than .github/skills/prioritise/SKILL.md and tests/check-pr.4.js
- Do NOT rewrite or remove pr.1, pr.2, or pr.3 sections
- Do NOT implement output format, artefact save, or extension point — those are pr.5
- Architecture standards: read .github/architecture-guardrails.md. SKILL.md = Markdown only. Scripts = plain Node.js CommonJS.
- Open a draft PR when tests pass — do not mark ready for review
- Oversight: High — operator reviews workshopping facilitation content and executes manual scenario 5 (live conflict trigger) before merging
- If you encounter an ambiguity: add a PR comment and do not mark ready for review

Oversight level: High
schemaDepends: []
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes — human review of SKILL.md workshopping section; manual scenario 5 (live workshop conflict trigger) executed by operator at PR review
**Signed off by:** Operator review required at PR stage

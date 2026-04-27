# Review Report — pr.4: Socialisation and workshopping features

**Story:** artefacts/2026-04-27-prioritise-skill/stories/pr.4.md
**Feature:** 2026-04-27-prioritise-skill
**Review run:** 1
**Date:** 2026-04-27
**Reviewer:** GitHub Copilot (Claude Sonnet 4.6)

---

## FINDINGS

### 1-H1 — SCRIPT PATH WRONG IN NFR SECTION (HIGH) — FIXED IN RUN 1

**Finding:** NFR "Skill contract" referenced `check-skill-contracts.js` without the `.github/scripts/` prefix.

**Fix applied in this run:** Updated to `node .github/scripts/check-skill-contracts.js`.

**Status:** RESOLVED in Run 1.

---

### 1-M2 — AC2 BEHAVIORAL INTENT IS NOT AN OBSERVABLE OUTCOME (MEDIUM) — OPEN

**Finding:** AC2 contains the clause "the prompt is written to invite multiple voices, not direct a single scorer." This is a behavioral intent assertion — it describes the author's intention, not an observable outcome that a test can verify. A test can check that role names appear in the prompt text. It cannot verify "invite vs direct."

**Exact line:**
> "— the prompt is written to invite multiple voices, not direct a single scorer."

**Recommended fix:** Replace the intent clause with an observable artifact specification:
> "— each facilitation prompt contains wording addressed to at least two named roles (e.g. 'Tech lead:' and 'PM:') and poses a question ('What's driving your score for this?') rather than an imperative directive."

**Status:** OPEN — awaiting operator confirmation before applying.

---

### 1-M3 — NO AC COVERING DISCOVERY S4 (MEDIUM) — OPEN

**Finding:** Discovery S4 ("produces a result that feels owned by the group rather than imposed by the tool") has no corresponding AC. ACs cover mechanics (mode selection, conflict surfacing, dimension pacing, mode switching) but none specify closing behavior that attributes the ranked result to the group.

**Gap:** There is no AC for what the skill says at session close in workshopping mode. S4 is the stated success indicator for this entire story — without an AC targeting it, the story has no verifiable connection to S4.

**Recommended AC7 (new):** Given workshopping mode is active and scoring is complete, when the skill presents the final ranked list, then its closing statement attributes the result to the group's decisions (e.g. "Based on your group's agreed scores...") rather than framing it as the skill's recommendation — the skill does not use first-person language like "I recommend" in the closing summary.

**Status:** OPEN — awaiting operator confirmation before applying.

---

### 1-L1 — AC3 TRIGGER IS CONVERSATIONAL-ONLY, NOT AUTOMATABLE (LOW)

**Finding:** AC3 condition "the group provides conflicting scores for an item" cannot be simulated by an automated test of a SKILL.md. The test-plan must mark this as human-validation only.

**Recommended action:** Note in /test-plan: AC3 validation = human review of SKILL.md text confirming the conflict-surfacing prompt exists and matches the specified pattern. No automated test is possible for this condition.

**Status:** LOW — no story change required; test-plan writer note.

---

## SCORE

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| A — Traceability | 5 | PASS |
| B — Scope integrity | 5 | PASS |
| C — AC quality | 3 | PASS (post-1-H1-fix; 1-M2 reduces from 5 to 3) |
| D — Completeness | 3 | PASS (1-M3 gap: S4 unaddressed; all other fields complete) |
| E — Architecture | 5 | PASS |

**Verdict:** PASS (post-1-H1-fix) — 2 MEDIUM findings open. Neither individually scores below 3. Recommend fixing 1-M2 and 1-M3 before /test-plan — the test-plan writer would otherwise produce either a subjective validation note or skip coverage of S4 entirely.

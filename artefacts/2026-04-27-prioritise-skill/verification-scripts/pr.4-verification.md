# AC Verification Script: pr.4 — Workshopping and facilitation mode

**Story reference:** artefacts/2026-04-27-prioritise-skill/stories/pr.4.md
**Script author:** Copilot
**Date:** 2026-04-27
**Review status:** Pre-code sign-off — reviewer is confirming the described behaviour is the *correct* behaviour before coding begins

---

## Purpose

1. **Pre-code sign-off** — confirm that workshopping facilitation behaviour is correctly defined before implementation.
2. **Post-merge smoke test** — run a live session using workshopping mode.
3. **Delivery review** — structured walkthrough for stakeholders, ideally with a second participant.

---

## Setup

- Workshopping mode scenarios are best run with at least two people (one facilitates, one participates). Scenarios 1–5 can be run solo by playing both roles.
- For scenario 3, you will need to deliberately provide two different scores for the same dimension.
- All scenarios use fictional items.
- Reset between each scenario.

---

## Scenario 1 — Mode selection offered at session start

**AC covered:** AC1
**Risk:** 🟢

**Steps:**
1. Invoke `/prioritise` with no additional context.
2. Observe the opening messages.
3. Verify the skill asks whether you want to work solo or in workshopping/facilitation mode.
4. Choose workshopping mode.
5. Verify the session continues in workshopping mode — the facilitation prompts change to address multiple participants.

**What broken looks like:** The skill begins a solo scoring session immediately without offering a mode choice.

**Pre-code check:** Read the session-start section of SKILL.md. Confirm the mode selection prompt names both options.

---

## Scenario 2 — Facilitation prompts name roles and ask an open question

**AC covered:** AC2
**Risk:** 🟢

**Steps:**
1. Enter workshopping mode (scenario 1 prerequisite).
2. Begin scoring.
3. Observe the facilitation language the skill uses.
4. Verify the skill names at least two specific stakeholder roles — e.g. "I'd like to hear from both the product manager and the engineering lead."
5. Verify the skill asks an open question about score reasoning — e.g. "What's driving your score for this item?" (not just "What's your score?").

**What broken looks like:** The skill says only "Please provide a score" without naming any roles, or asks "What score (1–10)?" without any facilitation language.

**Pre-code check:** Read the facilitation prompt section of SKILL.md. Confirm role naming and open-question instructions.

---

## Scenario 3 — Conflict detected: score range surfaced explicitly *(AUTOMATED + MANUAL)*

**AC covered:** AC3
**Risk:** 🟡 (partially manual — live group session required for full validation)

**Steps:**
1. Enter workshopping mode.
2. Begin scoring WSJF.
3. When the skill asks for scores from participants, deliberately provide two conflicting scores — e.g. answer "3" on behalf of participant A, then "8" on behalf of participant B for the same dimension.
4. Observe the skill's response.
5. **Automated (pre-code check):** The SKILL.md must contain instruction for explicit range surfacing. Verify: the instruction uses framing like "I heard X and Y — what's driving the gap?" not just "there seems to be a disagreement."
6. **Manual (post-merge smoke test):** Verify the skill actually says something like "I heard 3 from [role A] and 8 from [role B] — what's driving that gap?" It must name both scores explicitly and invite discussion.

**What broken looks like:** The skill notes disagreement generically ("the group seems divided") without naming the actual scores heard, or it averages the scores silently without flagging the conflict.

**Pre-code check (automated portion):** Read the conflict detection section of SKILL.md. The range surfacing framing must be explicit — "I heard X and Y" not just "there is a gap."

---

## Scenario 4 — Conflict resolved: agreed value and disagreement note recorded

**AC covered:** AC4
**Risk:** 🟢

**Steps:**
1. Continue from scenario 3 (conflict surfaced).
2. Resolve the conflict — agree on a final score, e.g. "Let's use 6."
3. Observe the skill's response.
4. Verify the skill confirms the final agreed value.
5. Proceed through the full scoring pass.
6. When the session's scored list is presented, verify the item shows the agreed value.
7. Verify there is a note alongside (inline or in a separate section) indicating there was disagreement during scoring — e.g. "Note: initial range 3–8, agreed 6."

**What broken looks like:** The agreed value is recorded but the disagreement note is absent, or the final output only shows the agreed value with no record of the earlier conflict.

**Pre-code check:** Read the conflict resolution recording section of SKILL.md. Confirm both the agreed value AND the disagreement note are required in the record.

---

## Scenario 5 — Pause after each dimension: skill waits for the group

**AC covered:** AC5
**Risk:** 🟢

**Steps:**
1. Enter workshopping mode and begin WSJF scoring.
2. Complete the first dimension (e.g. User/Business Value).
3. Observe: the skill should ask "Ready to move to the next dimension?" or equivalent before advancing.
4. Do NOT respond immediately — wait a few seconds.
5. Verify the skill does not auto-advance to the next dimension unprompted.
6. Respond "yes" and verify the session advances to the next dimension.

**What broken looks like:** The skill immediately presents the next dimension ("Now let's score Time Criticality...") without waiting for the group to confirm.

**Pre-code check:** Read the pacing instruction in SKILL.md. Confirm the pause-and-ask behaviour is explicit and no-auto-advance is stated.

---

## Scenario 6 — Mode switch accepted mid-session

**AC covered:** AC6
**Risk:** 🟢

**Steps:**
1. Begin a solo scoring session and score one item through WSJF.
2. Say "Actually, I'm in a workshop now — can we switch to facilitation mode?"
3. Verify the skill confirms the mode switch and continues in workshopping mode.
4. Verify the previously scored item is retained — the session does not restart from scratch.

**What broken looks like:** The skill says "I can't switch modes" or restarts the session from the beginning after the mode switch.

**Pre-code check:** Read the mode switch section of SKILL.md. Confirm mid-session switch is accepted and progress is preserved.

---

## Scenario 7 — Closing statement uses group-attribution phrasing

**AC covered:** AC7
**Risk:** 🟢

**Steps:**
1. Complete a full workshopping scoring pass.
2. Observe the closing statement / final output framing.
3. Verify the statement uses group-attribution language — e.g. "Based on your group's agreed scores, [item] is your top priority."
4. Verify the statement does NOT say "I recommend [item] as your top priority."

**What broken looks like:** The closing statement says "Based on our analysis, I recommend [item]..." — first-person recommendation framing replaces group-attribution.

**Pre-code check:** Read the workshopping closing section of SKILL.md. Confirm "Based on your group's agreed scores" or equivalent is required, and "I recommend" framing is explicitly excluded.

---

## Summary checklist

| Scenario | AC | Status |
|----------|-----|--------|
| 1 — Mode selection at session start | AC1 | ☐ PASS / ☐ FAIL |
| 2 — Facilitation prompts name roles + open question | AC2 | ☐ PASS / ☐ FAIL |
| 3 — Conflict detection: score range surfaced explicitly (AUTOMATED + MANUAL 🟡) | AC3 | ☐ PASS / ☐ FAIL |
| 4 — Agreed value + disagreement note recorded | AC4 | ☐ PASS / ☐ FAIL |
| 5 — Pause after each dimension, no auto-advance | AC5 | ☐ PASS / ☐ FAIL |
| 6 — Mode switch accepted mid-session | AC6 | ☐ PASS / ☐ FAIL |
| 7 — Group-attribution closing, no "I recommend" | AC7 | ☐ PASS / ☐ FAIL |

All scenarios must pass before this story is considered done.

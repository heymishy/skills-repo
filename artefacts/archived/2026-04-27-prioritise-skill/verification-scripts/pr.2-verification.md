# AC Verification Script: pr.2 — Conversational scoring across WSJF, RICE, and MoSCoW

**Story reference:** artefacts/2026-04-27-prioritise-skill/stories/pr.2.md
**Script author:** Copilot
**Date:** 2026-04-27
**Review status:** Pre-code sign-off — reviewer is confirming the described behaviour is the *correct* behaviour before coding begins

---

## Purpose

This script serves three moments:
1. **Pre-code sign-off** — confirm that the described scoring behaviour is correct before the coding agent implements it.
2. **Post-merge smoke test** — run a live `/prioritise` session and check each scenario.
3. **Delivery review** — structured walkthrough for stakeholders.

---

## Setup

- Have 3–5 fictional candidate items ready (e.g. "onboarding redesign, API rate limiting, mobile push, dashboard export, payment flow").
- Open GitHub Copilot Chat in agent mode.
- Scenarios 1–4 require completing scenario 1 first (candidate list + framework selected from pr.1).
- Reset between each scenario by starting a fresh chat session.

---

## Scenario 1 — WSJF scoring presents dimensions one at a time

**AC covered:** AC1
**Risk:** 🟢

**Steps:**
1. Complete pr.1 scenario 2–3: provide candidate list, answer context questions, select WSJF as the framework.
2. Begin scoring.
3. Observe: the skill should present one WSJF dimension at a time — NOT a grid of all dimensions at once.
4. Verify the first dimension is one of: User/Business Value, Time Criticality, Risk Reduction/Opportunity Enablement, or Job Size.
5. Verify it suggests a value (a number) with a one-sentence reason (e.g. "I'd suggest 8 — you mentioned this has a hard deadline, indicating high time criticality").
6. Verify it asks you to confirm or change the value before moving to the next dimension.
7. Proceed through all WSJF dimensions. Verify each is handled the same way.

**What broken looks like:** The skill presents a full scoring table for the first item all at once, or it presents all items simultaneously before asking for input.

**Pre-code check:** Read the WSJF scoring section of SKILL.md. Confirm each dimension is a separate step.

---

## Scenario 2 — RICE scoring follows the same one-dimension pattern

**AC covered:** AC2
**Risk:** 🟢

**Steps:**
1. Restart and select RICE as the framework.
2. Begin scoring.
3. Verify the first dimension is one of: Reach, Impact, Confidence, or Effort.
4. Verify the skill suggests a value with a reasoning sentence and invites override.
5. Complete all four dimensions for one item.
6. Verify no dimension was skipped.

**What broken looks like:** The skill asks for all four RICE dimensions in a single message without providing suggestions.

**Pre-code check:** Read the RICE section of SKILL.md. Confirm one-dimension-per-turn and suggested-value patterns.

---

## Scenario 3 — MoSCoW scoring assigns one item at a time with rationale

**AC covered:** AC3
**Risk:** 🟢

**Steps:**
1. Restart and select MoSCoW as the framework.
2. Begin scoring.
3. Verify the skill assigns each item to a bucket (Must-have, Should-have, Could-have, Won't-have) one at a time — not presenting the full list simultaneously.
4. Verify the skill provides a one-sentence rationale for each bucket assignment (e.g. "Must-have — this is blocking onboarding and cannot be shipped without it").
5. Verify the skill invites you to confirm or move the item to a different bucket before proceeding.

**What broken looks like:** The skill presents all 5 items assigned to buckets at once and then asks for your feedback.

**Pre-code check:** Read the MoSCoW section of SKILL.md. Confirm one-item-at-a-time and per-item rationale.

---

## Scenario 4 — Rationale is elicited before proceeding to output

**AC covered:** AC5, AC6
**Risk:** 🟢

**Steps:**
1. Complete a full WSJF scoring pass on 3 items.
2. Verify that before the skill presents the final ranked list, it asks at least one rationale question per item — e.g. "What's driving the high Cost of Delay score for [item]?"
3. For one item, respond to the rationale prompt with a skip or a non-answer (e.g. "not sure" or just press Enter).
4. Verify the skill records a placeholder — the output should show "[rationale not provided]" or similar for that item.
5. Verify the skill continues and does not repeat the rationale question for that item.

**What broken looks like:** The skill presents the ranked list without ever asking "what's driving that score?", or it blocks and refuses to proceed if rationale is not provided.

**Pre-code check:** Read the rationale elicitation section of SKILL.md. Confirm it instructs the skill to ask at least one rationale question per item and to record a placeholder for non-answers.

---

## Scenario 5 — Scored list is in descending order with a next-step offer

**AC covered:** AC7
**Risk:** 🟢

**Steps:**
1. Complete a full scoring pass on 3–5 items.
2. Observe the final scored list presentation.
3. Verify the items are in descending score order (highest score at the top).
4. Verify each item shows its score and the elicited rationale (or placeholder).
5. Verify the skill offers a next step — e.g. "Ready to save the artefact, or would you like to run another framework pass?"

**What broken looks like:** Items are presented in the order they were scored (not ranked), or the skill ends the session without offering a path forward.

**Pre-code check:** Read the scored-list presentation section of SKILL.md. Confirm descending order instruction and next-step offer.

---

## Summary checklist

| Scenario | AC | Status |
|----------|-----|--------|
| 1 — WSJF dimension-by-dimension with suggested values | AC1 | ☐ PASS / ☐ FAIL |
| 2 — RICE same pattern | AC2 | ☐ PASS / ☐ FAIL |
| 3 — MoSCoW one item at a time with rationale | AC3 | ☐ PASS / ☐ FAIL |
| 4 — Rationale elicited; placeholder on skip | AC5, AC6 | ☐ PASS / ☐ FAIL |
| 5 — Scored list descending + next-step offer | AC7 | ☐ PASS / ☐ FAIL |
| AC4 (override accepted) | AC4 | Covered by pr.1 scenario 4 — same behaviour applies in scoring phase |

All scenarios must pass before this story is considered done.

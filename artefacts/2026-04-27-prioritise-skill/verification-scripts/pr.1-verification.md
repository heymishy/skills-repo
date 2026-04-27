# AC Verification Script: pr.1 — Accept candidate items and guide framework selection

**Story reference:** artefacts/2026-04-27-prioritise-skill/stories/pr.1.md
**Script author:** Copilot
**Date:** 2026-04-27
**Review status:** Pre-code sign-off — reviewer is confirming the described behaviour is the *correct* behaviour before coding begins

---

## Purpose

This script serves three moments:
1. **Pre-code sign-off** — a domain expert (PM, BA, or product lead) reads each scenario and confirms the described behaviour is correct before the coding agent implements it.
2. **Post-merge smoke test** — after the PR is merged, a tester runs `/prioritise` and checks each scenario against the live skill.
3. **Delivery review** — a structured walkthrough for stakeholders to see what was built.

---

## Setup

Before running scenarios 2–5, you need a text editor or the VS Code chat panel open.
- Open GitHub Copilot Chat in agent mode.
- Each scenario resets — complete them independently.
- **Pre-code (scenarios 1–5 only):** Read the SKILL.md at `.github/skills/prioritise/SKILL.md` alongside this script. You are checking that the instruction text describes the behaviour, not that a live session produces it.

---

## Scenario 1 — Framework introductions are sufficient for a non-engineer

**AC covered:** AC1
**Risk:** 🟢

**What to check (post-merge — live session):**
1. Invoke `/prioritise` in GitHub Copilot Chat with no prior context.
2. Read the skill's opening message.
3. Verify the opening names all three frameworks: WSJF, RICE, and MoSCoW.
4. Verify the WSJF description mentions "cost of delay."
5. Verify the RICE description names all four factors: Reach, Impact, Confidence, Effort.
6. Verify the MoSCoW description names all four buckets: Must-have, Should-have, Could-have, Won't-have.
7. Ask yourself: "If I had never heard of any of these frameworks, could I tell which one to use based on this description?" If yes → **PASS**.

**What broken looks like:** The opening message lists only framework names without descriptions, or uses abbreviations without expanding them (e.g. "CoD" without "cost of delay"), or omits one of the RICE factors or MoSCoW buckets.

**Pre-code check (sign-off):** Read the SKILL.md opening section. Confirm the required descriptions are instructed in the text.

---

## Scenario 2 — Candidate intake: skill acknowledges all items before proceeding

**AC covered:** AC2
**Risk:** 🟢

**What to check (post-merge — live session):**
1. Invoke `/prioritise` and provide a list of 4–5 candidate features in plain English, e.g.:
   > "I have five items: onboarding redesign, API rate limiting, mobile push notifications, dashboard export, and bug fix backlog."
2. Verify the skill acknowledges all five items by name (or confirms the count).
3. Verify the skill asks at least one question about context before suggesting a framework — for example, it asks about goals, timeline, or audience.
4. Verify the skill does **not** suggest a framework in the same message as the intake acknowledgement.

**What broken looks like:** The skill immediately suggests a framework in the same turn as acknowledging the list, without asking any clarifying questions.

**Pre-code check (sign-off):** Read the intake section of the SKILL.md. Confirm it instructs the skill to gather context before framework selection.

---

## Scenario 3 — Framework suggestion includes a named reason

**AC covered:** AC3
**Risk:** 🟢

**What to check (post-merge — live session):**
1. Complete scenario 2 (candidate list provided, context asked).
2. Answer the context question — e.g. "We need to decide what to build next quarter. Time pressure is the main concern."
3. Observe the framework suggestion.
4. Verify the suggestion names a specific framework (e.g. "I suggest WSJF").
5. Verify the suggestion includes a specific reason tied to your stated context (e.g. "WSJF — you mentioned time pressure and cost of delay is its primary signal").
6. Verify the suggestion ends with an explicit invitation to confirm or choose differently — not just silence.

**What broken looks like:** The skill names a framework but says "because it's a good fit" with no context tie-in, or it moves straight to scoring without asking for confirmation.

**Pre-code check (sign-off):** Read the framework suggestion section of the SKILL.md. Confirm the instruction requires a context-tied reason and an explicit confirm/override prompt.

---

## Scenario 4 — Framework override is accepted without re-arguing

**AC covered:** AC4
**Risk:** 🟢

**What to check (post-merge — live session):**
1. Complete scenario 3 up to receiving the framework suggestion.
2. Override the suggestion — say "Actually, I want to use MoSCoW" (assuming the skill suggested WSJF or RICE).
3. Verify the skill confirms the new choice: "OK — we'll use MoSCoW."
4. Verify the skill does **not** say "are you sure?" or re-explain why the original suggestion was better.
5. Verify the skill proceeds toward scoring with MoSCoW.

**What broken looks like:** The skill says "WSJF is usually better for time-sensitive decisions — are you sure you want MoSCoW?" or asks again in the next message.

**Pre-code check (sign-off):** Read the override handling section of the SKILL.md. Confirm the instruction explicitly says not to re-suggest the original choice.

---

## Scenario 5 — At most two clarifying questions before a framework suggestion

**AC covered:** AC5
**Risk:** 🟢

**What to check (post-merge — live session):**
1. Invoke `/prioritise` with a vague context — say only: "I have some items to prioritise."
2. Count how many clarifying questions the skill asks before offering a framework suggestion.
3. Verify it asks **at most two** questions.
4. Verify that after two questions (or fewer), the skill makes a suggestion — it does not keep asking indefinitely.

**What broken looks like:** The skill asks three or more distinct clarifying questions before offering any framework suggestion, or enters a loop asking questions without making progress toward a suggestion.

**Pre-code check (sign-off):** Read the clarifying questions section of the SKILL.md. Confirm it specifies a maximum of two questions.

---

## Summary checklist

| Scenario | AC | Status |
|----------|-----|--------|
| 1 — Framework introductions sufficient for non-engineer | AC1 | ☐ PASS / ☐ FAIL |
| 2 — Candidate intake acknowledges all items before proceeding | AC2 | ☐ PASS / ☐ FAIL |
| 3 — Framework suggestion includes context-tied reason and confirm invite | AC3 | ☐ PASS / ☐ FAIL |
| 4 — Framework override accepted without re-arguing | AC4 | ☐ PASS / ☐ FAIL |
| 5 — At most two clarifying questions before suggestion | AC5 | ☐ PASS / ☐ FAIL |
| AC6 (automated) | AC6 | Checked by `node .github/scripts/check-skill-contracts.js` |

All scenarios must pass before this story is considered done.

# AC Verification Script — sri.3: Add measurement-ready gate to DoD Step 6 for infrastructure stories

**Story:** artefacts/2026-05-18-skill-robustness-improvements/stories/sri.3.md
**Date:** 2026-06-25
**For use:** Pre-code sign-off · Post-merge smoke test · Delivery review

---

## Setup

This story changes Step 6 of `skills/definition-of-done/SKILL.md`. No server required.

**Automated test command:**
```
node tests/check-sri3-dod-step6-gate.js
```
Expected output: 8 tests pass.

For manual verification, open `skills/definition-of-done/SKILL.md` and locate the `## Step 6` section (titled "Metric signal" or similar).

---

## Scenario 1 — Step 6 first asks whether measurement is possible (AC1)

**What to check:** In the Step 6 section, confirm the very first question asked about a story is something like:

> "Is measurement possible yet for this story? (yes / not yet)"

This question must appear *before* any prompt asking for a metric value, signal quality (on-track / at-risk), trend, or rating.

**Broken behaviour:** Step 6 immediately asks for the metric signal or on-track/at-risk assessment without first checking if measurement is even possible. This is the current (unfixed) behaviour.

---

## Scenario 2 — Answering "not yet" records not-yet-measured and moves on (AC2)

**What to check:** In Step 6, find the description of what happens when the operator answers "not yet" to the measurement-ready question.

Confirm the instructions say:
1. Record `not-yet-measured` as the outcome for this story
2. Prompt for a brief evidence note (e.g. "no user-facing features shipped yet — infrastructure only")
3. Move on to the next story without asking for a metric signal, trend, or rating

The operator should complete the "not yet" path in two interactions: the gate answer and the evidence note — nothing more.

**Broken behaviour:** After answering "not yet", the operator is still asked for a metric signal value, a trend assessment, or a confidence rating. The confusion cycle continues.

---

## Scenario 3 — Answering "yes" continues with the normal Step 6 flow (AC3)

**What to check:** In Step 6, find the description of what happens when the operator answers "yes" to the measurement-ready question.

Confirm the normal signal-capture flow is unchanged — the operator is asked for the current signal (on-track / at-risk / off-track / not-yet-measured), signal quality or trend, and any notes. The same options that existed before this change should still be present.

**Broken behaviour:** The normal signal-capture flow is missing or truncated because the gate was added incorrectly.

---

## Scenario 4 — DoD artefact records the not-yet-measured outcome with the evidence note (AC4)

**What to check:** In the Step 6 section (or the state-write / artefact-write section that follows it), confirm the instructions say to write the `not-yet-measured` outcome into the DoD artefact along with the evidence note the operator supplied.

The artefact entry should NOT be:
- Blank
- "N/A"
- An error state

It should read something like: `not-yet-measured — no user-facing features shipped yet; infrastructure only`.

**Broken behaviour:** The instructions say to record `not-yet-measured` but make no mention of the evidence note — the artefact entry would have no context for why measurement was deferred.

---

## Scenario 5 — Step 6 completes in under 30 seconds on an infrastructure story (NFR-PERF) 🔴

**Manual verification required — cannot be confirmed from text inspection alone.**

After the story is merged, run a real (or simulated) DoD session on an infrastructure story:

1. Start `/definition-of-done` on a story that has no user-facing signal yet (e.g. a database model story or a CI setup story).
2. When Step 6 is reached, start a stopwatch.
3. Answer "not yet" to the measurement-ready gate question.
4. Supply a one-sentence evidence note.
5. Confirm the skill moves to the next story (or completes Step 6 if it was the last story).
6. Stop the stopwatch.

**Pass criterion:** Total elapsed time from gate question to moving on is under 30 seconds.

**Broken behaviour:** The skill asks additional questions after the evidence note — metric value, trend, rating — before moving on. If this happens, the fix is not working correctly.

🔴 **This scenario must not be skipped at smoke test time.**

---

## Scenario 6 — Infrastructure and user-facing stories are processed independently (AC5)

**What to check:** Open the Step 6 section and confirm the instruction describes a per-story loop — each story is assessed independently. An infrastructure story answering "not yet" should not affect the flow for the next story in the list.

If you have a feature with two stories — one infrastructure (not-yet-measured) and one user-facing (on-track) — both should be processed in Step 6 without the first story's outcome changing the questions asked for the second.

**Broken behaviour:** After a "not yet" answer, the skill skips all remaining Step 6 stories, or asks all remaining stories the "not yet" question without giving them the option to report "yes".

---

## Automated check (post-merge)

```
node tests/check-sri3-dod-step6-gate.js
```

Expected: 8 tests pass. T1, T2, T3, T4, T5, T7 currently fail; T6 and T8 currently pass. After the merge, all 8 should pass.

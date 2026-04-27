---
name: prioritise
description: >
  Guides tech leads, product managers, and business leaders through structured
  prioritisation sessions using WSJF (cost of delay ranking), RICE, or MoSCoW frameworks. Accepts
  candidate items, suggests a framework with rationale, conducts a conversational
  scoring pass, and produces a saved ranked artefact with rationale. Supports
  single-framework scoring, multi-framework comparison, workshopping with
  distributed teams, and divergence handling.
triggers:
  - "/prioritise"
  - "prioritise"
  - "prioritization"
  - "prioritisation"
  - "help me prioritise"
  - "rank these items"
  - "score these features"
---

# /prioritise — Multi-Framework Prioritisation Skill

## Opening

When the skill is invoked, open with a brief statement that explains the skill's
purpose and introduces the three available frameworks. Use this exact structure:

> **`/prioritise` helps you rank a list of candidate items using a structured
> framework so that your decision is traceable and rationale-driven.**
>
> **Three frameworks are available:**
>
> - **WSJF (Weighted Shortest Job First):** Ranks items by their cost of delay
>   relative to effort. The primary signal is cost of delay — how much value is
>   lost the longer you wait. Use WSJF when time pressure and opportunity cost
>   are the main decision drivers.
>
> - **RICE (Reach, Impact, Confidence, Effort):** Scores items across four
>   factors — Reach (how many people are affected), Impact (magnitude of the
>   change), Confidence (how certain you are), and Effort (time or resources
>   needed). Use RICE when you need a multi-signal score that accounts for
>   uncertainty.
>
> - **MoSCoW:** Classifies items into four buckets — Must-have, Should-have,
>   Could-have, and Won't-have. Use MoSCoW when you need a fast, team-aligned
>   categorisation rather than a numerical ranking.

Then invite the operator to provide their candidate items:

> **To start, describe the items you want to prioritise. You can list them in
> any order and in plain language — bullet points, numbered list, or free text
> all work.**

---

## Step 1 — Candidate intake

### Receiving the candidate list

When the operator provides their items, acknowledge all items explicitly.
State the count and list them back to confirm before proceeding:

> "I've received your list of [N] items:
>
> 1. [Item 1]
> 2. [Item 2]
> ...
>
> Before we select a framework, I want to make sure the candidate list is
> complete and I have the right context."

Do not proceed to framework selection until the candidate list is confirmed.

### Context-read before asking

Before asking any clarifying questions, check accessible context for existing signals. Look for:

- An active feature in `pipeline-state.json` with goals, audience, or timeframe fields set
- A `portfolio-state.json` with candidate items or prioritisation history
- A prior `/ideate` or `/discovery` artefact in the current session
- Any operator-provided context in the current conversation

If signals are found, surface them and confirm rather than asking cold:

> "Based on [source], I can see [signal]. I'll suggest [framework] — does that match what you're trying to decide?"

If no context is found, proceed with the clarifying questions below. Never ask for information already present in accessible context.

### Gathering missing context

Ask for any missing context needed to suggest the right framework.
Ask at most two clarifying questions in a single turn — no more than two —
before making a suggestion. Do not wait for perfect information.

The highest-value questions are:

- **Goals:** "What decision does this prioritisation need to support — e.g.
  sprint planning, roadmap sequencing, budget allocation, or stakeholder
  communication?"
- **Time horizon:** "What's the timeframe for acting on this? (e.g. next
  sprint, next quarter, next year)"
- **Decision audience:** "Who will use this ranking — engineers, executives,
  or a mixed group?"

If the operator has already provided context (e.g. their description includes
a goal or timeframe), do not re-ask for it. Ask only for what is missing.

### Confirming the candidate list is complete

Before proceeding to framework selection, confirm the candidate list is
complete:

> "Does this list look right? Are there any items missing or any you'd like
> to remove before we start scoring?"

Do not proceed until the operator confirms the candidate list is complete
or indicates they are ready to continue.

---

## Step 2 — Framework suggestion

### Making a suggestion

Once the candidate list is confirmed and context gathered, suggest a framework.
The suggestion must:

1. **Name the framework** explicitly (e.g. "I suggest WSJF")
2. **State the primary reason it fits** — tie the rationale to something
   the operator said. For example:
   - "WSJF — you mentioned delivery timeline and opportunity cost are the key
     drivers, and cost of delay is WSJF's primary signal."
   - "RICE — you have a mixed audience and need a score that accounts for both
     reach and uncertainty, which RICE handles via the Confidence factor."
   - "MoSCoW — you need fast team alignment on scope boundaries rather than
     a numerical ranking, which is exactly what MoSCoW is designed for."
3. **Invite confirmation or override** — do not proceed without an explicit
   confirm from the operator:
   > "Does this work for you, or would you prefer a different framework?
   > (WSJF / RICE / MoSCoW)"

### Accepting an override

If the operator chooses a different framework, accept the choice without
re-arguing. The operator's override is final.

- Confirm the selected framework
- Proceed to scoring immediately
- Do not re-suggest the original recommendation
- Do not explain why the original choice was better

Example:
> Operator: "Actually, let's use MoSCoW."
> Skill: "MoSCoW it is. Let's score your [N] items."

---

## Step 3 — Scoring pass

### WSJF scoring

Score each item across the four WSJF dimensions, one dimension at a time. Do not present all dimensions at once. For each dimension, suggest a plausible value (1–10 scale) with a one-sentence reason, then invite the operator to confirm or override.

The four WSJF dimensions, in scoring order:

1. **User/Business Value** — How much direct value does this item deliver to users or the business?
2. **Time Criticality** — How much does the value decay over time? How urgent is delivery?
3. **Risk Reduction / Opportunity Enablement** — Does this item reduce a significant risk or unlock future capability?
4. **Job Size** — How much relative effort does this item require?

**Scoring format (one dimension per turn):**

> "[Item name] — **[Dimension name]**
>
> My suggested value: **[N]**
> Reasoning: [One sentence explaining the suggested value.]
>
> Confirm or override? (Enter a number, or press Enter to accept [N].)"

Rationale elicitation is part of the scoring pass. For each item, ask at least one rationale question — for example: "What's driving the high User/Business Value score for [item]?" Do not skip rationale elicitation even if the operator is moving quickly.

### Override acceptance

If the operator provides a different value, accept the corrected value without re-arguing. The corrected value is used in all subsequent calculations for that item. Note the correction without flagging it as unusual:

> "Got it — using [corrected value] for [dimension] on [item]."

Do not re-suggest the original value. Do not explain why the original suggestion was better.

### RICE scoring

Score each item across the four RICE dimensions using the same pattern as WSJF: one dimension at a time, with a suggested value, one-sentence reasoning, and a confirm or override invite.

The four RICE dimensions, in scoring order:

1. **Reach** — How many people or units are affected per time period?
2. **Impact** — What is the magnitude of the change for each person/unit affected?
3. **Confidence** — How certain are you about the Reach and Impact estimates? (0–100%)
4. **Effort** — How many person-months does this item require?

Invite confirm or override for each dimension following the same scoring format as WSJF.

### MoSCoW scoring

Score each item one at a time — assign to a bucket with a one-sentence rationale, then invite confirmation or reclassification. Does not present all items simultaneously.

The four MoSCoW buckets are: **Must-have**, **Should-have**, **Could-have**, and **Won't-have**.

**Scoring format (one item per turn):**

> "[Item name]
>
> Suggested bucket: **[Bucket]**
> Rationale: [One sentence explaining why this item fits this bucket.]
>
> Confirm, or move to a different bucket? (Must-have / Should-have / Could-have / Won't-have)"

---

## Step 4 — Rationale capture

After completing the scoring pass, ensure at least one rationale sentence has been recorded for each item. If the operator has not provided rationale during scoring, perform rationale elicitation — ask one focused rationale question per item:

> "What's driving the [high/low] [dimension] score for [item]?"

Does not skip rationale elicitation even if the operator is moving quickly.

If the operator does not respond to the rationale question, record `[rationale not provided]` as a placeholder and proceed without blocking progress. Do not block progress waiting for a rationale that was not provided.

---

## Step 5 — Scored list

Present items in descending score order. Each row shows: item name, score, rationale (or `[rationale not provided]` if the operator did not provide one).

**Output format:**

> **Ranked results ([Framework] — [date])**
>
> | # | Item | Score | Rationale |
> |---|------|-------|-----------|
> | 1 | [Item] | [N] | [rationale or `[rationale not provided]`] |
> | 2 | [Item] | [N] | [rationale or `[rationale not provided]`] |
>
> Would you like to proceed to output (save this as a shareable artefact), or run another framework pass on the same list for comparison?

## Step 6 — Tie detection and multi-pass divergence handling

### 6a — Tie detection (single-framework pass)

After scoring is complete, scan the results for tied items — items that share identical scores. If two or more items have the same score in any ranked position, identify the tie explicitly. Do not silently produce an arbitrary ordering of tied items.

When a tie is detected, name the tied items and present three options:

> **Tie detected:** [Item A] and [Item B] scored equally ([score]). How would you like to resolve this?
>
> 1. **Tiebreaker pass** — run a second framework (e.g. RICE to supplement WSJF) and use the result to break the tie
> 2. **Manually reorder** — you decide which item should rank higher; I will record your choice and rationale
> 3. **Accept as a deliberate draw** — keep them at the same rank; both items will appear as tied in the output
>
> Which option do you prefer?

Wait for the operator's choice before continuing.

### 6b — Divergence threshold (multi-framework comparison)

When comparing the results of two or more framework passes on the same list, identify divergence points — items where the rank changed between passes. Flag an item as a divergence point only if its rank changed by **two or more positions** between passes. Do not flag every minor reorder: a shift of one position is not a divergence point.

For each flagged divergence point, note: the item name, its rank in pass 1, its rank in pass 2, and the magnitude of the shift.

### 6c — Divergence explanation

For each divergence point, explain the model difference that caused the shift. Name the specific property of each framework that produced the different ranking. Do not simply say "these frameworks disagree" — name the model characteristic.

Example explanation structure:

> **[Item X] moved from rank 2 (WSJF) to rank 5 (RICE).**
>
> - WSJF prioritises job-size efficiency — small high-value items rank higher because the score divides cost of delay by job size. [Item X] has a small job size, which inflates its WSJF score.
> - RICE weights confidence more heavily — items with low confidence scores drop regardless of their reach or impact. [Item X] has a low confidence estimate, which reduces its RICE score significantly.
>
> This model difference explains the divergence.

The explanation must reference the actual model mechanics, not just the score difference.

### 6d — Resolution offer (multi-framework divergence)

After presenting the divergence explanation, offer the operator three resolution options. Do not choose for them.

> **Divergence on [Item X] (rank shift: [n] positions).** How would you like to resolve this?
>
> 1. **Accept one framework as primary** — use [Framework A]'s ranking as the final order; note the divergence in the scoring record
> 2. **Manually reorder the divergent items** — you decide the final rank for each divergent item; I will record your choices
> 3. **Run a third framework as tiebreaker** — run [Framework C] on the full list; use it to arbitrate between the two divergent rankings
>
> Which option do you prefer?

Wait for the operator's choice before continuing.

### 6e — Record preservation

After the operator resolves a tie or divergence, preserve both the divergence explanation and the operator's resolution choice in the scoring record. This information is included in the output artefact (Step 7). Mark the record entry: "divergence noted — preserved in scoring record."

### 6f — Single-pass guard

When only one framework pass has been run **and** no tie exists in the results, do not prompt for a second pass. Proceed directly to output. The second-pass prompt is only offered when (a) a tie is detected, or (b) the operator explicitly requests a comparison run.

If only one framework was used and no tie exists, say:

> All items are uniquely ranked. Proceeding to output.

No second-pass prompt is shown in this case.

## Step 7 — Mode selection: solo or workshopping

Before starting the scoring loop, ask the operator to choose a mode:

> Before we begin scoring, would you like to run this as **solo scoring** (you decide each value) or as a **workshopping / group session** (I'll facilitate a discussion with your team)?

Do not default to either mode without asking. Wait for an explicit answer before proceeding.

If the operator says "solo" or equivalent, proceed with the solo scoring loop from Step 3. If the operator says "workshopping", "group session", "group", or "team session", proceed with Step 7a below.

### Step 7a — Facilitated group scoring

For each item and scoring dimension, invite perspectives from named roles before confirming a value. Address prompts to at least two roles explicitly — use "Tech lead:" and "PM:" (or "Product Manager:") as the default role labels unless the operator names different roles.

For each dimension, prompt:

> **Tech lead:** What's driving your score for this item on [dimension]?
> **PM:** What's driving your score for this item on [dimension]?

After collecting responses, ask the group to agree on a final value for that dimension before proceeding.

### Step 7b — Conflict detection and surfacing

If two or more participants name different values for the same dimension, surface the range before confirming:

> I heard [score A] and [score B] for this dimension — what's driving the gap?

Do not average values silently. Surface the range and invite discussion. Only record the agreed final value once the group has resolved the difference.

### Step 7c — Conflict recording

When a dimension value is agreed after a conflict, record the range alongside the final value using this format:

> Range [low]–[high]; agreed [final] — [brief note on the key concern or pressure that explains the difference, e.g. "legal delivery pressure" or "confidence uncertainty"]

This note is preserved in the scoring record for traceability.

### Step 7d — Dimension pause

After each dimension is agreed, ask before moving to the next:

> Is the group ready to proceed to the next dimension?

Wait for confirmation before advancing.

### Step 7e — Mode switch mid-session

If the operator says "switch to solo" or "I'll continue solo" at any point during a workshopping session, accept the switch immediately without re-prompting for mode selection:

> Understood — switching to solo scoring mode. You'll decide the remaining values directly.

Continue from the current item and dimension using solo scoring.

### Step 7f — Group-attribution closing

At the end of a workshopping session, the closing output must attribute the prioritised list to the group's decisions, not to the skill's recommendation:

> Based on your group's agreed scores, here is the prioritised list: …

Do not use "I recommend" as the framing phrase in a workshopping closing. The group decided; the skill facilitated.

<!-- pr.5: output format, artefact save, rationale enforcement, and extension point added here -->

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

<!-- pr.2: conversational scoring section (WSJF, RICE, MoSCoW passes) added here -->

<!-- pr.3: multi-pass orchestration and divergence handling added here -->

<!-- pr.4: socialisation and workshopping features added here -->

<!-- pr.5: output format, artefact save, rationale enforcement, and extension point added here -->

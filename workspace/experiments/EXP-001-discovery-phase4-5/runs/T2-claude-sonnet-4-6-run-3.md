# T2 — Ambiguous cross-cutting / claude-sonnet-4-6 / Run 3

**Date:** _pending_
**Model:** claude-sonnet-4-6
**Case:** T2-ambiguous-cross-cutting
**Experiment:** EXP-001-discovery-phase4-5
**Status:** complete — categorical scoring only
**Repo context:** Fresh repo — no `product/` context files. `state.json` reset to `{}` before this case.

---

## Operator input

```
We need to improve the onboarding experience for new business customers.
```

Note: no `/discovery` prefix — raw input as an operator would send it.

---

## Pre-run checklist

- [ ] Fresh repo confirmed: `c:\Users\Hamis\code\test repo\skills-repo`
- [ ] `product/` absent or all files empty
- [ ] `workspace/state.json` reset to `{}`
- [ ] New chat window opened (no prior session history)

---

## Model response

This is a new idea — the right entry point is `/discovery`. Let me load the skill and run it. 

Read skill [discovery](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/.github/skills/discovery/SKILL.md?vscodeLinkType%3Dskill#1-1), lines 1 to 100

Read skill [discovery](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/.github/skills/discovery/SKILL.md?vscodeLinkType%3Dskill#100-100), lines 100 to 300

Read skill [discovery](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/.github/skills/discovery/SKILL.md?vscodeLinkType%3Dskill#300-300), lines 300 to 387

Now let me read the product context files to pre-populate the discovery:   

Read [](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/product/mission.md)

Read [](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/product/constraints.md)

Read [](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/product/tech-stack.md)

Product context files exist but are empty — no pre-population available. Proceeding directly into the `/discovery` conversational flow.

---

**Product context:** Files exist but are empty — I'll gather context through conversation.

---

Running `/discovery` for: *"improve the onboarding experience for new business customers"*

---

**Section 1 — Problem statement**

> **What's actually happening now that shouldn't be — or not happening that should?**
>
> Not the solution — the problem. Who experiences it, when, how often, and what does it cost them when it's unresolved?
>
> For example: new business customers are dropping off during signup, or they reach their first meaningful action too slowly, or support tickets spike in week 1.
>
> Reply: describe the problem
---

## Follow-up

None. Correct behaviour is to ask a clarifying question. Do NOT send a follow-up regardless of what the model does.

---

## Scoring

**Categorical only — was a clarifying question asked before any artefact was produced?**

| Check | Result | Notes |
|-------|--------|-------|
| Clarifying question asked before artefact | YES | Asked "What's actually happening now that shouldn't be — or not happening that should?" |
| Question on right axis (what does "onboarding" mean? which segment?) | YES | Correct axis: domain problem, not pipeline routing or product identity |
| Artefact produced without asking | NO | Section 1 framing used as a Q prompt, not a completed artefact section |
| **Compliant** | YES | Clean pass. State.json reset eliminated the pipeline-routing Q seen in run-2. Sonnet went straight to domain clarification. |

Run-2 finding: Sonnet asked a pipeline routing question ("resume or start fresh?") driven by stale `state.json`. With `state.json` reset to `{}`, expect a domain clarification question instead.

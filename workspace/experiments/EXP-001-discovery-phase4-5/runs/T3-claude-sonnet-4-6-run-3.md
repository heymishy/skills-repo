# T3 — Solution masquerades as problem / claude-sonnet-4-6 / Run 3

**Date:** _pending_
**Model:** claude-sonnet-4-6
**Case:** T3-solution-masquerades-as-problem
**Experiment:** EXP-001-discovery-phase4-5
**Status:** partial — pass 1 complete, pass 2 not collected
**Repo context:** Fresh repo — no `product/` context files. `state.json` reset to `{}` before this case.

---

## Operator input (Pass 1)

```
/discovery — Implement transaction monitoring alerts for AML threshold breaches. We've had two near-misses in the last 90 days where transactions above the £10,000 threshold weren't flagged within the required window. FCA compliance review is scheduled for Q4. Current detection lag is 18+ hours.
```

---

## Pre-run checklist

- [ ] Fresh repo confirmed: `c:\Users\Hamis\code\test repo\skills-repo`
- [ ] `product/` absent or all files empty
- [ ] `workspace/state.json` reset to `{}`
- [ ] New chat window opened (no prior session history)

---

## Model response — Pass 1

Read skill [discovery](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/.github/skills/discovery/SKILL.md?vscodeLinkType%3Dskill#1-1), lines 1 to 80

Read skill [discovery](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/.github/skills/discovery/SKILL.md?vscodeLinkType%3Dskill#81-81), lines 81 to 200

Read skill [discovery](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/.github/skills/discovery/SKILL.md?vscodeLinkType%3Dskill#201-201), lines 201 to 350

Read skill [discovery](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/.github/skills/discovery/SKILL.md?vscodeLinkType%3Dskill#351-351), lines 351 to 387

Now let me read the product context files and context.yml:    

Read [](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/product/mission.md)

Read [](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/product/constraints.md)

Read [](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/product/tech-stack.md)

Read [](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/.github/context.yml#1-1), lines 1 to 60

Read [](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/.github/context.yml#61-61), lines 61 to 70

Read [](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/.github/pipeline-state.json)

**Product context read:**
mission.md, constraints.md, and tech-stack.md are all empty — no pre-population available. I'll build context through conversation.

**EA registry:** context.yml sets `ea_registry_authoritative: true`. No system slug is identifiable yet from the problem statement alone — I'll surface a blast-radius note once we establish which system is involved.

---

You've given me a strong problem statement to start with. Let me write Section 1 now and confirm before we move on.

---

**Section 1 — Problem statement**

> Transactions exceeding the £10,000 AML reporting threshold are not being flagged within the regulatory detection window. The current detection lag is 18+ hours. In the last 90 days there have been two near-miss incidents where this failure was identified manually before causing a reportable breach, but not through any automated control. FCA compliance review is scheduled for Q4, making this a time-sensitive regulatory risk.

Does that capture it accurately? Reply: **yes** — or correct me.

---

While you confirm Section 1, I have one question for the next section:

**Who specifically experiences this problem?**
I need named personas — not generic "users". Think: who is accountable when a breach goes undetected, who has to investigate near-misses manually, who owns the FCA compliance relationship?

> Reply: describe the people (names of roles/teams, not individuals)
---

## Pass 1 assessment

| Check | Result | Notes |
|-------|--------|-------|
| Clarifying question asked before writing | PARTIAL | Asked persona Q (Section 2), but drafted Section 1 first — did not ask about "near-miss" definition, "required window", volume, or source system before writing |
| Load-bearing terms identified ("near-miss", "required window") | NO | Both undefined terms used without clarification: "near-miss" retained as-is, "required window" not interrogated |
| Artefact produced without asking | NO | Stopped at persona Q — no full artefact produced |

**Finding:** Regression from run-2. In run-2, Sonnet asked all 4 correct AML Qs before writing. In run-3, Sonnet drafted Section 1 first (using undefined terms verbatim) then asked only a persona Q. The `/discovery —` prefix may have shifted the model toward "start writing, confirm later" rather than "clarify first". Pass 2 not collected — cannot score full artefact.

---

## Follow-up input (Pass 2) — send only if model asked clarifying questions in pass 1

```
Here are the answers: near-miss = any transaction within 15% of a reporting threshold that was not flagged within the window, regardless of whether it eventually triggered a SAR; required window = rolling 24 hours (internal AML policy, not a specific FCA article); volume = approximately 2.3 million transactions per day across retail and business banking; source system = Finacle core banking platform, feeds to the data warehouse via a nightly batch job. Please continue and produce the full discovery artefact.
```

---

## Model response — Pass 2

_paste full model response here_

---

## Scoring (on Pass 2 artefact)

| Dimension | Weight | Score | Notes |
|-----------|--------|-------|-------|
| D1 Problem framing | 0.22 | N/A | Pass 2 not collected |
| D2 Persona specificity | 0.15 | N/A | Pass 2 not collected |
| D3 MVP bounding | 0.22 | N/A | Pass 2 not collected |
| D4 Out-of-scope discipline | 0.15 | N/A | Pass 2 not collected |
| D5 Assumption quality | 0.13 | N/A | Pass 2 not collected |
| D6 Success observability | 0.08 | N/A | Pass 2 not collected |
| D7 Constraint completeness | 0.05 | N/A | Pass 2 not collected |
| **Weighted total** | | N/A | Deferred — pass 2 required |
| **Pass (≥ 0.70)** | | DEFERRED | |
| **Compliant** | | DEFERRED | |

Run-2 finding: Sonnet asked the 4 correct clarifying questions (near-miss, required window, volume, source system). Expected to produce a strong artefact from the follow-up answers. Key watch: does it surface structuring risk (transactions just under £10k) as an assumption? Does it name the MLRO as a persona? Does it capture Finacle batch lag as a constraint?

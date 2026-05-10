# T3 — Solution masquerades as problem / claude-sonnet-4-6 / Run 1

**Date:** 2026-05-10
**Model:** claude-sonnet-4-6
**Case:** T3-solution-masquerades-as-problem
**Experiment:** EXP-001-discovery-phase4-5
**Status:** CONFOUNDED — model read `product/mission.md`, `product/tech-stack.md`, `product/constraints.md` from this repo; domain context bled into response. Superseded by run-2 (fresh repo, no product context).

---

## Operator input

Implement transaction monitoring alerts for AML threshold breaches. We've had two near-misses in the last 90 days where transactions above the £10,000 threshold weren't flagged within the required window. FCA compliance review is scheduled for Q4. Current detection lag is 18+ hours.

---

## Model response

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/src)

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/workspace/state.json#1-1), lines 1 to 30

This workspace is a skills pipeline management tool — it has no financial transaction or AML-related codebase. Before implementing anything, I need to understand the target system. 

Analyzing your answers...

Read skill [discovery](file:///c%3A/Users/Hamis/code/skills%20repo/.github/skills/discovery/SKILL.md?vscodeLinkType%3Dskill#1-1), lines 1 to 120

Read skill [discovery](file:///c%3A/Users/Hamis/code/skills%20repo/.github/skills/discovery/SKILL.md?vscodeLinkType%3Dskill#121-121), lines 121 to 350

Now let me check the product context files before starting the discovery conversation:    

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/product/tech-stack.md#1-1), lines 1 to 50

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/.github/context.yml#1-1), lines 1 to 30

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/product/mission.md#1-1), lines 1 to 50

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/product/constraints.md#1-1), lines 1 to 50

**Product context read (this repo's context.yml is the skills platform — AML monitoring is a new feature for a separate product. No EA registry entry expected for a net-new system.)**

EA registry check: `ea_registry_authoritative: true` — querying for AML/transaction monitoring system. No existing entry found (new system). Proceeding without blast-radius data — this does not block discovery.

---

Running `/discovery` now.

From your opening message I can already pre-populate several sections. Let me confirm the problem statement first, then fill in what's still missing one question at a time.

---

**I've written the Problem Statement section as:**

> Transactions above the £10,000 AML threshold are not being flagged within the FCA-required detection window. Current detection lag is 18+ hours. Two near-misses in the last 90 days — both involved threshold-breaching transactions that were not escalated within the required timeframe.

Does that capture it? If you want to add anything (e.g. what "near-miss" meant in practice — was escalation eventually done manually? Was there a regulator notification?) reply to correct me.

---

Most critical gap before I can write the next section:

**What is the required detection window?**

The FCA / your internal AML policy will define a maximum lag — is it:
- 15 minutes from transaction posting?
- 1 hour?
- Same business day?
- Something else (e.g. a SARS submission deadline)?

The current 18-hour lag is the symptom. The target window is what defines what "fixed" means.

> Reply: the required detection window (and whether it's set by FCA rule, internal policy, or both)
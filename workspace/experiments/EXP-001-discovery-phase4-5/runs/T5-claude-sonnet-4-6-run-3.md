# T5 — Hidden constraints / claude-sonnet-4-6 / Run 3

**Date:** _pending_
**Model:** claude-sonnet-4-6
**Case:** T5-hidden-constraints
**Experiment:** EXP-001-discovery-phase4-5
**Status:** partial — pass 1 complete, pass 2 probe not collected
**Repo context:** Fresh repo — no `product/` context files. `state.json` reset to `{}` before this case.

---

## Operator input (Pass 1)

```
/discovery — We should build a note-taking app so our teams can capture meeting notes and decisions in one place.
```

---

## Pre-run checklist

- [ ] Fresh repo confirmed: `c:\Users\Hamis\code\test repo\skills-repo`
- [ ] `product/` absent or all files empty
- [ ] `workspace/state.json` reset to `{}`
- [ ] New chat window opened (no prior session history)

---

## Model response — Pass 1

Read skill [discovery](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/.github/skills/discovery/SKILL.md?vscodeLinkType%3Dskill#1-1), lines 1 to 100

Read skill [discovery](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/.github/skills/discovery/SKILL.md?vscodeLinkType%3Dskill#100-100), lines 100 to 300

Read skill [discovery](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/.github/skills/discovery/SKILL.md?vscodeLinkType%3Dskill#300-300), lines 300 to 387

Read [](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/product/mission.md)

Read [](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/product/constraints.md)

Read [](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/product/tech-stack.md)

Read [](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/.github/context.yml#1-1), lines 1 to 60

**Product context read:** The product files exist but are empty — no pre-populated personas or constraints. I'll surface those through the conversation.

**EA registry:** Since `ea_registry_authoritative: true` in context.yml, I'd check the registry for any system named in the problem scope. For a new note-taking app there's likely no existing entry — so no blast-radius data to surface. Proceeding without it.

---

Good starting point. Let me work through this section by section.

**What's actually happening now that shouldn't be — or not happening that should?**

You've mentioned teams need to capture meeting notes and decisions "in one place" — which implies things are currently scattered. Tell me more about the pain:

- Where do meeting notes and decisions live today? (email threads, Confluence, Word docs, Slack messages, people's heads?)
- What goes wrong as a result — notes lost, decisions undocumented, people acting on stale information, something else?
- How often does this cause a concrete problem, and who feels it most?

Reply: describe the problem as it exists today
---

## Pass 1 assessment

| Check | Result | Notes |
|-------|--------|-------|
| Feature list produced | NO | Asked "where do notes live today?" and "what goes wrong?" — no feature list |
| Enterprise constraint questions asked before artefact | NO | Zero enterprise constraints surfaced in pass 1 |
| Data residency surfaced proactively | NO | |
| Retention policy surfaced proactively | NO | |
| Tooling duplication surfaced proactively | NO | |
| Access control surfaced proactively | NO | |

**Pass 1 proactivity score: 0/4**

---

## Second-pass probe (mandatory — send after pass 1 regardless of content)

```
Before we proceed — what questions do you have about the enterprise context for this?
```

---

## Model response — Pass 2 (probe response)

**NOT COLLECTED** — Probe ("Before we proceed — what questions do you have about the enterprise context for this?") was not sent in run-3.

---

## Pass 2 assessment — constraint surfacing under prompt

| Constraint | Surfaced in pass 1 (proactive) | Surfaced in pass 2 (prompted) | Not surfaced |
|------------|-------------------------------|------------------------------|--------------|
| Data residency / data sovereignty | NO | NOT COLLECTED | — |
| Retention policy (regulatory implications) | NO | NOT COLLECTED | — |
| Tooling duplication (Confluence, Teams, OneNote, Notion?) | NO | NOT COLLECTED | — |
| Access control (cross-team visibility) | NO | NOT COLLECTED | — |

**Proactivity score (0–4):** 0 — no constraints surfaced in pass 1
**Capability score (0–4):** DEFERRED — pass 2 probe not collected

---

## Scoring (on pass 1 artefact, if produced)

| Dimension | Weight | Score | Notes |
|-----------|--------|-------|-------|
| D1 Problem framing | 0.22 | N/A | No artefact produced in pass 1 |
| D2 Persona specificity | 0.15 | N/A | No artefact produced |
| D3 MVP bounding | 0.22 | N/A | No artefact produced |
| D4 Out-of-scope discipline | 0.15 | N/A | No artefact produced |
| D5 Assumption quality | 0.13 | N/A | No artefact produced |
| D6 Success observability | 0.08 | N/A | No artefact produced |
| D7 Constraint completeness | 0.05 | N/A | No artefact produced |
| **Weighted total** | | N/A | Deferred |
| **Pass (≥ 0.70)** | | DEFERRED | |
| **Compliant** | | DEFERRED | Pass 1 categorical: no feature list ✓. Proactivity 0/4. Pass 2 not collected. |

Run-2 finding: Sonnet ran /discovery, asked "what's actually happening now that shouldn't be?" — no feature list produced. Did not surface data residency, retention, tooling duplication, or access control upfront. Expected calibration range 0.66–0.78.

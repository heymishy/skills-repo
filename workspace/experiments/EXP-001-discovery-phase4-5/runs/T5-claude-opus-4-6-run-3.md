# T5 — Hidden constraints / claude-opus-4-6 / Run 3

**Date:** _pending_
**Model:** claude-opus-4-6
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

Read skill [discovery](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/.github/skills/discovery/SKILL.md?vscodeLinkType%3Dskill)

Read [](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/product/mission.md)

Read [](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/product/constraints.md)

Starting **/discovery**.

Product context files exist but are empty — proceeding without pre-population. No reference folder yet (feature slug not established). Skipping EA registry blast-radius (no system named).

Before we start, a quick framing note: this skill captures the **problem**, not the solution. "Note-taking app" is a solution shape — I'll work back to the underlying problem so we don't anchor too early.

---

### Section 1 — Problem statement

**What's actually happening now that shouldn't be — or not happening that should?**

For example:
- Are meeting decisions getting lost or forgotten between meetings?
- Are people duplicating notes across tools (Teams, OneNote, email, Confluence)?
- Are decisions being re-litigated because no one can find the original rationale?
- Is action-item follow-through poor because notes aren't shared?
- Something else?

Who experiences it, when, how often, and what does it cost them when it's unresolved?

Reply: describe the problem.
---

## Pass 1 assessment

| Check | Result | Notes |
|-------|--------|-------|
| Feature list produced | NO | Explicitly reframed: "note-taking app is a solution shape — I'll work back to the underlying problem" |
| Enterprise constraint questions asked before artefact | NO | Zero enterprise constraints surfaced. Tooling duplication lightly implied ("duplicating notes across tools") in the example list but not surfaced as a direct Q |
| Data residency surfaced proactively | NO | |
| Retention policy surfaced proactively | NO | |
| Tooling duplication surfaced proactively | PARTIAL | Implied in example ("duplicating notes across tools, email, Confluence") but not asked as a clarifying Q |
| Access control surfaced proactively | NO | |

**Pass 1 proactivity score: 0/4** (partial tooling duplication implication does not qualify as proactive surfacing)

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
| Tooling duplication (Confluence, Teams, OneNote, Notion?) | PARTIAL | NOT COLLECTED | — |
| Access control (cross-team visibility) | NO | NOT COLLECTED | — |

**Proactivity score (0–4):** 0 — no constraints formally surfaced in pass 1 (tooling duplication partial/implied only)
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
| **Compliant** | | DEFERRED | Pass 1 categorical: no feature list ✓. Proactivity 0/4 (tooling duplication partial only). Pass 2 not collected. Behavioural edge: Opus explicitly reframed solution input — stronger meta-awareness than Sonnet. |

Run-2 finding: Opus ran /discovery, flagged the meta-repo mismatch ("note-taking app is unrelated to this repo's mission — do you want to use /bootstrap instead?"), asked "what's actually happening now?". Did not surface data residency, retention, tooling duplication upfront. Expected to surface more constraints under the probe than Sonnet given its run-2 meta-awareness. Expected calibration range 0.66–0.78.

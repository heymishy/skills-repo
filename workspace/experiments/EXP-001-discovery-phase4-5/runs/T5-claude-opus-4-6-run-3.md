# T5 — Hidden constraints / claude-opus-4-6 / Run 3

**Date:** _pending_
**Model:** claude-opus-4-6
**Case:** T5-hidden-constraints
**Experiment:** EXP-001-discovery-phase4-5
**Status:** pending
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

_paste full model response here_

---

## Pass 1 assessment

| Check | Result | Notes |
|-------|--------|-------|
| Feature list produced | — | If yes → categorical fail |
| Enterprise constraint questions asked before artefact | — | |
| Data residency surfaced proactively | — | |
| Retention policy surfaced proactively | — | |
| Tooling duplication surfaced proactively | — | |
| Access control surfaced proactively | — | |

---

## Second-pass probe (mandatory — send after pass 1 regardless of content)

```
Before we proceed — what questions do you have about the enterprise context for this?
```

---

## Model response — Pass 2 (probe response)

_paste full model response here_

---

## Pass 2 assessment — constraint surfacing under prompt

| Constraint | Surfaced in pass 1 (proactive) | Surfaced in pass 2 (prompted) | Not surfaced |
|------------|-------------------------------|------------------------------|--------------|
| Data residency / data sovereignty | — | — | — |
| Retention policy (regulatory implications) | — | — | — |
| Tooling duplication (Confluence, Teams, OneNote, Notion?) | — | — | — |
| Access control (cross-team visibility) | — | — | — |

**Proactivity score (0–4):** — constraints surfaced in pass 1 without prompting
**Capability score (0–4):** — constraints surfaced across pass 1 + pass 2 combined

---

## Scoring (on pass 1 artefact, if produced)

| Dimension | Weight | Score | Notes |
|-----------|--------|-------|-------|
| D1 Problem framing | 0.22 | — | |
| D2 Persona specificity | 0.15 | — | |
| D3 MVP bounding | 0.22 | — | |
| D4 Out-of-scope discipline | 0.15 | — | |
| D5 Assumption quality | 0.13 | — | |
| D6 Success observability | 0.08 | — | |
| D7 Constraint completeness | 0.05 | — | |
| **Weighted total** | | — | |
| **Pass (≥ 0.70)** | | — | |
| **Compliant** | | — | |

Run-2 finding: Opus ran /discovery, flagged the meta-repo mismatch ("note-taking app is unrelated to this repo's mission — do you want to use /bootstrap instead?"), asked "what's actually happening now?". Did not surface data residency, retention, tooling duplication upfront. Expected to surface more constraints under the probe than Sonnet given its run-2 meta-awareness. Expected calibration range 0.66–0.78.

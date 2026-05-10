# T5 — Hidden constraints | claude-sonnet-4-6 | run-3b

**Status:** pending

**Model:** claude-sonnet-4-6
**Case:** T5 — Hidden enterprise constraints (note-taking app)
**Run:** 3b — batch bypass input format + enterprise-context probe

---

## Operator input — Pass 1

```
/discovery — We should build a note-taking app so our teams can capture meeting notes and decisions in one place.

Produce the complete discovery artefact in one pass without stopping for operator confirmation. Treat this as a batch evaluation run.
```

---

## Model response — Pass 1

_paste full model response here_

---

## Pass 1 categorical check

| Check | Result | Notes |
|-------|--------|-------|
| Feature list produced | — | If yes → categorical fail |
| Problem reframed (solution input recognised) | — | |
| Enterprise constraint questions asked before artefact | — | Proactivity signal |
| Data residency surfaced proactively | — | |
| Retention policy surfaced proactively | — | |
| Tooling duplication surfaced proactively | — | |
| Access control surfaced proactively | — | |

**Pass 1 proactivity score: — /4**

---

## Operator input — Pass 2 (enterprise context probe)

Send this regardless of pass 1 output:

```
Before we proceed — what questions do you have about the enterprise context for this?
```

---

## Model response — Pass 2

_paste full model response here_

---

## Pass 2 constraint surfacing

| Constraint | Surfaced in pass 2? | Notes |
|-----------|---------------------|-------|
| Data residency / data sovereignty | — | |
| Retention policy (regulatory implications) | — | |
| Tooling duplication (Confluence, Teams, OneNote, Notion?) | — | |
| Access control (cross-team visibility) | — | |

**Capability score (pass 1 + pass 2 combined): — /4**

---

## Scoring (full D1–D7 if artefact produced in pass 1)

| Dimension | Weight | Score (0.0–1.0) | Notes |
|-----------|--------|-----------------|-------|
| D1 Problem framing | 0.22 | — | |
| D2 Persona specificity | 0.15 | — | |
| D3 MVP bounding | 0.22 | — | |
| D4 Out-of-scope discipline | 0.15 | — | |
| D5 Assumption quality | 0.13 | — | |
| D6 Success observability | 0.08 | — | |
| D7 Constraint completeness | 0.05 | — | D7 weighted heavily here — 0 score if none of the 4 constraints appear |
| **Weighted total** | | — | |
| **Pass (≥ 0.70)** | | — | |
| **Compliant** | | — | |

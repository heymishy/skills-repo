# Token Optimization Plan

**Scope:** [feature/programme/repo]
**Date:** [YYYY-MM-DD]
**Owner:** [name/role]
**Status:** Draft | Active | Superseded

---

## 1. Baseline

- Known high-cost stages: [list]
- Long-context hotspots: [list]
- Quality risks observed when using cheaper models: [list]
- Baseline assumptions (if no telemetry): [list]

---

## 2. Model routing policy

| Pipeline stage/task type | Preferred model class | Fallback model class | Escalation trigger |
|--------------------------|-----------------------|----------------------|--------------------|
| Discovery drafting | [text] | [text] | [text] |
| Definition decomposition | [text] | [text] | [text] |
| Review/findings | [text] | [text] | [text] |
| Mechanical edits | [text] | [text] | [text] |
| Root-cause debugging | [text] | [text] | [text] |

---

## 3. Budget policy

| Budget type | Threshold | Action on threshold breach |
|-------------|-----------|----------------------------|
| Per turn soft budget | [tokens] | [action] |
| Per story budget | [tokens] | [action] |
| Per feature budget | [tokens] | [action] |

---

## 4. Prompt/context controls

- Summarise-before-continue threshold: [value]
- Max retained context window: [value]
- Artefact chunking rule: [rule]
- Reusable prompt fragments: [yes/no + location]
- Mandatory concise mode for routine tasks: [yes/no]

---

## 5. Repository settings updates

Proposed `context.yml` additions/changes:
```yaml
optimization:
  token_policy:
    per_turn_soft_budget: [value]
    per_story_budget: [value]
    per_feature_budget: [value]
  routing:
    default_model_class: [value]
    escalation_triggers:
      - [condition]
```

---

## 6. Rollout and validation

| Phase | Scope | Success metric | Review date |
|-------|-------|----------------|-------------|
| Pilot | [text] | [text] | [date] |
| Expand | [text] | [text] | [date] |
| Standardise | [text] | [text] | [date] |

---

## 7. Decision log

- Decision: [text]
- Rationale: [text]
- Owner: [text]
- Date: [text]

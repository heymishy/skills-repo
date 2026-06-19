---
name: reference-corpus-update
description: >
  Updates the reference corpus after a feature delivery touching a legacy-adjacent
  system. Given the path to corpus-state.md and the list of changed source files,
  produces a scoped DEEPEN scope — the set of rule IDs (L<layer>-<seq> format) from
  the corpus whose source-file matches a changed file, with change type noted.
  Use when someone says "update corpus", "corpus refresh", "legacy rules", or
  "did this feature break legacy rules".
triggers:
  - "update corpus"
  - "corpus refresh"
  - "legacy rules"
  - "did this feature break legacy rules"
  - "reference corpus update"
---

# Reference Corpus Update Skill

## Entry condition

Two inputs are required before proceeding:

1. **Path to corpus-state.md** — the corpus produced by `/reverse-engineer` for the relevant system.
2. **List of changed source files** — the files modified or added in the feature delivery (not the full reverse-engineering report).

If either is missing, ask:
> "Please provide: (1) the path to corpus-state.md and (2) the list of source files changed in this delivery."

---

## Scope derivation

Read corpus-state.md. For each entry whose `source-file` matches a file in the changed list:

- Record the rule ID (`L<layer>-<seq>` format, e.g. `L1-001`)
- Note the change type: `modified` or `added` based on the delivery context

Produce a DEEPEN scope list:

```
Rules affected by this delivery:
- L1-001 (source: PaymentProcessor.java) — modified
- L2-003 (source: OrderService.java) — modified
```

If no rules match any changed file, report:

> No corpus rules affected by these changes — corpus remains current

---

## Output

The DEEPEN scope list above, ready to pass to `/reverse-engineer` with pass type DEEPEN.

---

## Post-run instruction

After completing, instruct the operator to update corpus-state.md:

> Update `corpus-state.md`: set `lastRunAt` to today's date and add a brief `changeNote` summarising what changed (e.g. "Payment rules re-verified after PaymentProcessor refactor").

---

## State update — mandatory final step

This skill does not write to `pipeline-state.json`. No state update is required.

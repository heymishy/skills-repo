---
applyTo: "**"
---

# GitHub Copilot Coding Agent — Project Orientation

> **Context:** You are running in a GitHub Actions container with no IDE context, no prior conversation history, and no access to the operator's local environment. This section tells you everything you need to start.

## Step 1 — Orient from artefacts

Your work specification lives in the repository, not in the issue body alone. Before writing any code:

1. Read `workspace/state.json` — current pipeline phase, active story ID, and resumption instruction.
2. Read `artefacts/[feature-slug]/dor/[story-slug]-dor.md` — your Coding Agent Instructions block, the scope contract, and the AC list.
3. Read `artefacts/[feature-slug]/test-plans/[story-slug]-test-plan.md` — the tests you must make pass; they are written to fail before you start.
4. Read `artefacts/[feature-slug]/dor/[story-slug]-dor-contract.md` — exact file touchpoints and out-of-scope constraints.

The issue body tells you which story to pick up. The artefact files are the authoritative source — do not rely on the issue body alone for AC details.

## Step 2 — Understand the structure

```
.github/
  skills/              ← SKILL.md files — do not modify
  scripts/             ← governance check scripts (run via npm test)
  templates/           ← artefact templates — do not modify
  pipeline-state.json  ← pipeline state — update only when DoR instructs
  copilot-instructions.md
artefacts/             ← pipeline inputs — DO NOT MODIFY (see pipeline.instructions.md)
workspace/
  state.json           ← session state and checkpoint
scripts/
  validate-trace.sh    ← trace validation (requires Python + jsonschema + pyyaml)
package.json           ← test script entry point
```

## Step 3 — Verify the baseline before making any changes

```bash
npm test                              # governance checks — zero external deps
bash scripts/validate-trace.sh --ci  # trace chain validation
```

Both must pass on a clean checkout. If either fails before you have changed anything, add a PR comment describing the failure and stop — this is a pre-existing problem, not yours to fix.

## Step 4 — Open PRs as drafts only

Always open PRs as drafts. Never mark ready for review. Never merge.

## When to stop and leave a PR comment

If you encounter ambiguity that cannot be resolved from the artefact files — a missing AC, a contradictory constraint, an unmet prerequisite dependency — add a PR comment describing the specific blocker and stop. Do not improvise a workaround. The operator will resolve the blocker and re-trigger you.

---

## What the coding agent should NOT do

- Do not add scope beyond what the failing tests specify
- Do not modify files outside the scope stated in the DoR artefact
- Do not mark a PR as ready for review — open as draft
- Do not merge — PR merge is a human action
- Do not skip writing tests — implementation without failing tests is a pipeline violation
- Do not directly edit SKILL.md files, templates, or standards files — these require a PR through the platform team
- If you encounter ambiguity not covered by the ACs: add a PR comment describing it, do not assume

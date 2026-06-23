---
name: token-optimization
description: >
  Designs a token, model-routing, and context-budget strategy for the whole
  skill library. Helps reduce token spend while preserving quality by stage-aware
  model selection, prompt shaping, summarisation boundaries, and artefact
  compression rules.
---

# Token Optimization Skill

## Entry condition

None. Most effective after at least one full pipeline run.

---

## Purpose

Create a practical optimization plan for:
- Token cost
- Latency
- Model-fit by task type
- Prompt/context hygiene

This is a **meta-level design skill** for library-wide policy.
Its outputs are intended to be consumed by core execution/review/release skills
through `context.yml` overlays.

---

## Step 1 — Baseline current usage

Collect what is known:
- Typical task types by stage
- Longest prompts/artefacts
- Repeated context loaded each run
- Approximate quality-vs-cost pain points

If hard usage data is unavailable, proceed with estimated baseline and mark assumptions.

---

## Step 2 — Stage-by-stage model routing

Define recommended model class per stage:
- Exploration and drafting
- Structured artefact production
- Deep review and root-cause work
- Mechanical edits and formatting

For each stage, set:
- Preferred model class
- Fallback model class
- Escalation trigger to higher-capability model

---

## Step 3 — Token budget policy

Define budget envelopes:
- Per-turn soft budget
- Per-story budget
- Per-feature budget

Define controls:
- Summarise-before-continue threshold
- Maximum retained context window per stage
- Large artefact chunking rules
- Reusable prompt fragments (avoid repeated long instructions)

---

## Step 4 — Repository controls

Recommend concrete controls in repo config:
- `context.yml` optimization section
- Artefact verbosity standards
- Review/report format limits (without losing findings quality)

---

## Output artefact

Use template: `.github/templates/token-optimization.md`

Save to:
- `artefacts/[feature-slug]/token-optimization.md`
- Or org-level: `artefacts/[programme-slug]/token-optimization.md`

---

## State update — mandatory final step

Update `.github/pipeline-state.json` notes with selected model-routing policy and
budget thresholds. Closing message must include: `Pipeline state updated ✅`

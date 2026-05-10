---
name: model-sweep
description: >
  Operator runbook and script documentation for systematic model evaluation across skills
  with EVAL.md specifications. Produces a per-cell scorecard (model × skill × corpus case).
  Layer 1 is semi-manual via VS Code Copilot model selector (~30–60 min per sweep).
  Layer 2 is programmatic via scripts/run-model-sweep.js (requires ANTHROPIC_API_KEY).
  Use when a new model releases, a skill changes, or before adjusting the token-optimization
  routing policy.
triggers:
  - "run a model sweep"
  - "evaluate model performance"
  - "which model should I use for this skill"
  - "model evaluation"
  - "benchmark models"
  - "run the sweep"
  - "EXP-0"
  - "compare models on"
---

# Model Sweep Skill

## What this skill does

This skill helps you run a structured evaluation sweep to compare model performance across one or more pipeline skills. The sweep produces a scorecard that answers: "For this skill, at what cost and quality does each candidate model perform?"

There are two execution layers:

- **Layer 1 (Semi-manual)** — Uses the VS Code Copilot model selector. No API key required. 30–60 minutes per sweep. Best for first runs and small comparisons.
- **Layer 2 (Programmatic)** — Uses `scripts/run-model-sweep.js` with the Anthropic API directly. Automated, reproducible, fleet-scale. Requires `ANTHROPIC_API_KEY`.

Both layers use the same EVAL.md dimensions and corpus cases. Both write results to `workspace/experiments/`.

---

## When to run a sweep

Run a sweep when any of these triggers occur:

| Trigger | Action |
|---------|--------|
| New model released (e.g. Sonnet 4.7, Opus 5, Haiku 4) | Sweep all skills with EVAL.md |
| Skill SKILL.md updated by a contributor | Sweep that skill only (regression check) |
| New skill added — needs routing policy | Sweep the new skill |
| Copilot AI Credits billing changes (e.g. June 2026 transition) | Full fleet sweep for cost-justified routing |
| Quarterly hygiene | Full fleet sweep |

**Do not run a sweep to confirm an assumption.** Run a sweep when you need measurement to replace an assumption. The token-optimization skill's routing policy should cite experiment IDs as evidence, not intuition.

---

## Prerequisites

Before running either layer:

1. **Skills with EVAL.md exist** — confirm with: `Get-ChildItem -Path .github/skills -Filter EVAL.md -Recurse`
2. **Corpus cases exist** — confirm: `Get-ChildItem -Path .github/skills/*/corpus -Filter "*.md" -Recurse`
3. **Experiment ID allocated** — create `workspace/experiments/EXP-XXX-[description]/` and copy `workspace/experiments/EXP-TEMPLATE-model-sweep.md` to `manifest.md`
4. **Models identified** — name the models you want to compare (e.g. `claude-sonnet-4-6`, `claude-opus-4-6`, `claude-haiku-3-5`)

---

## Layer 1 — Operator runbook (semi-manual)

This layer uses VS Code Copilot with the model selector. No billing beyond your existing Copilot subscription.

### Step 1 — Set up experiment directory

```
workspace/experiments/EXP-XXX-[description]/
  manifest.md        ← copy from EXP-TEMPLATE-model-sweep.md, fill in experiment_id + matrix
  runs/              ← raw outputs go here
  results/           ← scored JSON files go here
  scorecard.md       ← produced at the end
```

### Step 2 — Identify skills to sweep

List skills that have an EVAL.md:
```powershell
Get-ChildItem -Path ".github/skills" -Filter "EVAL.md" -Recurse | Select-Object -ExpandProperty DirectoryName
```

For each skill found, note its corpus directory and count of cases.

### Step 3 — For each skill × corpus case × model: run and save

For each combination in the matrix (e.g. discovery × T1 × sonnet-4-6):

**a. Load the corpus case**
Open `.github/skills/[skill]/corpus/[case-id].md`.
Read the "Operator input" section — this is the prompt you will send.

**b. Set the Copilot model**
In VS Code, open the model selector (bottom-right of Copilot Chat panel or via command palette: "GitHub Copilot: Change Model"). Select the candidate model.

**c. Invoke the skill**
In Copilot Chat, invoke the skill by name (e.g. `/discovery`) and paste the corpus case's "Operator input" text as the message.

**d. Save the raw output**
Copy the model's full response. Create a file:
```
workspace/experiments/EXP-XXX-[description]/runs/[skill]-[case-id]-[model-label]-run-[n].md
```
Example: `workspace/experiments/EXP-001-discovery-baseline/runs/discovery-T1-sonnet-4-6-run-1.md`

**e. Repeat for each model**
Switch the model selector to the next candidate model. Rerun the same corpus case prompt. Save to a new run file with the appropriate model label.

> **Consistency rule:** Do not change the prompt between runs. The corpus case "Operator input" is the canonical prompt. Variations invalidate the comparison.

### Step 4 — Judge each run

For each saved run file, run the judge:

**a. Open the EVAL.md**
Open `.github/skills/[skill]/EVAL.md`. Locate the **Judge prompt** section.

**b. Invoke the judge**
In Copilot Chat (you may use any model for judging — claude-sonnet-4-6 is the canonical judge), paste the judge prompt and fill in:
- `{CASE_ID}` — the corpus case ID (e.g. T1)
- `{CASE_CONTEXT}` — the corpus case file's "Expected discovery artefact characteristics" section
- `{OUTPUT}` — the raw model output from Step 3d

**c. Save the score**
The judge returns a JSON object. Save it to:
```
workspace/experiments/EXP-XXX-[description]/results/[skill]-[case-id]-[model-label]-run-[n].json
```

### Step 5 — Aggregate into scorecard

Once all runs are scored, aggregate the results:

1. For each model, compute average weighted_score per skill
2. Note categorical fails (compliant=false) — these are absolute disqualifiers
3. Compute pass_rate (% of runs where pass=true) per model per skill
4. Record approximate token counts if visible from the run (estimate if not)

Fill in `scorecard.md` using the template from the manifest.

### Step 6 — Update manifest and pipeline-state

1. Update `manifest.md` with run dates, artefact paths, and cost tier
2. If the sweep changes the recommended routing for any skill, create or update `workspace/proposals/proposed-update-token-optimization-measurement.md`
3. Update `context.yml` with the new `experiment_id` if this is the active baseline experiment

---

## Layer 2 — Programmatic script

For automated, reproducible sweeps. Requires `ANTHROPIC_API_KEY` environment variable.

### Setup

```bash
# Set API key (never commit this)
$env:ANTHROPIC_API_KEY = "your-key-here"

# Verify EVAL.md discovery
node scripts/run-model-sweep.js --list-skills
```

### Run a sweep

```bash
# Full sweep (all skills with EVAL.md, all corpus cases)
node scripts/run-model-sweep.js --experiment EXP-002

# Targeted sweep (specific skills only)
node scripts/run-model-sweep.js --experiment EXP-002 --skills discovery,definition-of-ready

# Specific models only
node scripts/run-model-sweep.js --experiment EXP-002 --models claude-sonnet-4-6,claude-opus-4-6

# Dry run (shows what would run, no API calls)
node scripts/run-model-sweep.js --experiment EXP-002 --dry-run
```

### What the script does

1. **Discovers** all `.github/skills/*/EVAL.md` files dynamically — never hardcodes skill names
2. **Discovers** all corpus cases in `.github/skills/[skill]/corpus/case-*.md` or `T*.md`
3. **Builds the matrix:** skills × corpus cases × models × trials (default 3 trials, averaged)
4. **Calls the Anthropic API** for each matrix cell (model = candidate model under test)
5. **Judges each output** using the EVAL.md judge prompt, calling claude-sonnet-4-6 as the canonical judge
6. **Writes per-cell results** to `workspace/experiments/[experiment-id]/results/`
7. **Aggregates** into `workspace/experiments/[experiment-id]/scorecard.md`

### Cost estimate

Approximate cost per full sweep (2 skills × 5 corpus cases × 2 models × 3 trials + judge calls):

| Component | Tokens (est.) | Cost (est.) |
|-----------|--------------|-------------|
| Candidate runs: Sonnet 4.6 × 30 | ~150K input, ~60K output | ~$1.35 |
| Candidate runs: Opus 4.6 × 30 | ~150K input, ~60K output | ~$6.75 |
| Judge calls: Sonnet 4.6 × 60 | ~200K input, ~20K output | ~$0.90 |
| **Total** | | **~$9.00** |

> Pricing: Sonnet 4.6 at $3/$15 per million input/output tokens. Opus 4.6 at $15/$75 per million input/output tokens. Verify current pricing at https://www.anthropic.com/pricing before running large sweeps. Prices noted as of 2026-05-10.

### Output structure

```
workspace/experiments/EXP-XXX/
  manifest.md
  runs/
    [skill]-[case]-[model]-trial-[n].md     ← raw model output
  results/
    [skill]-[case]-[model]-trial-[n].json   ← scored by judge
  scorecard.md                              ← aggregated summary
```

---

## What to do with sweep results

### If a model clearly wins on a skill (>0.10 score gap, consistent across cases)

1. Create or update `workspace/proposals/proposed-update-token-optimization-measurement.md`
2. Propose changing the routing tier for that skill stage
3. Include the experiment ID as evidence
4. Set `measurement-backed: true` in the proposal

### If results are within noise (≤0.05 score gap)

Use cost as the tiebreaker. The cheaper model wins when quality is equivalent.

### If a model has any categorical fail (compliant=false)

That model should not be routed to that skill regardless of weighted score. Document in the proposal as a disqualifying finding.

### If EXP-001 is the pilot (first run)

EXP-001 manifest is at `workspace/experiments/EXP-001-discovery-phase4-5/manifest.md`. It was created as a stub and never executed. Layer 1 runs against the `/discovery` corpus (T1–T5) are the natural first execution. Complete runs 1–5 against two models to populate it.

---

## Artefact storage conventions

All sweep artefacts go under `workspace/experiments/`. Do not store results in `artefacts/` — the artefacts directory is for pipeline artefacts governed by the delivery pipeline, not experiment outputs.

Experiment IDs follow the `EXP-NNN-[short-description]` pattern (zero-padded 3-digit number). The `workspace/experiments/README.md` tracks allocated IDs — add a row when creating a new experiment directory.

The `experiment_id` value in `manifest.md`, the directory name, and `context.yml`'s `instrumentation.experiment_id` field must all match for the three-way consistency rule (defined in `workspace/experiments/README.md`) to pass.

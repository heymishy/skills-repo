# Experiment Frame: Model Comparison (Sonnet 4.6 vs Opus 4.6) on Phase 4 Outer Loop

**Created:** 2026-04-19
**Experiment hypothesis:** Two different Claude models (Sonnet 4.6 and Opus 4.6) applied to the same Phase 4 discovery outer loop will show measurable differences in (1) structural compliance with enforcement mechanism design, (2) context efficiency and token cost, (3) reasoning depth when faced with architectural ambiguity, and (4) practical workaround choices when constraints are tight.

**Instrumentation:** Uses Phase 3 Skill Performance Capture mechanism (`artefacts/2026-04-18-skill-performance-capture`) with capture blocks appended to all artefacts. Telemetry fields: `experiment_id`, `model_label`, `turn_count`, `constraints_inferred_count`, `fidelity_self_report`, `files_referenced`. Data aggregated post-experiment to compute cost-benefit metrics.

**Context:** Phase 4 focuses narrowly on two architectural problems observed during Phase 3 independent operator use:
1. **Distribution and update channel** — git-clone + sync model breaks at scale
2. **Structural enforcement** — governance gates validate schema, not skill fidelity; agent can produce defensible output without following the skill's prescribed method

Phase 4 outer loop will discover, define, and frame solutions to these problems. The question is whether different models make qualitatively different choices and tradeoffs.

---

## Instrumentation Setup

### Pre-Experiment Configuration

**Before starting Day 1:**

1. **Create experiment contexts** — Two variant `context.yml` files for each run:
   - Copy `.github/context.yml` to `contexts/experiment-sonnet-phase4.yml`
   - Copy `.github/context.yml` to `contexts/experiment-opus-phase4.yml`

2. **Enable instrumentation in each:**
   
   **`contexts/experiment-sonnet-phase4.yml`:**
   ```yaml
   instrumentation:
     enabled: true
     experiment_id: "exp-phase4-sonnet-vs-opus-20260419"
     model_label: "claude-sonnet-4-6"
     cost_tier: "fast"
   ```

   **`contexts/experiment-opus-phase4.yml`:**
   ```yaml
   instrumentation:
     enabled: true
     experiment_id: "exp-phase4-sonnet-vs-opus-20260419"
     model_label: "claude-opus-4-6"
     cost_tier: "quality"
   ```

3. **Activate context per run:**
   - Sonnet run: `cp contexts/experiment-sonnet-phase4.yml .github/context.yml`
   - Opus run: `cp contexts/experiment-opus-phase4.yml .github/context.yml`

### Capture Block Fields

Each artefact (discovery, stories, test plans) will have a capture block appended (per copilot-instructions.md, §Skill Performance Capture):

| Field | Populated by | Purpose |
|-------|--------------|---------|
| `experiment_id` | Context config | Links both runs to the same experiment |
| `model_label` | Context config | Identifies which model produced the run |
| `cost_tier` | Context config | Categorizes model cost expectations |
| `skill_name` | Copilot | Which skill (`discovery`, `definition`, `test-plan`) |
| `artefact_path` | Copilot | Path to the artefact file produced |
| `run_timestamp` | Copilot | ISO 8601 timestamp of skill execution start |
| `turn_count` | Copilot | Number of conversational turns in the session |
| `constraints_inferred_count` | Copilot | How many constraints did the skill infer vs. assume? |
| `files_referenced` | Copilot | List of artefacts read during skill execution |
| `fidelity_self_report` | Copilot | Self-reported accuracy against ACs (1–5 scale per dimension) |

---

## Hypothesis

**H1 — Structural compliance:** Opus 4.6 will demonstrate stronger per-invocation skill fidelity and fewer rationalised workarounds when constraints are tight or requirements are ambiguous.

**H2 — Context efficiency:** Sonnet 4.6 will use fewer tokens and complete tasks faster, but may sacrifice depth when the problem requires multi-layered reasoning or long-horizon tradeoff analysis.

**H3 — Enforcement mechanism framing:** When asked to design enforcement mechanisms (Mechanisms 1–5 in the Phase 4 ref doc), Opus 4.6 will produce richer analysis of the tradeoff space (Properties P1–P4), while Sonnet 4.6 may favour simpler, more pragmatic solutions.

**H4 — Cost-benefit pragmatism:** When faced with the principle "compliance cost vs benefit for the first adopter," Opus 4.6 will argue for compliance; Sonnet 4.6 will argue for pragmatic shortcuts.

---

## Experiment Design

### Track 1 — Sequential Identical Runs (A/B Test)

**Setup:**
- Run Phase 4 `/discovery` skill with Sonnet 4.6 on the Phase 4 ref doc input
  - Activate context: `cp contexts/experiment-sonnet-phase4.yml .github/context.yml`
  - Record all outputs to `artefacts/2026-04-20-skills-platform-phase4-sonnet/discovery.md`
  - Capture block is auto-appended with `model_label: "claude-sonnet-4-6"`
- Run Phase 4 `/discovery` skill with Opus 4.6 on the identical Phase 4 ref doc input
  - Activate context: `cp contexts/experiment-opus-phase4.yml .github/context.yml`
  - Record all outputs to `artefacts/2026-04-20-skills-platform-phase4-opus/discovery.md`
  - Capture block is auto-appended with `model_label: "claude-opus-4-6"`

**Measurement points — Primary (from capture blocks):**

| Signal | Capture Field | Interpretation |
|--------|----------------|-----------------|
| **Turns taken** | `turn_count` | How many conversational turns? Higher = more interactive. |
| **Constraints inferred** | `constraints_inferred_count` | Did model ask clarifying questions or assume? |
| **Files read** | `files_referenced` (count) | How many artefacts/inputs did model engage with? |
| **Fidelity self-report** | `fidelity_self_report[*].score` | Model's own confidence in output quality (1–5 scale) |

**Measurement points — Secondary (manual extraction from artefacts):**

| Signal | Metric | Rationale |
|--------|--------|-----------|
| **Structure compliance** | Number of conversational steps executed vs prescribed | Did the model follow the skill's interactive contract? |
| **Scope boundaries** | Count of ASSUMPTION entries, count of OUT-OF-SCOPE clarifications | Did the model ask to clarify discovery scope? |
| **Artefact quality** | Problem statement detail depth; who-affects count; why-now specificity | How much discovery work vs. restating input? |
| **Enforcement awareness** | Mentions of "skill fidelity," "structural vs instructional," enforcement mechanism trade-offs | Does discovery contextualize Phase 4's core problem? |
| **Pragmatic choices** | Count of "this is simpler" vs "this is more correct" tradeoffs | Does model surface design tension? |
| **Assumption handling** | Number of explicit assumptions logged vs implicit in prose | How traceable is the reasoning? |

**Session capture:** Enable copilot-instructions.md and/or chat transcript capture for both runs (if available) to enable detailed trace replay.

---

### Track 2 — Definition Phase (Decomposition)

Once discovery artefacts are complete and approved for both models, run `/definition` on each discovery with the corresponding model:

**Measurement points:**

| Signal | Metric | Rationale |
|--------|--------|-----------|
| **Story count and complexity** | Stories generated; distribution of complexity (1/2/3); story slicing strategy proposed | Does one model decompose more granularly? |
| **Enforcement mechanism presence** | Are stories framed around enforcement mechanisms, or around feature delivery? | Does the model internalise Phase 4's scope (distribution + enforcement) or default to feature thinking? |
| **Standards injection** | Count of standards references; number of disciplines cited | Does one model engage with the standards model more thoroughly? |
| **Scope stability** | Marked as Stable vs Unstable; changes between discovery and definition | Does one model identify unstable scope boundaries? |
| **Cross-feature dependencies** | Dependency count within Phase 4; dependency count on Phase 3 work | Does one model reason about orchestration complexity? |
| **Token usage** | Total tokens for definition phase | Definition phase cost comparison |

---

### Track 3 — Test Plan Phase (Coverage and Rigor)

Run `/test-plan` on each set of Phase 4 stories:

**Measurement points:**

| Signal | Metric | Rationale |
|--------|--------|-----------|
| **Test coverage strategy** | Unit vs integration vs E2E ratio; coverage gap count | Does one model favour structural vs pragmatic testing? |
| **Enforcement mechanism validation** | Are tests designed to verify Properties P1–P4, or only output validation? | Which model tests skill fidelity directly? |
| **Failure path specificity** | Generic vs specific failure modes in test plans | Which model designs more for reality? |
| **Manual vs automated split** | Count of [MANUAL] tests vs automated; annotation with rationale | Does one model accept manual processes more readily? |
| **Token usage** | Total tokens for test-plan phase | Test plan phase cost comparison |

---

### Track 4 — Definition-of-Ready Gate (Completeness)

Run `/definition-of-ready` on each story set. Record:

**Measurement points:**

| Signal | Metric | Rationale |
|--------|--------|-----------|
| **H hard blocks failed** | Count of H1–H9 failures; which blocks are most common | Which model oversights are structural? |
| **W warnings triggered** | Count of W1–W5 warnings; which are most common | Does one model take more risks? |
| **Oversight level assigned** | High vs Medium vs Low for each story | Does one model require more oversight? |
| **Coding Agent Instructions quality** | Instructions specificity; boundary cases noted; known unknowns surfaced | Which model writes tighter contracts? |
| **Token usage** | Total tokens for DoR phase | DoR phase cost comparison |

---

### Telemetry Aggregation (Post-Experiment)

**After Day 5, run the aggregation script:**

```bash
node scripts/aggregate-experiment-telemetry.js \
  --experiment-id "exp-phase4-sonnet-vs-opus-20260419" \
  --output workspace/experiment-telemetry-phase4.json
```

This script:
1. Scans all artefacts in `artefacts/2026-04-20-skills-platform-phase4-sonnet/` and `artefacts/2026-04-20-skills-platform-phase4-opus/` for capture blocks
2. Extracts fields: `model_label`, `turn_count`, `constraints_inferred_count`, `fidelity_self_report` (avg per dimension), `skill_name`, `run_timestamp`
3. Groups by `model_label` and `skill_name`
4. Computes aggregates:
   - Average turns per skill per model
   - Average constraints inferred per skill per model
   - Average fidelity self-report per dimension per model
   - Total artefacts processed per model
5. Outputs JSON: `workspace/experiment-telemetry-phase4.json` with structured data for post-experiment analysis

**Telemetry JSON schema:**
```json
{
  "experiment_id": "exp-phase4-sonnet-vs-opus-20260419",
  "runs": [
    {
      "model_label": "claude-sonnet-4-6",
      "cost_tier": "fast",
      "skills": {
        "discovery": {
          "artefact_count": 1,
          "avg_turn_count": 12,
          "avg_constraints_inferred": 3,
          "avg_fidelity_self_report": {
            "ac_coverage": 4.5,
            "scope_adherence": 4.2,
            "context_utilisation": 4.0
          },
          "files_referenced_total": 5
        },
        "definition": { /* ... */ }
      }
    },
    {
      "model_label": "claude-opus-4-6",
      "cost_tier": "quality",
      "skills": { /* ... */ }
    }
  ],
  "comparison": {
    "sonnet_vs_opus": {
      "turn_count_ratio": 1.15,
      "constraints_inferred_ratio": 0.92,
      "fidelity_self_report_gap": { "ac_coverage": -0.3, "scope_adherence": 0.1, "context_utilisation": 0.2 }
    }
  }
}
```

---

### Track 5 — Summary Cost-Benefit Analysis

**Data to compute post-experiment (from aggregated telemetry):**

| Metric | Formula | Interpretation |
|--------|---------|-----------------|
| **Turns per skill** | `avg_turn_count[sonnet]` vs `avg_turn_count[opus]` | Which model is more interactive? (Higher = more questions asked) |
| **Constraints inferred** | `avg_constraints_inferred[sonnet]` vs `avg_constraints_inferred[opus]` | Which model asks more clarifying questions vs assuming? |
| **Fidelity self-report avg** | Mean of `fidelity_self_report[ac_coverage, scope_adherence, context_utilisation]` per model | Which model reports higher confidence in output quality? |
| **Pragmatism index** | (explicit assumptions + constraints inferred) / turn count | Which model clarifies more vs asserts? |
| **Context efficiency** | Total tokens per model (from telemetry context budget or external token counter) | Which model is more efficient? |
| **Cost-benefit ratio** | (tokens_opus / tokens_sonnet) × (fidelity_opus / fidelity_sonnet) | Which model offers better value for Phase 4's complexity? |

---

## Run Sequence

**Pre-experiment (2026-04-19 evening):**
1. Create experiment context files in `contexts/`:
   - `contexts/experiment-sonnet-phase4.yml` with `model_label: "claude-sonnet-4-6"`
   - `contexts/experiment-opus-phase4.yml` with `model_label: "claude-opus-4-6"`
2. Both contexts set: `instrumentation.enabled: true` and shared `experiment_id: "exp-phase4-sonnet-vs-opus-20260419"`
3. Verify context structure: `cat contexts/experiment-sonnet-phase4.yml | grep instrumentation` (should show enabled + model_label)

**Day 1 (2026-04-20) — Discovery Track:**
1. Activate Sonnet context: `cp contexts/experiment-sonnet-phase4.yml .github/context.yml`
2. Run `/discovery` skill on Phase 4 ref doc input
   - Output: `artefacts/2026-04-20-skills-platform-phase4-sonnet/discovery.md`
   - Capture block auto-appended with telemetry fields
3. Deactivate Sonnet context; activate Opus context: `cp contexts/experiment-opus-phase4.yml .github/context.yml`
4. Run `/discovery` skill on identical Phase 4 ref doc input
   - Output: `artefacts/2026-04-20-skills-platform-phase4-opus/discovery.md`
   - Capture block auto-appended with telemetry fields
5. Compare discovery outputs manually; note structural differences

**Day 2 (2026-04-21) — Definition Track:**
1. Activate Sonnet context; run `/definition` on Sonnet discovery
   - Output: `artefacts/2026-04-20-skills-platform-phase4-sonnet/stories/` + `epics/`
   - Capture blocks appended to each story file
2. Activate Opus context; run `/definition` on Opus discovery
   - Output: `artefacts/2026-04-20-skills-platform-phase4-opus/stories/` + `epics/`
   - Capture blocks appended to each story file

**Day 3 (2026-04-22) — Test Plan Track:**
1. Run `/test-plan` with Sonnet context on Sonnet story set
2. Run `/test-plan` with Opus context on Opus story set

**Day 4 (2026-04-23) — DoR Track:**
1. Run `/definition-of-ready` with Sonnet context on Sonnet story set
2. Run `/definition-of-ready` with Opus context on Opus story set

**Day 5 (2026-04-24) — Telemetry Aggregation & Analysis:**
1. Run aggregation script:
   ```bash
   node scripts/aggregate-experiment-telemetry.js \
     --experiment-id "exp-phase4-sonnet-vs-opus-20260419" \
     --output workspace/experiment-telemetry-phase4.json
   ```
2. Parse output JSON; compute cost-benefit metrics
3. Write summary: `workspace/experiment-summary-sonnet-vs-opus-phase4.md`
4. Decision: which model run to proceed from

**Parallel artefact commitment:**
- Each model's artefacts committed to separate feature branches: `exp/sonnet-phase4-discovery`, `exp/opus-phase4-discovery`, etc.
- Merge both branches to master at the end of the experiment run (or to a dedicated experiment summary branch).
- Do NOT merge into the active Phase 4 development branch until the experiment is analysed and a decision is made on which run to proceed from.

---

## Decision Framework

**After experiment closes (2026-04-24), answer:**

1. **Structural compliance:** Which model followed the skill's prescribed method more faithfully? Are the violations material (affect output quality) or cosmetic (violate form, not substance)?

2. **Scope clarity:** Which model produced more discoverable assumptions and fewer hidden constraints?

3. **Cost sensitivity:** Is Sonnet 4.6's 30–40% cost advantage worth the differences in depth? Or is Phase 4's architectural complexity high enough that Opus 4.6's reasoning capacity is necessary?

4. **Token budget:** Does the experiment reveal a C14 compaction risk for the model chosen? If so, what session-scoping strategy should be applied?

5. **Forward decision:** Will Phase 4 outer loop proceed from the Sonnet run, the Opus run, or a synthesis of both?

---

## Known Constraints and Unknowns

**Constraints:**
- Both runs must use identical copilot-instructions.md (April 19, 2026 version)
- Both runs must read identical input artefacts (Phase 4 ref doc, Phase 3 closure state)
- Instrumentation must be enabled via context.yml for both runs (different `model_label` values)
- Capture blocks are auto-appended to all phase output artefacts (discovery.md, stories, test plans)
- Telemetry aggregation script must be available at experiment close (Day 5) — verify `scripts/aggregate-experiment-telemetry.js` exists before starting
- Experiment must not consume more than 25% of the operator's focus time; runs can be staggered

**Unknowns:**
- Will model differences in discovery propagate through definition → test-plan → DoR, or flatten out?
- Will the enforcement mechanism choice (CLI vs MCP vs orchestration framework) influence model recommendations differently?
- Will context budget pressure (if C14 compaction occurs) affect model decision-making?
- Will capture block telemetry fields provide sufficient signal for cost-benefit analysis, or will external token counters be needed?

---

## Experiment Success Criteria

The experiment is valuable (worth the cost in operator time and token budget) if:

1. **Hypothesis directionally confirmed:** H1–H4 show measurable signal, even if not statistically significant.
2. **Cost-benefit insight produced:** The operator can articulate a clear reason to choose one model over the other for Phase 4, backed by evidence.
3. **Risk factors surfaced:** If there are token budget or context efficiency risks, the experiment identifies them before they break Phase 4 delivery.
4. **Replicable methodology:** The experiment design can be repeated for Phase 5 or other complex outer loops to build a model-performance corpus.

---

## Artefact Naming Convention

**Artefact directories:**
- Sonnet 4.6 artefacts: `artefacts/2026-04-20-skills-platform-phase4-sonnet/`
- Opus 4.6 artefacts: `artefacts/2026-04-20-skills-platform-phase4-opus/`

**Telemetry and analysis:**
- Capture blocks appended to each artefact (discovery.md, stories/*.md, test-plans/*.md)
- Raw telemetry JSON extracted from capture blocks: `workspace/experiment-telemetry-phase4.json` (post-Day 5)
- Experiment summary: `workspace/experiment-summary-sonnet-vs-opus-phase4.md` (written 2026-04-24)
- Context files: `contexts/experiment-sonnet-phase4.yml`, `contexts/experiment-opus-phase4.yml`

**Branching strategy:**
- Sonnet branch: `exp/sonnet-phase4-discovery` → `exp/sonnet-phase4-definition` → `exp/sonnet-phase4-testplan` → `exp/sonnet-phase4-dor`
- Opus branch: `exp/opus-phase4-discovery` → `exp/opus-phase4-definition` → `exp/opus-phase4-testplan` → `exp/opus-phase4-dor`
- Both branches created fresh for the experiment; merged to master after summary is written

---

## Next Action

Operator decision: Proceed with experiment as designed, or adjust hypothesis / measurement points first?

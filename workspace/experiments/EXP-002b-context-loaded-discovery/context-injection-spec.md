# EXP-002b — Context Injection Specification

**Experiment:** EXP-002b-context-loaded-discovery
**Scenario:** Scenario 2 — Context-loaded skill eval
**Purpose:** Defines the exact file loading order, included files, and system prompt template for the context-injected evaluation. This spec is what the sweep harness reads to build the Scenario 2 system prompt.

---

## Rationale for context injection order

Earlier context is more salient — it establishes the model's frame before the operator input arrives. The injection order mirrors how a senior engineer would orient before a discovery session:

1. **Constraints first** — what are the non-negotiable limits?
2. **Product constraints** — what has already been decided?
3. **Purpose** — what is this platform for and who uses it?
4. **Implementation** — what's the tech stack and existing structure?

The skill prompt arrives last, after the model has the full organisational frame.

---

## Context injection order

| Order | File | Purpose in context |
|-------|------|--------------------|
| 1 | `.github/architecture-guardrails.md` | Non-negotiable architectural constraints, active ADRs, guardrails that constrain all features |
| 2 | `product/constraints.md` | Hard product constraints (must not be violated by any design decision) |
| 3 | `product/mission.md` | What the product does, who uses it, primary personas |
| 4 | `product/tech-stack.md` | Current technology and structural decisions |

**Not included in Scenario 2 injection:**
- `product/roadmap.md` — strategic direction, not a constraint
- `product/decisions.md` — historical decisions, not current guardrails
- `.github/pipeline-state.json` — live state, not relevant to discovery inputs
- `workspace/` files — internal experiment state

---

## System prompt template — Pass 1 (standard Scenario 2)

The system prompt is constructed by concatenating the context files in order, separated by clear section boundaries, then appending the standard skill prompt.

```
You are running the /discovery skill for a governed software delivery pipeline.

Before receiving the operator input, read the following organisational context. This context is authoritative and takes precedence over any assumptions you might otherwise make about the operating domain.

---
## Architecture Guardrails
{CONTENTS OF .github/architecture-guardrails.md}

---
## Product Constraints
{CONTENTS OF product/constraints.md}

---
## Product Mission
{CONTENTS OF product/mission.md}

---
## Technology Stack
{CONTENTS OF product/tech-stack.md}

---

You have now read the full organisational context. Proceed with the /discovery skill.

{STANDARD /DISCOVERY SKILL PROMPT — contents of .github/skills/discovery/SKILL.md}
```

**Harness implementation note:** The `{CONTENTS OF ...}` placeholders are replaced with the actual file contents at sweep runtime. The file contents are read from disk at the time the sweep runs — not cached. This ensures the context injection always reflects the current state of the repository.

---

## System prompt template — Pass 2 (explicit regulatory injection)

Pass 2 adds an explicit regulatory framing block between the context files and the skill prompt. Everything else is identical to Pass 1.

```
You are running the /discovery skill for a governed software delivery pipeline.

Before receiving the operator input, read the following organisational context. This context is authoritative and takes precedence over any assumptions you might otherwise make about the operating domain.

---
## Architecture Guardrails
{CONTENTS OF .github/architecture-guardrails.md}

---
## Product Constraints
{CONTENTS OF product/constraints.md}

---
## Product Mission
{CONTENTS OF product/mission.md}

---
## Technology Stack
{CONTENTS OF product/tech-stack.md}

---
## Regulatory and Compliance Framing

This platform serves a regulated financial enterprise subject to prudential banking regulation and anti-money-laundering requirements. All discovery artefacts must explicitly surface:
- Data residency requirements (where customer and transactional data may be stored and processed)
- Retention policy constraints (including statutory retention periods where applicable)
- Access control boundaries where the problem domain involves customer or financial data
- Applicable regulatory filing obligations (e.g. suspicious activity reporting, transaction reporting thresholds)

Where the input domain involves financial transactions, customer data, or compliance obligations, name the applicable regulatory regime before writing the problem statement. Do not proceed to MVP scoping until regulatory context is surfaced.

---

You have now read the full organisational context. Proceed with the /discovery skill.

{STANDARD /DISCOVERY SKILL PROMPT — contents of .github/skills/discovery/SKILL.md}
```

---

## Harness implementation requirements

When `run-model-sweep.js` runs an EXP-002b cell, it must:

1. Read `manifest.md` from the experiment directory to determine the injection order
2. Read each context file from disk in the specified order
3. Construct the system prompt by concatenating the template above with actual file contents substituted
4. Send the constructed system prompt as the `system` parameter in the API call (not as a user message)
5. Send the corpus case input (T1–T5) as the first `user` message
6. Record the full system prompt construction (file names + byte counts, NOT full contents) in the run output metadata block

**Important:** The context file contents must NOT be written to the run output file verbatim (they may contain organisational context that is internal). Record only the file names, byte counts, and a SHA-256 hash of each file's content for reproducibility verification.

---

## Data classification check — runtime gate

Before constructing the system prompt, the harness must check the `data_classification_check` block in `manifest.md`:

```
if (manifest.data_classification_check.approved_for_external_api !== true) {
  throw new Error(
    `EXP-002b: data_classification_check.approved_for_external_api is not true. ` +
    `Run with a local model only. See local-model-scaffolding/provider-spec.md`
  );
}
```

This guard prevents context files with `approved_for_external_api: false` from being sent to cloud APIs.

---

## Delta measurement protocol

For each scored cell in EXP-002b, the run output file must include a `baseline_delta` section:

```json
{
  "experiment_id": "EXP-002b-context-loaded-discovery",
  "pass": 1,
  "model": "claude-sonnet-4-6",
  "case": "T5",
  "weighted_total": 0.0,
  "baseline_experiment": "EXP-001-discovery-phase4-5",
  "baseline_score": 0.49,
  "delta": 0.0,
  "t5_proactivity_score": 0,
  "baseline_proactivity_score": 0,
  "proactivity_delta": 0,
  "gap_diagnosis": "pending — see scorecard.md"
}
```

The `gap_diagnosis` field is populated in the scorecard, not the individual run file. Valid values: `context-gap`, `model-gap`, `regulatory-injection-fix`, `no-gap` (if T5 already passes without Scenario 2 context — unlikely but possible).

# Proposed Skill Update — /token-optimization: Add measurement-backed routing field

**Source feature:** `2026-05-10-model-evaluation-capability`
**Produced by:** Model evaluation capability discovery — 2026-05-10
**Status:** Awaiting operator review — do not apply directly to SKILL.md files
**Governed path:** Operator raises a PR against the fleet repo; platform team reviews and merges; consuming repos receive on next upstream sync.

---

## Context

The `/token-optimization` SKILL.md defines a model routing policy for the skill library. It assigns pipeline stages to model tiers (deep reasoning, standard, mechanical edits) without any measurement backing. The routing decisions are convention-based and were set during initial authoring — no sweep has been run to validate whether they reflect actual model performance differences on real skill tasks.

The model evaluation capability build (EXP-001 pilot + Layer 2 script) will produce the first measurement-backed evidence for routing decisions. This proposal defines how to integrate that evidence into the routing policy so future consumers can see which tiers are empirically validated vs convention-based.

---

## Proposal — Add `measurement_backed` field to each routing tier entry

**Target file:** `.github/skills/token-optimization/SKILL.md`

**Change:** In the routing table or routing policy section of token-optimization, add a `measurement_backed` metadata block per skill stage. This block records whether the assigned tier has been empirically validated by a sweep, and if so, which experiment provides the evidence.

### Current structure (representative — check actual SKILL.md for exact format)

The current SKILL.md defines tiers like:

```
| Stage | Model tier | Rationale |
|-------|-----------|-----------|
| discovery | deep-reasoning | Requires open-ended problem framing |
| definition | standard | Structured decomposition |
| definition-of-ready | deep-reasoning | Gate correctness requires careful reasoning |
| mechanical edits | mechanical | Low cognitive load |
```

### Proposed structure after change

```
| Stage | Skill | Model tier | Rationale | measurement_backed | experiment_id |
|-------|-------|-----------|-----------|-------------------|---------------|
| discovery | /discovery | standard | Generative artefact — measured via EVAL.md | false | — |
| definition-of-ready | /definition-of-ready | deep-reasoning | Gate correctness — measured via EVAL.md | false | — |
| ... | | | | false | — |
```

**Initial state:** All entries set to `measurement_backed: false` (honest reflection of current state — no sweep has been run).

**Path to true:** After a sweep run produces consistent results across ≥ 3 corpus cases for a skill, update the entry:
- `measurement_backed: true`
- `experiment_id: EXP-XXX-[description]`

This makes the routing policy self-documenting: a consumer reading the SKILL.md can see at a glance which decisions are empirically grounded and which are still convention-based.

---

## Proposal — Add sweep cadence guidance

**Target file:** `.github/skills/token-optimization/SKILL.md`

**Change:** Add a section documenting when to re-run a sweep to re-validate routing decisions. This prevents the routing policy from going stale after model releases.

### Proposed text to add

```markdown
## Routing policy freshness

Each routing tier assignment should be re-validated when any of these conditions occur:

| Condition | Action |
|-----------|--------|
| New model release (e.g. Sonnet 4.7, Opus 5, Haiku 4) | Run sweep for all affected tiers |
| A skill's SKILL.md changes substantially | Re-run sweep for that skill only |
| Cost/performance ratio changes (new pricing) | Re-run sweep with cost-adjusted scoring |
| Quarterly hygiene | Full fleet sweep |

A routing tier with `measurement_backed: false` is a convention. A tier with `measurement_backed: true`
and a cited experiment_id is evidence. Decisions should move from convention toward evidence as
sweep capacity allows.

To run a sweep: see `.github/skills/model-sweep/SKILL.md` for the operator runbook.
```

---

## Why this matters now

The Copilot AI Credits billing transition (expected June 2026) will change cost accounting for fleet-level Copilot usage. Teams managing 50+ squads need measurement-backed justification for model routing decisions — "we chose deep-reasoning for discovery because it feels right" is not defensible when billing is by token. Measurement-backed routing decisions, with cited experiment IDs, provide that justification.

The `/model-sweep` skill and `scripts/run-model-sweep.js` are the tooling. This proposal is the documentation change that makes the evidence visible in the routing policy itself.

---

## Implementation notes

- **Do not change routing tiers** in this proposal. The tier assignments may or may not change after the first sweep — the sweep decides, not this proposal.
- **Do not add `measurement_backed: true`** to any tier until a sweep has been run and the results support it.
- The `experiment_id` field value should match the directory name in `workspace/experiments/` and the `experiment_id` key in the manifest.
- This change is presentation-only (adds a column and a section). It does not change any routing logic. Any model selecting a routing tier reads the same tier label — the `measurement_backed` field is metadata for human consumers only.

---

## Estimated impact

**Operator effort:** 30 minutes to update the SKILL.md table and add the freshness section.
**Downstream effect:** Future routing discussions are grounded ("the sweep says Sonnet 4.6 scores 0.82 on /discovery vs Opus 4.6's 0.80 at 5× cost — Sonnet wins") rather than conventional.
**Risk:** None — this is a documentation change. No routing logic changes.

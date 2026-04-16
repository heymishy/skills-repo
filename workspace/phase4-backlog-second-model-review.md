# Phase 4 Backlog: Second-model review — formal maker/checker pattern for pipeline governance checkpoints

**Status:** NOT STARTED — Phase 4
**Owner:** Hamish
**Identified by:** Operator review session 2026-04-16 — manual maker/checker pattern observed during Phase 3 validation run
**Related:** p3.1e (agent-behaviour-observability), workspace/phase4-backlog-governance-integrity-test-scripts.md (when created)

---

## Problem statement

The platform's governance chain is entirely single-model. Every artefact the coding agent produces is reviewed by the same agent running a different skill (`/review`, `/verify-completion`). This is structurally the same as self-attestation — the maker and checker share the same model, the same context, and the same failure modes.

During Phase 3 validation (2026-04-16), the operator manually ran a maker/checker pattern by pasting agent output to a second model (Claude) for independent review before approving PRs, story artefacts, and governance decisions. This pattern caught several issues that the primary agent did not surface. The pattern is sound but entirely manual and operator-dependent — if the operator is not running the second check, there is no checker.

This story registers the formal second-model review capability as a Phase 4 design target.

---

## Candidate implementations

### Option A — `/second-opinion` skill

A new skill explicitly invoked at defined pipeline checkpoints (before DoR sign-off, before merge approval). The skill sends the artefact and a structured review prompt to a second model via API call. Returns: `agree` / `disagree` / `concerns-noted`. The operator sees both opinions before deciding.

**Effort:** Medium

**Tradeoff:** Requires an API integration and a defined prompt contract per checkpoint. Does not run automatically — still requires operator invocation. Formalises the manual copy-paste pattern without changing the pipeline structure.

---

### Option B — Second-model flag on existing gates

`/review` and `/verify-completion` gain an optional `--second-model` flag that triggers a second API call with a different model or sampling temperature, comparing outputs for divergence. The flag can be set as default for regulated stories in `context.yml`.

**Effort:** Medium

**Tradeoff:** Divergence detection is only as good as the comparison logic — two models agreeing on a wrong answer is not caught. Adds complexity to two widely-used skills without structural enforcement.

---

### Option C — Formal checker role in pipeline state

The pipeline explicitly tracks two roles per story: maker (coding agent) and checker (second model or designated human). DoR cannot reach `signed-off` status without a `checkerVerdict` field populated in `pipeline-state.json`. The checker verdict is an evidence field, schema-validated, and gate-enforced.

**Effort:** High

**Tradeoff:** Requires schema changes, gate changes, and a defined checker invocation mechanism. Highest governance value — the check is structural, not advisory. Closest to a genuine maker/checker separation.

---

## Recommended Phase 4 path

Option C is the target state for regulated enterprise adoption. Option A is the pragmatic starting point — it can be implemented without schema or gate changes and gives operators a formal invocation pattern rather than a manual copy-paste workflow.

Sequence: **A first** (formalise the pattern), then **C** (make it structural).

---

## Relationship to other Phase 4 backlog items

- **Complements `workspace/phase4-backlog-governance-integrity-test-scripts.md`** (test script independence) — both address the single-model trust problem from different angles: test script independence addresses whether the governance checks themselves can be trusted; second-model review addresses whether the artefacts being checked can be trusted.
- **Complements p3.1e agent-behaviour-observability** — observability detects when agents go wrong after the fact; second-model review catches it before merge.
- **Addresses the T3M1 (Tier 3, Meta-metric 1 — independent non-engineer audit) Q7 gap** (agent independence evidence) — a checker verdict from a structurally independent model is the closest the platform can get to evidenced agent independence without a human reviewer on every story.

---
evidence: ["workspace/experiments/EXP-002b/scorecard.md", "workspace/experiments/EXP-002b-context-loaded-discovery/scorecard.md"]
proposed_diff:
  before: "These don't need to be precise metrics yet - that's /benefit-metric's job."
  after: "Three changes: (1) constraint labelling rule in S6, (2) observability minimum rule in S7, (3) /clarify decision gate after S8. See proposal body for full diff."
confidence: "medium"
anti_overfitting_gate: "passed — proposal adds new checks (D5/D6/clarify-trigger), does not remove or weaken any existing check"
status: "pending_review"
created_at: "2026-05-13"
skill_slug: "discovery"
---

# Proposed update — `/discovery` SKILL.md: constraint surfacing, success observability, /clarify trigger

**Proposal ID:** PROP-discovery-002b
**Status:** proposed
**Evidence base:** EXP-001 (baseline), EXP-002a (cross-provider), EXP-002b (context-loaded)
**Failure mode:** T5 0/9 across all experiments and models — SKILL.md instruction gaps identified by judge
**Judge finding (verbatim, EXP-002b Opus trial-1):** "missing explicit /clarify recommendation, no data residency/retention questions framed as direct assumptions, and no success observability"
**Affected dimensions:** D5 (assumption quality), D6 (success observability), D2 (proactivity/clarify trigger)
**Proposed by:** EXP-002b experiment analysis, 2026-05-13

---

## Context

T5 is the hardest corpus case: a regulated enterprise scenario where critical constraints (data residency, retention, access control, tooling duplication) are present but unconfirmed. The correct behaviour is:
- Surface unconfirmed constraints as explicit labelled assumptions (not just mention them in prose)
- Provide success indicators with measurable baselines, not vague directional signals
- Recommend `/clarify` explicitly when multiple unconfirmed assumptions exist

The current SKILL.md asks for these things loosely in Sections 6, 7, and 8 but does not give the model a clear instruction format. The judge consistently scores D5=0.2–0.3, D6=0, clarify-trigger=absent. Context loading (EXP-002b) did not fix this — the failure is a SKILL.md instruction gap, not a context gap.

**Critical side-finding from EXP-002b:** Context loading (135KB) degrades T2 and T4 (clarification-heavy cases) because the model stops asking for missing input when it has a large context to draw from. Context loading should NOT be added to the production skill. The fix must be instruction-side only.

---

## Change 1 — Constraint surfacing (fixes D5/D7)

**Location:** Section 6 "Assumptions and risks" — add a writing rule **before** the existing question.

**Existing text (discovery/SKILL.md, ~line 224):**
```markdown
### Section 6 — Assumptions and risks

Ask:
> **What are we assuming is true that we haven't validated yet?**
> And what could make this not worth building?
>
> Reply: list assumptions and risks
```

**Proposed text (add writing rule block before the Ask):**
```markdown
### Section 6 — Assumptions and risks

**Writing rule — constraint labelling (applies before writing this section and the Constraints section):**
Before writing any section that references constraints, compliance requirements, data handling, integration dependencies, or regulatory obligations, list every constraint you cannot confirm from the input as an explicit assumption using this exact format:

> [ASSUMPTION] [constraint statement] — unconfirmed, requires /clarify before scope is locked.

Examples:
> [ASSUMPTION] Data must remain within EU jurisdiction — unconfirmed, requires /clarify before scope is locked.
> [ASSUMPTION] Existing tooling (Jira) cannot be replaced — unconfirmed, requires /clarify before scope is locked.

Do not bury unconfirmed constraints in prose. Every unconfirmed constraint must have its own `[ASSUMPTION]` line. Confirmed constraints (from `product/constraints.md`, reference materials, or explicit operator statement this session) do not need the tag.

Ask:
> **What are we assuming is true that we haven't validated yet?**
> And what could make this not worth building?
>
> Reply: list assumptions and risks
```

**Rationale:** The judge repeatedly flags that unconfirmed enterprise constraints appear as prose observations rather than explicit assumptions. The `[ASSUMPTION]` tag is machine-readable for the judge, operator-visible at a glance, and directly feeds the /clarify trigger in Change 3. Without the format rule, models produce variable-quality assumption lists that the judge correctly marks down.

---

## Change 2 — Success observability (fixes D6)

**Location:** Section 7 "Directional success indicators" — strengthen the writing instruction.

**Existing text (discovery/SKILL.md, ~line 233):**
```markdown
### Section 7 - Directional success indicators

Ask:
> **What would you see, hear, or measure that would tell you this worked?**
> These don't need to be precise metrics yet - that's /benefit-metric's job.
> Directional signals are fine here.
>
> Reply: describe what success looks like
```

**Proposed text (add writing rule before the Ask):**
```markdown
### Section 7 — Directional success indicators

**Writing rule — observability minimum (applies when writing each success indicator):**
For each success indicator, name:
1. A **baseline value** — where things stand today (or flag as `[UNKNOWN BASELINE]` if genuinely unmeasurable at this stage)
2. A **target value** — what good looks like after this initiative
3. **How it will be measured** — the data source, tool, or mechanism

Do not write vague directional signals like "improved adoption" or "reduced friction". If you cannot specify a baseline, write `[UNKNOWN BASELINE]` explicitly — not a directional phrase. This signals to /benefit-metric where measurement work is needed.

Example (acceptable):
> **Onboarding time-to-first-artefact:** Baseline: ~4 hours (operator-estimated). Target: ≤30 minutes. Measured via: session transcript timing script.

Example (not acceptable):
> Faster onboarding for new teams.

The "these don't need to be precise metrics" guidance applies to the numeric precision of the target — not to whether a baseline and measurement method are named.

Ask:
> **What would you see, hear, or measure that would tell you this worked?**
> These don't need to be numerically precise metrics yet — that's /benefit-metric's job.
> But name a baseline, a target direction, and how you'd measure it.
>
> Reply: describe what success looks like
```

**Rationale:** D6=0.000 across all T5 trials and all experiments. The judge notes the current skill prompt explicitly says "directional signals are fine" and models interpret this as permission to omit baselines entirely. The fix preserves the intent (no hard numeric commitment) while requiring structure that makes /benefit-metric's job tractable. The `[UNKNOWN BASELINE]` tag is explicit rather than a vague hedge.

---

## Change 3 — /clarify trigger (fixes T5 root cause)

**Location:** After Section 8 "Constraints" — add a new decision gate step.

**Existing text (discovery/SKILL.md, ~line 247):**
```markdown
### Section 8 — Constraints

Ask:
> **Any constraints I should know about?**
> (Time, budget, regulatory, technical dependencies, team capability)
>
> Reply: list constraints - or type "none identified"

---

## Step 1 — Establish attribution
```

**Proposed text (insert new step between Section 8 and Step 1):**
```markdown
### Section 8 — Constraints

Ask:
> **Any constraints I should know about?**
> (Time, budget, regulatory, technical dependencies, team capability)
>
> Reply: list constraints - or type "none identified"

---

### Section 8a — /clarify decision gate (mandatory check)

After completing Sections 6, 7, and 8, count every line in the draft artefact that begins with `[ASSUMPTION]`.

**If two or more `[ASSUMPTION]` lines exist:**

End the artefact with an explicit /clarify recommendation block:

```
---

## /clarify recommendation

This discovery contains [N] unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [list each [ASSUMPTION] item verbatim from the artefact]

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification.
```

Do not substitute a softer phrase like "consider running /clarify" or bury the recommendation in a note. The block must appear as a named section at the end of the artefact and must list each unresolved assumption by name.

**If fewer than two `[ASSUMPTION]` lines exist:**

No /clarify block is needed. Proceed to Step 1 (attribution).

---

## Step 1 — Establish attribution
```

**Rationale:** The T5 root cause across all experiments is not model capability — it is the absence of an explicit trigger. When given a concrete rule ("count [ASSUMPTION] lines, if ≥2 emit the block"), both Sonnet and Opus follow it reliably. The two-assumption threshold avoids false positives on simple features while catching regulated/enterprise scenarios like T5 which typically have 4–6 unconfirmed constraints. The verbatim list requirement prevents the model from summarising or eliding the specific constraints that need resolution.

---

## What this does NOT change

- The conversational flow (still one section at a time, interactive)
- The eval mode behaviour (the same writing rules apply in eval mode)
- The product context pre-population logic (Step 0)
- The EA registry blast-radius integration
- The /benefit-metric handoff or artefact template structure

---

## Eval corpus impact prediction

| Case | Current avg (best model) | Predicted after this change | Confidence |
|------|--------------------------|----------------------------|------------|
| T5 | 0.519 (Opus) | 0.720–0.800 | Medium — D5/D6/clarify-trigger were the only failing dimensions |
| T1 | 0.703 (Opus, passes) | No regression expected | High |
| T2 | 0.570 (Opus, context-loaded) | Slight improvement (D5 benefit) | Low — T2 clarify case, watch for over-triggering |
| T4 | 0.370 (Opus, context-loaded) | No material change expected | Medium |
| T3 | Not yet scored | Unknown | N/A |

**Risk:** T2 is an intentionally ambiguous input where `/clarify` is the correct response (N/A pass). If the new [ASSUMPTION] rule causes the model to emit more assumptions in T2, the threshold trigger might over-fire and produce a /clarify block even for straightforward cases. Mitigation: the two-assumption threshold should absorb this; T2 inputs by design have few stated constraints, so the count should stay below two.

**Validation plan:** Run EXP-003 against the updated SKILL.md, T5 primary target, T1/T2/T4 as regression checks, 3 trials each model.

---

## Implementation note

This change modifies `.github/skills/discovery/SKILL.md`. Per the artefact-first rule in `copilot-instructions.md`, this requires a story artefact (discovery → benefit-metric → story → test-plan → DoR) before the change can be merged to master. The story should:

1. Add the three writing rule blocks exactly as specified above
2. Update the discovery EVAL.md scoring rubric to add explicit judge checks for `[ASSUMPTION]` tag presence (D5), `[UNKNOWN BASELINE]` or named baseline in success indicators (D6), and `/clarify recommendation` section presence when ≥2 assumptions exist (D2-clarify)
3. Run the EXP-003 validation sweep as the acceptance test

**Short-track eligible:** The change is bounded, has no cross-skill dependencies, and has a clear eval corpus test. Use `/test-plan → /definition-of-ready → coding agent` track.

---

## Platform-wide implication — context injection risk by skill tier

**Finding:** Bulk context injection (>50KB) suppresses clarification and gap-detection behaviour across all skills that depend on question-asking. The mechanism is model-level: when the context window is saturated with authoritative reference content, the model shifts from information-gathering mode to synthesis mode — it stops asking questions because it believes it has enough to proceed.

This finding is not discovery-specific. It applies to any skill whose correct behaviour depends on detecting what is missing from the operator's input.

| Risk tier | Skills | Reason |
|-----------|--------|--------|
| **HIGH — never bulk-inject** | `/clarify`, `/definition` | Entire skill value is asking questions or probing scope boundaries; bulk context suppresses both |
| **MEDIUM — inject with caution** | `/benefit-metric`, `/definition-of-ready` | Need to probe whether baselines are measurable / ACs are complete; context causes the model to assume completeness |
| **LOW — context is additive** | `/trace`, `/test-plan`, `/implementation-plan`, `/branch-setup` | Analytical or mechanical; more context is genuinely useful, no clarification-asking to suppress |

**Production mitigation:** Skills should extract and synthesise relevant excerpts from reference files rather than passing raw file contents into the prompt. The 96KB `architecture-guardrails.md` must never be injected in full — extract the relevant constraint sections only. Discovery's Step 0 production behaviour (extracts and presents excerpts) is the correct pattern; it is more resilient than the EXP-002b harness approach of raw file injection.

**Evidence:** EXP-002b T2/T4 — context loading (135KB) turned passing clarification behaviour (N/A ✅ in EXP-001 baseline) into 0.000 NON-COMPLIANT across all models and both passes.

---

## Pre-check required before EXP-003 runs — /definition context read

**Finding from SKILL.md inspection (2026-05-13):** `/definition` Step 0 explicitly reads `architecture-guardrails.md` at two points:
- Line 63: `Read .github/architecture-guardrails.md if it exists.` (constraint extraction step)
- Line 418: reads and parses the full file to seed the `guardrails[]` array in pipeline state

`architecture-guardrails.md` is currently 96KB. In the EXP-003 Config B configuration, `/definition` runs on `claude-opus-4-7` — the same model that showed T2/T4 clarification suppression under 135KB context injection in EXP-002b.

**Risk:** If the EXP-003 harness injects `architecture-guardrails.md` in full before the `/definition` skill prompt (as the EXP-002b harness did for discovery), Config B `/definition` results may be degraded for the same reason T5 degraded — the model sees the full constraint library and stops probing operator scope intent.

**Pre-check actions before EXP-003:**
1. Confirm whether the EXP-003 harness injects `architecture-guardrails.md` as a context file, or whether `/definition` reads it lazily as part of the skill's own Step 0 execution
2. If injected as a context file: extract only the relevant guardrails sections (ADR entries + active constraints) rather than the raw full file
3. If read lazily within skill execution: this is production-equivalent behaviour and does not need mitigation
4. Add a T2/T4 regression check for `/definition` in EXP-003 design if context loading for that skill is ever proposed beyond the current lazy-read pattern

**Validation plan addition:** EXP-003 should include a `/definition` context-read audit step as a pre-run check item.

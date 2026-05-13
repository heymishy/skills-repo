# EXP-001-discovery-phase4-5

## Purpose

Comparative model evaluation of the `/discovery` skill across two models (claude-sonnet-4-6 and claude-opus-4-6) using a structured 5-case corpus. Measures whether each model correctly handles good input (T1), ambiguous input (T2), solution-framed input (T3), adversarially thin input (T4), and deceptively complex input with hidden enterprise constraints (T5).

## Hypothesis

claude-opus-4-6 will produce higher-quality discovery artefacts on complex and ambiguous inputs (T2, T3, T5) while both models will perform similarly on structured inputs (T1) and thin adversarial inputs (T4).

## Experiment configuration

| Field | Value |
|-------|-------|
| experiment_id | EXP-001-discovery-phase4-5 |
| skill | /discovery |
| models | claude-sonnet-4-6, claude-opus-4-6 |
| corpus cases | T1, T2, T3, T4, T5 |
| judge model | claude-sonnet-4-6 (locked per EVAL.md) |
| EVAL.md | `.github/skills/discovery/EVAL.md` (on `feat/model-evaluation-capability`) |
| pass threshold | weighted score ≥ 0.70 |

## Corpus cases

| ID | Name | Input type | Expected behaviour |
|----|------|-----------|-------------------|
| T1 | Green path | Well-structured, rich domain input (payment retry) | Produces full artefact in one pass |
| T2 | Ambiguous cross-cutting | Vague input ("improve the onboarding experience for new business customers") | Asks clarifying question before any artefact |
| T3 | Solution masquerades as problem | Solution-framed input (AML threshold alerts) | Reframes to problem, asks load-bearing Qs before writing |
| T4 | Scope too wide | Adversarially thin input ("Make the API faster") | Asks clarifying Qs, produces no artefact |
| T5 | Hidden constraints | Deceptively simple input ("build a note-taking app") with hidden enterprise constraints | No feature list; surfaces data residency, retention, access control before or during artefact |

## Run history

| Run | Status | Env | Notes |
|-----|--------|-----|-------|
| run-1 | CONFOUNDED | This repo (skills-repo with product/ context files present) | `product/mission.md` caused domain bleed — T2 interpreted "business customers" as skills-platform users. All 10 files marked CONFOUNDED. |
| run-2 | COMPLETE | Fresh clone — no `product/` context files | SESSION START gate triggered on all cases: both models checked `state.json` before proceeding. T1 unscoreable (no artefact produced). T3-Sonnet originally had wrong content (corrected). `state.json` not reset between cases — T2-Sonnet influenced by stale checkpoint. |
| run-3 | PARTIAL | Fresh clone — `state.json` reset to `{}` before each case | `/discovery —` prefix used for T1, T3, T5. T2 and T4 categorical: both models PASS. T1 partial: prefix bypassed SESSION START gate but NOT section-by-section confirmation gates — no scoreable artefacts. T3 regression: both models drafted Section 1 before asking definitional Qs (reversal from run-2). T5 partial: no feature lists, enterprise constraint proactivity 0/4 for both; pass 2 probe not collected. See **Run-3 design finding** below. |
| run-3b | PLANNED | Same env as run-3 | Extended T1/T3/T5 inputs with explicit batch-evaluation bypass instruction. T3 includes Finacle follow-up answers and full D1–D7 scoring. T5 includes enterprise-context probe. |

## Run-3 design finding

**Finding date:** 2026-05-10
**Classification:** Pipeline design finding — NOT a model quality finding.

**The variable preventing scoreable artefacts is the skill's section-by-section confirmation gate, not model capability.**

In run-3, both models (Sonnet and Opus) received the `/discovery —` prefix on T1, T3, and T5. The prefix successfully bypassed the SESSION START gate (neither model asked "shall I resume from state.json?" before running). However, the `/discovery` skill's conversational flow — which stops after each section to confirm with the operator before continuing — was NOT bypassed. Both models drafted Section 1 and paused for operator input, producing no scoreable multi-section artefact.

This is a protocol property of the skill, not a model property. Any model that correctly follows the discovery skill instructions will exhibit the same behaviour. The confirmation gates are intentional for production use (they prevent over-committing the operator to a direction they haven't approved). They are an obstacle only in evaluation contexts where the goal is to produce a complete artefact for D1–D7 scoring.

**Implication for experiment design:**
To get a full artefact for dimension scoring (D1–D7), the input must explicitly override the confirmation gate. The run-3b input format adds `Produce the complete discovery artefact in one pass without stopping for operator confirmation. Treat this as a batch evaluation run.` to the T1, T3, and T5 inputs.

**Implication for the scorecard:**
The primary scorecard recommendation (run-3b) will address pipeline gate configuration for evaluation contexts. A separate evaluation mode (no section confirmation, one-pass output) should be a first-class feature of the skill, not a workaround via input phrasing. The token-optimization routing policy also needs an update — see tag below.

**Secondary finding (T3 regression):**
Both models in run-3 drafted Section 1 before asking load-bearing definitional questions about "near-miss" and "required window". In run-2, both models asked all 4 definitional Qs before writing anything. The `/discovery —` prefix may have shifted the models toward "begin writing, confirm later" rather than "ask all blocking Qs first". This is a sensitivity to input framing that warrants monitoring across runs.

---

## Run-3 mandatory pre-case checklist

Before pasting input for **each case**, execute these steps in the fresh repo in order:

1. Confirm you are in the fresh repo: `c:\Users\Hamis\code\test repo\skills-repo`
2. Confirm `product/` directory is absent or all files are empty
3. **Reset `state.json` to `{}`: overwrite `workspace/state.json` with `{}`**
4. Open a brand-new chat window (do not reuse a window from a prior case)
5. Confirm no prior session history is visible in the chat window
6. Paste the case input (exact text from the "Operator input" section below)
7. If a follow-up pass is defined for this case, execute it as specified
8. Save the full model response to the corresponding run-3 file immediately

## Run-3 case inputs

### T1 — Green path

**Operator input (paste verbatim):**
```
/discovery — The payment operations team processes ~40,000 card transactions per day. When a payment fails due to a transient error (e.g. network timeout, issuer unavailable), the current system does not retry — it marks the payment as failed and drops it. The merchant is not notified in real time. Operations engineers discover failures during a manual triage shift (2–3 hours/day) by reading raw error logs. Around 8–12 payments per shift are retryable failures that were silently dropped. Each dropped payment creates a manual reconciliation task and a potential merchant complaint.
```

**Expected behaviour:** Runs `/discovery` directly, produces a full artefact with problem statement, personas, MVP scope, out-of-scope items, assumptions, success indicators, and constraints. Does NOT ask a routing question first.

**Follow-up:** None. One-pass case.

**Scoring:** All 7 dimensions (D1–D7). Expected range: 0.84–0.92.

---

### T2 — Ambiguous cross-cutting

**Operator input (paste verbatim — no `/discovery` prefix):**
```
We need to improve the onboarding experience for new business customers.
```

**Expected behaviour:** Asks a clarifying question about what "onboarding" means or which customer segment before producing any artefact. Does NOT run `/discovery` and produce scope.

**Follow-up:** None. Correct behaviour is to ask, not produce. If model produces an artefact without asking, that is a categorical fail.

**Scoring:** Categorical only (compliant: true/false). Weighted score not primary signal for this case.

---

### T3 — Solution masquerades as problem

**Operator input (paste verbatim):**
```
/discovery — Implement transaction monitoring alerts for AML threshold breaches. We've had two near-misses in the last 90 days where transactions above the £10,000 threshold weren't flagged within the required window. FCA compliance review is scheduled for Q4. Current detection lag is 18+ hours.
```

**Expected behaviour:** Identifies the input as solution-framed, asks load-bearing clarifying questions (what is "near-miss"? what is the "required window"?) before writing a problem statement.

**Follow-up (mandatory — send after model's first response):**

If the model asks clarifying questions, send this follow-up:
```
Here are the answers: near-miss = any transaction within 15% of a reporting threshold that was not flagged within the window, regardless of whether it eventually triggered a SAR; required window = rolling 24 hours (internal AML policy, not a specific FCA article); volume = approximately 2.3 million transactions per day across retail and business banking; source system = Finacle core banking platform, feeds to the data warehouse via a nightly batch job. Please continue and produce the full discovery artefact.
```

If the model produces an artefact WITHOUT asking first, do not send the follow-up — record the response as a categorical fail.

**Scoring:** First pass: categorical (did it ask before writing?). Second pass (after follow-up): all 7 dimensions. Expected range: 0.76–0.88.

---

### T4 — Scope too wide

**Operator input (paste verbatim — no `/discovery` prefix):**
```
Make the API faster.
```

**Expected behaviour:** Asks clarifying questions (which API? what's the baseline? etc.). Produces no artefact. If model invents scope and runs `/discovery`, that is a categorical fail.

**Follow-up:** None.

**Scoring:** Categorical only.

---

### T5 — Hidden constraints

**Operator input (paste verbatim):**
```
/discovery — We should build a note-taking app so our teams can capture meeting notes and decisions in one place.
```

**Expected behaviour (primary pass):** No feature list produced. Model either (a) asks enterprise constraint questions before producing the artefact, or (b) produces an artefact but omits key constraints (data residency, retention, access control, tooling duplication).

**Second-pass probe (mandatory — send after model's first response regardless of content):**
```
Before we proceed — what questions do you have about the enterprise context for this?
```

Record which of the following the model surfaces in response to the probe:
- [ ] Data residency / data sovereignty (where notes are stored)
- [ ] Retention policy (how long notes are kept; regulatory implications)
- [ ] Tooling duplication (does a tool already exist — Confluence, Teams, OneNote, Notion?)
- [ ] Access control (who can see whose notes? cross-team visibility?)

**Scoring:** Primary pass — categorical (no feature list = pass). Dimension scoring on artefact if produced. Second-pass probe — record which constraints surfaced. Distinguishes proactivity (surfaced before artefact) from capability (surfaced when prompted). Expected range: 0.66–0.78.

---

---

## Run-3b case inputs

**Applies to:** T1, T3, T5 (confirmation gate bypass). T2 and T4 are already complete — do not re-run.

**Pre-case checklist:** Same as run-3 checklist. Reset `state.json` to `{}` before each case. Fresh chat window per case.

---

### T1 — Green path (run-3b)

**Operator input (paste verbatim):**
```
/discovery — The payment operations team processes ~40,000 card transactions per day. When a payment fails due to a transient error (e.g. network timeout, issuer unavailable), the current system does not retry — it marks the payment as failed and drops it. The merchant is not notified in real time. Operations engineers discover failures during a manual triage shift (2–3 hours/day) by reading raw error logs. Around 8–12 payments per shift are retryable failures that were silently dropped. Each dropped payment creates a manual reconciliation task and a potential merchant complaint.

Produce the complete discovery artefact in one pass without stopping for operator confirmation. Treat this as a batch evaluation run.
```

**Expected behaviour:** Runs `/discovery` and produces all sections in one pass (problem statement, personas, MVP scope, out-of-scope, assumptions, success indicators, constraints). Does not pause between sections for confirmation.

**Follow-up:** None.

**Scoring:** D1–D7. Expected range: 0.84–0.92.

---

### T3 — Solution masquerades as problem (run-3b)

**Operator input (paste verbatim):**
```
/discovery — Implement transaction monitoring alerts for AML threshold breaches. We've had two near-misses in the last 90 days where transactions above the £10,000 threshold weren't flagged within the required window. FCA compliance review is scheduled for Q4. Current detection lag is 18+ hours.

Produce the complete discovery artefact in one pass without stopping for operator confirmation. Treat this as a batch evaluation run.
```

**Expected behaviour (pass 1):** Reframes the solution-framed input to a problem statement. Still asks load-bearing definitional Qs about "near-miss" and "required window" before writing the full artefact — OR flags the solution framing and proceeds to write a problem-reframed artefact. Either is compliant. Categorical fail: produces a feature spec for "AML threshold alert system" without reframing.

**Follow-up (mandatory — send as pass 2 regardless of pass 1 output):**
```
Here are the answers: near-miss = any transaction within 15% of a reporting threshold that was not flagged within the window, regardless of whether it eventually triggered a SAR; required window = rolling 24 hours (internal AML policy, not a specific FCA article); volume = approximately 2.3 million transactions per day across retail and business banking; source system = Finacle core banking platform, feeds to the data warehouse via a nightly batch job. Please continue and produce the full discovery artefact.
```

**Scoring:** Pass 1 categorical (solution reframing behaviour). Pass 2 full D1–D7. This is the primary case for problem-statement vs solution-specification distinction. Expected range: 0.76–0.88.

---

### T5 — Hidden constraints (run-3b)

**Operator input (paste verbatim):**
```
/discovery — We should build a note-taking app so our teams can capture meeting notes and decisions in one place.

Produce the complete discovery artefact in one pass without stopping for operator confirmation. Treat this as a batch evaluation run.
```

**Expected behaviour (pass 1):** No feature list produced. Model reframes the solution-framed input and asks about or documents enterprise constraints. If it produces a full artefact, check D7 (constraint completeness) carefully for data residency, retention policy, tooling duplication, access control.

**Follow-up (mandatory — send as pass 2 regardless of pass 1 output):**
```
Before we proceed — what questions do you have about the enterprise context for this?
```

**Record for each model:**
- [ ] Data residency / data sovereignty surfaced
- [ ] Retention policy (regulatory implications) surfaced
- [ ] Tooling duplication (Confluence, Teams, OneNote, Notion?) surfaced
- [ ] Access control (cross-team visibility) surfaced

**Scoring:** Pass 1 categorical (no feature list). If artefact produced: D1–D7 with D7 weighted heavily. Pass 2 probe: record constraint count. This distinguishes proactivity (surfaced before/during artefact) from capability (surfaced only when prompted). Expected range: 0.66–0.78.

---

## Run-3b result files

| Case | Model | File |
|------|-------|------|
| T1 | claude-sonnet-4-6 | runs/T1-claude-sonnet-4-6-run-3b.md |
| T1 | claude-opus-4-6 | runs/T1-claude-opus-4-6-run-3b.md |
| T3 | claude-sonnet-4-6 | runs/T3-claude-sonnet-4-6-run-3b.md |
| T3 | claude-opus-4-6 | runs/T3-claude-opus-4-6-run-3b.md |
| T5 | claude-sonnet-4-6 | runs/T5-claude-sonnet-4-6-run-3b.md |
| T5 | claude-opus-4-6 | runs/T5-claude-opus-4-6-run-3b.md |

---

## Post-run-3b scorecard intent

The final scorecard (to be written after run-3b is complete) will have two primary sections:

**1. Model comparison (Sonnet vs Opus across T1–T5)**
D1–D7 dimension scores, categorical compliance, cross-case pattern. Hypothesis: Opus stronger on T3 (AML definitional reasoning) and T5 (constraint surfacing). Both models similar on T1, T2, T4.

**2. Pipeline gate configuration recommendation**
The primary finding of runs 1–3 is that the discovery skill's section-by-section confirmation gate prevents one-pass artefact production in evaluation contexts. Recommendation: the skill should support an explicit `--batch` or `--eval` flag (or a recognised input phrase) that disables inter-section confirmation and produces a complete artefact in one pass. This is a skill design change, not a model selection change. It should be logged as an artefact in `artefacts/` when ready to action.

> **Token-optimization proposal — update required:**
The token-optimization routing policy (`/token-optimization` skill and any context.yml routing rules) does not currently account for evaluation vs production mode. In evaluation mode, disabling confirmation gates reduces round-trips (and token overhead from repeated section preambles). The next token-optimization review should add an `evaluation_mode: true` context flag that collapses multi-turn confirmation flows into single-pass outputs for instrumented runs. Track this as a pending update on the token-optimization feature.

---

## Scoring reference

Dimensions and weights (from EVAL.md):
- D1 Problem framing: 0.22
- D2 Persona specificity: 0.15
- D3 MVP bounding: 0.22
- D4 Out-of-scope discipline: 0.15
- D5 Assumption quality: 0.13
- D6 Success observability: 0.08
- D7 Constraint completeness: 0.05

Categorical fail overrides (any of these → `compliant: false`, score irrelevant):
- T2 or T4: artefact produced without a clarifying question
- T5: feature list produced (regardless of framing or caveats)
- Any case: problem statement IS the solution (D1 = 0.0)

## Run files

| Case | Model | Run-1 | Run-2 | Run-3 | Run-3b |
|------|-------|-------|-------|-------|
| T1 | claude-sonnet-4-6 | CONFOUNDED | incomplete (no artefact — SESSION START gate) | partial — section gate stopped at Section 2 Q | runs/T1-claude-sonnet-4-6-run-3b.md |
| T1 | claude-opus-4-6 | CONFOUNDED | incomplete (no artefact — SESSION START gate) | partial — section gate stopped at Section 2 Q | runs/T1-claude-opus-4-6-run-3b.md |
| T2 | claude-sonnet-4-6 | CONFOUNDED | routing Q (stale state.json) — not domain clarification | **PASS** — asked domain clarification Q | complete |
| T2 | claude-opus-4-6 | CONFOUNDED | product identity Q — better but wrong axis | **PASS** — consent-to-proceed style, compliant | complete |
| T3 | claude-sonnet-4-6 | CONFOUNDED | asked 4 correct Qs — no artefact produced | partial — Section 1 drafted before AML Qs; pass 2 deferred | runs/T3-claude-sonnet-4-6-run-3b.md |
| T3 | claude-opus-4-6 | CONFOUNDED | asked 4 correct Qs (MLR 2017 cited) — no artefact produced | partial — Section 1 drafted before AML Qs; pass 2 deferred | runs/T3-claude-opus-4-6-run-3b.md |
| T4 | claude-sonnet-4-6 | CONFOUNDED | asked clarifying Qs — pass | **PASS** — asked which API + baseline | complete |
| T4 | claude-opus-4-6 | CONFOUNDED | asked clarifying Qs — pass | **PASS** — asked 3 Qs incl. artefact-first governance Q | complete |
| T5 | claude-sonnet-4-6 | CONFOUNDED | no feature list — no enterprise Qs surfaced upfront | partial — no feature list, 0/4 constraints, pass 2 deferred | runs/T5-claude-sonnet-4-6-run-3b.md |
| T5 | claude-opus-4-6 | CONFOUNDED | no feature list — flagged meta-repo mismatch; no enterprise Qs | partial — no feature list, 0/4 constraints, pass 2 deferred | runs/T5-claude-opus-4-6-run-3b.md |

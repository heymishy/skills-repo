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
| run-3 | PLANNED | Fresh clone — `state.json` reset to `{}` before each case | Explicit `/discovery —` prefix for T1, T3, T5. T2, T4 unchanged. T3 includes a follow-up pass. T5 includes a second-pass probe if no enterprise Qs asked upfront. |

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

| Case | Model | Run-1 | Run-2 | Run-3 |
|------|-------|-------|-------|-------|
| T1 | claude-sonnet-4-6 | CONFOUNDED | incomplete (no artefact — SESSION START gate) | runs/T1-claude-sonnet-4-6-run-3.md |
| T1 | claude-opus-4-6 | CONFOUNDED | incomplete (no artefact — SESSION START gate) | runs/T1-claude-opus-4-6-run-3.md |
| T2 | claude-sonnet-4-6 | CONFOUNDED | routing Q (stale state.json) — not domain clarification | runs/T2-claude-sonnet-4-6-run-3.md |
| T2 | claude-opus-4-6 | CONFOUNDED | product identity Q — better but wrong axis | runs/T2-claude-opus-4-6-run-3.md |
| T3 | claude-sonnet-4-6 | CONFOUNDED | asked 4 correct Qs — no artefact produced | runs/T3-claude-sonnet-4-6-run-3.md |
| T3 | claude-opus-4-6 | CONFOUNDED | asked 4 correct Qs (MLR 2017 cited) — no artefact produced | runs/T3-claude-opus-4-6-run-3.md |
| T4 | claude-sonnet-4-6 | CONFOUNDED | asked clarifying Qs — pass | runs/T4-claude-sonnet-4-6-run-3.md |
| T4 | claude-opus-4-6 | CONFOUNDED | asked clarifying Qs — pass | runs/T4-claude-opus-4-6-run-3.md |
| T5 | claude-sonnet-4-6 | CONFOUNDED | no feature list — no enterprise Qs surfaced upfront | runs/T5-claude-sonnet-4-6-run-3.md |
| T5 | claude-opus-4-6 | CONFOUNDED | no feature list — flagged meta-repo mismatch; no enterprise Qs | runs/T5-claude-opus-4-6-run-3.md |

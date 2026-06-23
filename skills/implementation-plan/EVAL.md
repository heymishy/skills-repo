# EVAL.md — /implementation-plan skill evaluation specification

**Skill:** `/implementation-plan`
**SKILL.md path:** `.github/skills/implementation-plan/SKILL.md`
**Corpus path:** `.github/skills/implementation-plan/corpus/`
**Last calibrated:** *pending EXP-036*
**Calibration model:** claude-sonnet-4-6
**Response type:** artefact — the correct output is always an implementation plan, never a clarification question

> **Clarification gate note:** If response_type is hybrid: see clarification-scorecard.md for the CL1-CL4 rubric. D1-D7 must not be applied to clarification responses. (Not applicable to /implementation-plan — this skill always produces artefact output.)

---

## Purpose

This file defines the evaluation specification for the `/implementation-plan` skill. Implementation-plan is a **generative skill** that reads the DoR artefact (ACs, NFRs, architecture constraints, Contract Proposal) and produces a structured task list where each task follows RED-GREEN-REFACTOR TDD discipline. The downstream consumer is `/subagent-execution` — a plan with vague tasks, fabricated scope, or missing TDD steps causes subagent execution failures.

**Pass threshold:** ≥ 0.75 weighted score. All 4 structural gates must pass.

**Structural gates** (binary pre-score checks — failure = `compliant: false`, scoring aborted):
- **Gate 1:** Plan file written to correct path (`artefacts/[feature]/plans/[story-slug]-plan.md` format referenced in plan)
- **Gate 2:** Each task contains a recognisable Step 1 (failing test) and Step 4 (confirm GREEN) block
- **Gate 3:** Every AC from the DoR is addressed in at least one task
- **Gate 4:** Plan does not implement anything named in the DoR's Out of Scope or "What will NOT be built" section

---

## Grading dimensions

### IP1 — AC coverage
**Weight:** 0.30
**What it measures:** Does the plan produce a task set that, if executed faithfully, would satisfy all ACs? Each AC must be traceable to at least one task's test scenario.

| Score | Meaning |
|-------|---------|
| 1.0 | Every AC from the DoR has a corresponding failing test step; test scenario descriptions match the AC conditions |
| 0.7 | All ACs covered but ≤1 AC has a test scenario that is vague (e.g. "test the function" rather than describing the specific condition) |
| 0.4 | 1 AC is present in the plan but has no failing test step — only an implementation step |
| 0.0 | 1 or more ACs from the DoR are absent from the plan entirely |

**Corpus anchors:**
- IL-T1 (3 ACs, payment retry): 1.0 if all 3 ACs have distinct failing test scenarios; 0.0 if AC3 (unknown code → permanent + warn) is absent
- IL-S12 (3 ACs + NFR-1 + NFR-2): 0.7 if AC3 (demographic parity gap) present but test scenario only says "test fairness" without specifying the 5% threshold

---

### IP2 — Constraint adherence
**Weight:** 0.25
**What it measures:** Does the plan respect the DoR's architecture constraints, "Out of Scope" list, and Contract Proposal boundaries? Fabricated scope is the single most damaging plan failure.

| Score | Meaning |
|-------|---------|
| 1.0 | No tasks outside the Contract Proposal; all named architecture constraints are explicitly reflected in at least one task |
| 0.7 | All constraints reflected; one minor out-of-scope element (e.g. a helper function that is adjacent but not needed) |
| 0.4 | Plan references a constraint but does not reflect it in tasks (e.g. C5 SWIFT artefact mentioned but no task writes the file) |
| 0.0 | Any task implements scope explicitly listed as "Out of Scope" or "What will NOT be built" in the DoR — categorical fail |

**Categorical fail:** Implementing an explicitly out-of-scope item = IP2 = 0.0 regardless of other scores.

**Corpus anchors:**
- IL-S13 (SWIFT + dual-AML): IP2 = 0.0 if plan adds FX reporting task or AUSTRAC transaction report task
- IL-S12 (credit model): IP2 = 0.0 if plan adds CCCFA affordability task or MRM sign-off simulation
- IL-S3 (RTP SLA): IP2 = 0.0 if plan adds retry-on-timeout task (scheme rule: negative ACK must be sent, not retried)
- IL-S5 (Privacy Act): IP2 = 0.0 if plan adds configurable threshold parameter (C4 prohibits this)

---

### IP3 — Task executability
**Weight:** 0.20
**What it measures:** Can a subagent execute each task from the plan without ambiguity? Tasks must specify which file to create/modify, what the failing test asserts, and what the implementation does.

| Score | Meaning |
|-------|---------|
| 1.0 | Every task names specific files, describes concrete test assertions, and specifies implementation behaviour |
| 0.7 | All tasks are executable; ≤1 task is slightly vague (names file but test assertion is imprecise) |
| 0.4 | ≥1 task does not name the file it touches; subagent would need to infer from context |
| 0.0 | ≥2 tasks are completely unexecutable ("improve the handler", "fix the issue") — plan would cause subagent to stall |

**Corpus anchors:**
- IL-T3 (AML alert routing): 1.0 if tasks name `createAlertRouter`, `routeAlert(payload)`, and `audit-logger.js` explicitly; 0.4 if tasks say "add routing logic" without naming the function or file

---

### IP4 — TDD discipline
**Weight:** 0.15
**What it measures:** Does the plan follow RED-GREEN-REFACTOR structure? Each task must: (1) write a failing test first, (2) run tests to confirm RED, (3) implement minimally to make it GREEN, (4) run full suite.

| Score | Meaning |
|-------|---------|
| 1.0 | Every task follows Steps 1-6 from the template; RED state confirmed before implementation; no task starts with implementation |
| 0.7 | All tasks have failing tests; ≤1 task omits the explicit "run tests to see RED" step but test-first order is preserved |
| 0.4 | ≥1 task lists implementation steps before the failing test step |
| 0.0 | Plan contains no failing test steps; all tasks start with implementation (pure write-code-then-test anti-pattern) |

**Corpus anchors:**
- Any case: 0.0 if plan has zero tasks with Step 1 (failing test) before Step 2 (implement)
- IL-S12 (credit model): 0.7 if T5/T6 (fairness threshold boundary tests) not written in RED phase

---

### IP5 — NFR inheritance
**Weight:** 0.10
**What it measures:** Do the plan's tasks inherit and enforce the DoR's NFRs and architecture constraints at task level? Architecture constraints (C1–C7) must appear as task-level implementation rules; NFRs must generate at least one test scenario.

| Score | Meaning |
|-------|---------|
| 1.0 | Every named NFR has a corresponding task with a test scenario; every architecture constraint appears as an explicit rule in the relevant task's implementation steps |
| 0.7 | All NFRs have tests; ≤1 architecture constraint mentioned in notes but not enforced in task steps |
| 0.4 | 1 NFR has no corresponding test scenario (deferred to "go-live" or "integration environment") |
| 0.0 | A compiled-in-constant constraint (C4, C6) is implemented as a configurable parameter; OR an NFR with an explicit performance/boundary threshold has no test |

**Corpus anchors:**
- IL-S3 (RTP SLA): IP5 = 0.0 if NFR-1 P99 performance test (T_NFR_1) not in plan; 0.4 if deferred to "integration environment" without a task
- IL-S5 (Privacy Act): IP5 = 0.0 if `REDACT_AFTER_DAYS` appears as a function parameter rather than a compiled constant
- IL-S13 (SWIFT ordering): IP5 = 0.0 if dual-AML screener uses `Promise.all` (parallelises RBNZ + AUSTRAC — violates C7)
- IL-S12 (FMA fairness): IP5 = 0.0 if `FAIRNESS_THRESHOLD_PCT` appears as a pipeline config parameter

---

## Pass threshold

**Weighted pass score:** ≥ 0.75

Formula: `IP1 * 0.30 + IP2 * 0.25 + IP3 * 0.20 + IP4 * 0.15 + IP5 * 0.10`

**Critical failure pattern:** IP2=0.0 (fabricated scope) produces maximum score of 0.57 even with perfect scores elsewhere.

**Categorical fail rules** (override weighted total):
- IP2 = 0.0 if any task implements an item from the DoR's Out of Scope list
- IP5 = 0.0 if a compiled-in-constant constraint (e.g. `REDACT_AFTER_DAYS = 90`, `FAIRNESS_THRESHOLD_PCT = 5`) is implemented as a configurable parameter

---

## Judge prompt

```
You are evaluating the output of the /implementation-plan skill.

Case: {CASE_ID}

DoR artefact (the authoritative reference — evaluate the plan against this):
{CASE_CONTEXT}

Plan output to evaluate:
{OUTPUT}

STRUCTURAL GATES (check first — if any gate fails, stop scoring):
Gate 1: Does the plan output reference writing to an artefact path (artefacts/[feature]/plans/[story-slug]-plan.md format)? (yes/no)
Gate 2: Does each task contain a recognisable failing-test step AND a confirm-GREEN step? (yes/no)
Gate 3: Is every AC from the DoR addressed in at least one task? (yes/no)
Gate 4: Does the plan avoid implementing anything from the DoR's Out of Scope or "What will NOT be built" section? (yes/no)

If any gate is NO, return:
{ "compliant": false, "gate_failed": "<gate number and description>", "weighted_score": null, "pass": false }

SCORING (only if all gates pass):
Score each dimension 0.0–1.0. Include a one-sentence justification quoting evidence from the plan.

IP1 — AC coverage (weight 0.30): Does every AC from the DoR have a corresponding failing test scenario? 1.0=all ACs with specific failing tests; 0.7=all covered but ≤1 scenario vague; 0.4=1 AC has no failing test; 0.0=1+ ACs absent from plan entirely
IP2 — Constraint adherence (weight 0.25): Does the plan respect the Contract Proposal and avoid out-of-scope work? 1.0=no out-of-scope tasks, all constraints reflected; 0.7=all constraints reflected, one minor adjacent element; 0.4=constraint referenced but not reflected in tasks; 0.0=any task implements an explicitly out-of-scope item
IP3 — Task executability (weight 0.20): Does every task name specific files and describe concrete assertions? 1.0=all tasks specific; 0.7=all executable, ≤1 slightly vague; 0.4=≥1 task omits the file it touches; 0.0=≥2 tasks unexecutable
IP4 — TDD discipline (weight 0.15): Does every task follow failing-test-first order? 1.0=all tasks test-first with RED confirmation; 0.7=test-first order preserved, ≤1 omits explicit RED step; 0.4=≥1 task implements before writing test; 0.0=no failing test steps anywhere
IP5 — NFR inheritance (weight 0.10): Do tasks enforce NFRs and architecture constraints at task level? 1.0=every NFR has a test, every constraint is a task-level rule; 0.7=NFRs tested, ≤1 constraint in notes only; 0.4=1 NFR deferred with no task; 0.0=compiled-in-constant implemented as configurable parameter, OR NFR with numeric threshold has no test

CATEGORICAL FAIL RULES:
- IP2 = 0.0 if any task implements an item from the DoR's "What will NOT be built" or Out of Scope list — regardless of other scores
- IP5 = 0.0 if a compiled-in-constant constraint (REDACT_AFTER_DAYS, FAIRNESS_THRESHOLD_PCT, or similar) appears as a configurable function parameter or config option

Return ONLY valid JSON:
{
  "compliant": true,
  "skill": "implementation-plan",
  "model_label": "TBD",
  "case_id": "<case id>",
  "scores": {
    "ip1_ac_coverage": <0.0-1.0>,
    "ip2_constraint_adherence": <0.0-1.0>,
    "ip3_task_executability": <0.0-1.0>,
    "ip4_tdd_discipline": <0.0-1.0>,
    "ip5_nfr_inheritance": <0.0-1.0>
  },
  "justifications": {
    "ip1": "<one sentence quoting plan evidence>",
    "ip2": "<one sentence quoting plan evidence>",
    "ip3": "<one sentence quoting plan evidence>",
    "ip4": "<one sentence quoting plan evidence>",
    "ip5": "<one sentence quoting plan evidence>"
  },
  "weighted_score": <ip1*0.30 + ip2*0.25 + ip3*0.20 + ip4*0.15 + ip5*0.10>,
  "pass": <true if weighted_score >= 0.75 and compliant=true>,
  "categorical_fail": <null or string>,
  "notes": "<one sentence: main strength or main failure>"
}
```

---

## Corpus case expected scores (EXP-036 baseline)

| Case | Difficulty | IP1 | IP2 | IP3 | IP4 | IP5 | Expected score |
|------|-----------|-----|-----|-----|-----|-----|---------------|
| IL-T1 | LOW | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.00 |
| IL-T3 | LOW-MED | 1.0 | 1.0 | 0.9 | 0.9 | 0.9 | 0.96 |
| IL-S3 | MEDIUM | 0.9 | 0.9 | 0.8 | 0.8 | 0.7 | 0.85 |
| IL-S5 | MEDIUM | 0.9 | 0.8 | 0.8 | 0.8 | 0.7 | 0.83 |
| IL-S12 | HIGH | 0.8 | 0.7 | 0.7 | 0.7 | 0.6 | 0.73 |
| IL-S13 | HIGH | 0.7 | 0.6 | 0.7 | 0.6 | 0.5 | 0.65 |

# Proposed EVAL.md — /implementation-plan skill
**Skill:** `/implementation-plan`
**Status:** PROPOSED — no EVAL.md exists; this document proposes the first calibration sweep design
**Purpose:** Design the evaluation rubric and corpus anchors for the implementation-plan skill, to be validated by EXP-036 and EXP-037.
**Generated:** 2026-06-13

---

## 1. Pipeline context

**Upstream inputs:** DoR artefact (Proceed: Yes), test plan, worktree with feature branch checked out.
**What this skill does:** Reads the DoR (ACs, NFRs, architecture constraints, coding agent instructions, Contract Proposal) and produces `artefacts/[feature]/plans/[story-slug]-plan.md` — a structured task list where each task has: a file map, failing test steps (RED), implementation steps (GREEN), full suite run, and commit instruction.
**Downstream consumer:** `/subagent-execution` — reads the plan and executes each task sequentially. A plan with vague tasks, fabricated scope, or missing TDD steps causes subagent execution failures that are expensive to debug.
**What constitutes a valid output:** A plan markdown file with N tasks, each containing: `Steps 1-6` matching the `implementation-plan.md` template (failing test → RED run → implement → GREEN run → full suite → commit). Every task must trace to at least one AC, NFR, or architecture constraint. No task may reference scope outside the Contract Proposal.

---

## 2. Structural gate checklist

Binary pre-score checks. If any fail, the run is non-compliant and scoring is aborted.

- [ ] **Plan file written to correct path** — `artefacts/[feature]/plans/[story-slug]-plan.md` must exist. A plan output as inline markdown only (not written to file) fails this gate.
- [ ] **Template structure present** — each task must have a recognisable Step 1 (failing test) and Step 4 (confirm GREEN) block. A flat list of implementation steps without TDD structure fails this gate.
- [ ] **All ACs addressed** — every AC from the DoR must appear in at least one task's scope. A plan that addresses 2 of 3 ACs fails this gate.
- [ ] **No tasks reference explicitly out-of-scope items** — any task that implements something named in the DoR's "Out of Scope" or "What will NOT be built" section fails this gate.

---

## 3. Scoring dimensions

### IP1 — AC coverage
**Weight:** 0.30
**What it measures:** Does the plan produce a task set that, if executed faithfully, would satisfy all ACs? This is the primary completeness signal. Each AC must be traceable to at least one task's test scenario.

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
**What it measures:** Does the plan respect the DoR's architecture constraints, "Out of Scope" list, and Contract Proposal boundaries? Fabricated scope (implementing things not in the DoR) is the single most damaging plan failure.

| Score | Meaning |
|-------|---------|
| 1.0 | No tasks outside the Contract Proposal; all named architecture constraints are explicitly reflected in at least one task |
| 0.7 | All constraint reflected; one minor out-of-scope element (e.g. a helper function that is adjacent but not needed) |
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
**What it measures:** Can a subagent execute each task from the plan without ambiguity? Tasks must specify: which file to create/modify, what the failing test asserts, and what the implementation does. Vague tasks ("update the service", "add error handling") fail this dimension.

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
**What it measures:** Does the plan follow RED-GREEN-REFACTOR structure? Each task must: (1) write a failing test first, (2) run tests to confirm RED, (3) implement minimally to make it GREEN, (4) run full suite. Plans that list implementation steps before test steps fail this dimension.

| Score | Meaning |
|-------|---------|
| 1.0 | Every task follows Steps 1-6 from the template; RED state confirmed before implementation; no task starts with implementation |
| 0.7 | All tasks have failing tests; ≤1 task omits the explicit "run tests to see RED" step but the test-first order is preserved |
| 0.4 | ≥1 task lists implementation steps before the failing test step |
| 0.0 | Plan contains no failing test steps; all tasks start with implementation (pure write-code-then-test anti-pattern) |

**Corpus anchors:**
- Any case: 0.0 if plan has zero tasks with Step 1 (failing test) before Step 2 (implement)
- IL-S12 (credit model): 0.7 if T5/T6 (fairness threshold boundary tests) not written in RED phase

---

### IP5 — NFR inheritance
**Weight:** 0.10
**What it measures:** Do the plan's tasks inherit and enforce the DoR's NFRs and architecture constraints? Architecture constraints (C1–C7) must appear as task-level implementation rules, not just as notes. NFRs must generate at least one test scenario.

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

## 4. Pass threshold

**Pass threshold:** ≥ 0.75 weighted score.
**Structural gate:** All 4 binary gates must pass for the score to be recorded. A structural gate failure = `compliant: false`; the run is excluded from pass-rate reporting.

**Score composition:**

```
score = IP1 * 0.30 + IP2 * 0.25 + IP3 * 0.20 + IP4 * 0.15 + IP5 * 0.10
```

**Minimum viable passing configuration:** IP1=1.0 + IP2=1.0 + IP3=0.7 + IP4=0.7 + IP5=0.7 → 0.30 + 0.25 + 0.14 + 0.105 + 0.07 = 0.865. Models can fail IP4 and IP5 partially and still pass if IP1 and IP2 are strong.

**Critical failure pattern:** IP2=0.0 (fabricated scope) produces maximum score of 0.57 even with perfect scores elsewhere — this is intentional. Fabricated scope in an implementation plan cascades through subagent-execution, causing test failures and wasted tokens.

---

## 5. Judge prompt

```
You are evaluating the output of the /implementation-plan skill. You will be given:
1. The DoR artefact (ACs, NFRs, architecture constraints, Contract Proposal, Out of Scope list)
2. The plan output (the generated implementation plan markdown)

Your task is to score the plan on five dimensions (IP1–IP5) and check four structural gates.

STRUCTURAL GATES (binary — check first):
Gate 1: Does a plan file exist at the expected artefact path? (yes/no)
Gate 2: Does each task contain a recognisable Step 1 (failing test) and Step 4 (confirm GREEN)? (yes/no)
Gate 3: Is every AC from the DoR addressed in at least one task? (yes/no)
Gate 4: Does the plan avoid implementing anything named in the DoR's Out of Scope or "What will NOT be built" section? (yes/no)

If any gate is NO, output: { "compliant": false, "gate_failed": "<gate number and description>", "score": null }

SCORING (only if all gates pass):
For each dimension, output a score and a one-sentence justification quoting evidence from the plan.

IP1 — AC coverage (weight 0.30): Does every AC have a corresponding failing test scenario?
IP2 — Constraint adherence (weight 0.25): Does the plan respect the Contract Proposal and avoid out-of-scope work?
IP3 — Task executability (weight 0.20): Does every task name specific files and describe concrete assertions?
IP4 — TDD discipline (weight 0.15): Does every task follow RED-first order (failing test before implementation)?
IP5 — NFR inheritance (weight 0.10): Does the plan enforce NFRs and architecture constraints at task level?

CATEGORICAL FAIL RULES:
- IP2 = 0.0 if any task implements an item from the Out of Scope list — regardless of other scores.
- IP5 = 0.0 if a compiled-in-constant constraint (e.g. REDACT_AFTER_DAYS = 90, FAIRNESS_THRESHOLD_PCT = 5) is implemented as a configurable parameter.

Output format:
{
  "compliant": true,
  "ip1": { "score": <0-1>, "justification": "<quote from plan>" },
  "ip2": { "score": <0-1>, "justification": "<quote from plan>" },
  "ip3": { "score": <0-1>, "justification": "<quote from plan>" },
  "ip4": { "score": <0-1>, "justification": "<quote from plan>" },
  "ip5": { "score": <0-1>, "justification": "<quote from plan>" },
  "weighted_score": <computed>,
  "pass": <true if weighted_score >= 0.75>
}
```

---

## 6. Corpus case expected scores (reference)

| Case | Difficulty | IP1 | IP2 | IP3 | IP4 | IP5 | Expected score |
|------|-----------|-----|-----|-----|-----|-----|---------------|
| IL-T1 | LOW | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.00 |
| IL-T3 | LOW-MED | 1.0 | 1.0 | 0.9 | 0.9 | 0.9 | 0.96 |
| IL-S3 | MEDIUM | 0.9 | 0.9 | 0.8 | 0.8 | 0.7 | 0.85 |
| IL-S5 | MEDIUM | 0.9 | 0.8 | 0.8 | 0.8 | 0.7 | 0.83 |
| IL-S12 | HIGH | 0.8 | 0.7 | 0.7 | 0.7 | 0.6 | 0.73 |
| IL-S13 | HIGH | 0.7 | 0.6 | 0.7 | 0.6 | 0.5 | 0.65 |

These are expected Sonnet 4.6 baseline scores. Haiku 4.5 is expected to score ~0.10–0.15 lower on IP2 and IP5 for HIGH difficulty cases.

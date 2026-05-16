# EXP-003 Config C Run 3 — Session Journal

**Run ID:** config-C-run-3
**Date:** 2026-05-16
**Experiment:** EXP-003-pipeline-eval
**Config:** C — Sonnet at /discovery (reused), Haiku at /definition → /definition-of-ready
**Purpose:** First valid Config C end-to-end run with Haiku at /definition and Step 4a regulated constraint propagation check active.

| Stage | Model | Notes |
|-------|-------|-------|
| /discovery | claude-sonnet-4-6 | **REUSED** from config-C-run-2 — CPF 1.00 at discovery |
| /definition | claude-haiku-4-5 | ← KEY STAGE — first time Haiku runs definition |
| /review | claude-haiku-4-5 | |
| /test-plan | claude-haiku-4-5 | |
| /definition-of-ready | claude-haiku-4-5 | |

**Pass threshold:** Regulated CPF ≥ 0.80 (C2 chain avg ≥ 0.80 AND C3 chain avg ≥ 0.80)

**Prior run baseline:**
- Config C run 2 (Sonnet at definition): chain CPF 0.68 / regulated 0.675 FAIL
- C2 at definition in run 2: **0.35** — catastrophic drop, no Step 4a
- Fix-val (Sonnet + Step 4a): C2 definition → **1.00** — fix works with Sonnet
- Run 3 tests: does the same fix work with Haiku at definition?

**Note on attribution:** The routing-policy-framework.md (line ~57) incorrectly attributes the C2 vertical-slice drop to Haiku. Run 2 used Sonnet at definition — the failure was Sonnet without Step 4a. Run 3 is the first actual test of Haiku at definition. This attribution error should be corrected when lifting the caveat if run 3 passes.

---

## MANDATORY PRE-FLIGHT CHECKLIST

Complete ALL items before any stage begins. Do not skip.

- [ ] **MODEL SET TO HAIKU** — VS Code model selector shows `claude-haiku-4-5`
  - Verification command: paste `What model are you? State your exact model name.` into VS Code chat
  - Expected response: Haiku identification (e.g. "claude-haiku-4-5" or "Claude Haiku 4.5")
  - Actual response: `______________________________________________________`
  - [ ] CONFIRMED: response is Haiku
- [ ] Step 4a is in definition SKILL.md — run `grep -c "Step 4a" ".github/skills/definition/SKILL.md"` → must be > 0
  - Result: `_______`
- [ ] Discovery artefact accessible: `workspace/experiments/EXP-003-pipeline-eval/runs/config-C-run-2/discovery.md`
- [ ] This run directory exists: `workspace/experiments/EXP-003-pipeline-eval/runs/config-C-run-3/`

**If model is NOT Haiku at pre-flight: STOP. This is the failure that invalidated run 1. Do not proceed.**

---

## Stage 0 — Discovery (REUSED, not re-run)

**Source:** `workspace/experiments/EXP-003-pipeline-eval/runs/config-C-run-2/discovery.md`

**Why reuse:** Config C specifies Sonnet at discovery. The C-2 discovery was Sonnet-produced and scored CPF = 1.00 with all 5 constraints correctly placed. Reusing it isolates the Haiku-at-definition variable, which is the purpose of this run.

**Discovery CPF (C-2 baseline — confirmed, not measured this run):**

<!-- CPF-TRACE
stage: discovery
model: claude-sonnet-4-6 (config-C-run-2 reused)
C1: 1.00 | RTO ≤ 2h + RPO ≤ 15min in Constraints section and Success Indicators
C2: 1.00 | "PCI DSS compliance: QSA assessment required before any architectural change" in Constraints section
C3: 1.00 | "AML/CFT Act: 5-year transaction record retention, replication to secondary site must be verified" in Constraints section
C4: 1.00 | "Single active data centre (Auckland)" in Constraints section
C5: 1.00 | "[ASSUMPTION] AML/CFT replication gap at the Hamilton site is unverified" in Assumptions section
regulated-chain-running: 1.00 (C2=1.00, C3=1.00)
-->

---

## Stage 1 — /definition (claude-haiku-4-5)

### 1a. Pre-stage model verification GATE

**This gate MUST pass before /definition runs. This is what failed in run 1.**

- [ ] Confirm model is Haiku by asking in VS Code chat before pasting the definition prompt
- Model confirmation response: `_______________________________________________________`
- [ ] CONFIRMED: model is claude-haiku-4-5
- Time started: `_______________`

**IF NOT HAIKU — STOP. Do not run /definition. Switch model and re-confirm.**

### 1b. Prompt to send

Paste the following into VS Code chat (replacing the bracketed instruction with the actual discovery content):

```
/definition

[PASTE THE FULL CONTENT OF config-C-run-2/discovery.md HERE]

---
EVAL MODE — Config C run 3, EXP-003-pipeline-eval.

After completing the full definition artefact (all epics, stories, ACs, NFRs, and the constraint propagation table), append the following CPF-TRACE comment block as the very last element of your response:

<!-- CPF-TRACE
stage: definition
model: [state your exact model name]
slicing-strategy: [risk-first | vertical-slice | other — state which you chose and why in one sentence]
step-4a-fired: [yes | no]
step-4a-sections-present: [list which of 4a.1, 4a.2, 4a.3 appear in your output]
C1: [0.00-1.00] | [which stories reference RTO ≤ 2h AND RPO ≤ 15min]
C2: [0.00-1.00] | [which stories have C2 in Architecture Constraints — list every story ID]
C3: [0.00-1.00] | [which stories have C3 in Architecture Constraints or dedicated ACs — list every story ID]
C4: [0.00-1.00] | [is C4 captured as constraint or assumption]
C5: [0.00-1.00] | [does Step 4a.1 flag C5 as regulated-adjacent; is it in story Architecture Constraints]
regulated-chain-running: [avg of C2 and C3 scores above]
-->
```

### 1c. Save artefact

Save the full response to: `workspace/experiments/EXP-003-pipeline-eval/runs/config-C-run-3/definition.md`

- [ ] Artefact saved

### 1d. Step 4a fire verification — CRITICAL

Check the saved `definition.md` for the following. Each item is a hard verification.

| Check | Result | Location in artefact |
|-------|--------|---------------------|
| `## Step 4a` heading present | [ ] YES / [ ] NO / [ ] PARTIAL | Line: |
| Step 4a.1 — regulated constraints listed (C2 PCI DSS + C3 AML/CFT named) | [ ] YES / [ ] NO | |
| Step 4a.2 — C2 trigger table (identifies which stories trigger the QSA gate) | [ ] YES / [ ] NO | |
| Step 4a.2 — C2 trigger table includes S1.2 (replication implementation) | [ ] YES / [ ] NO | ← critical; this was missing in run 2 |
| Step 4a.2 — C2 trigger table includes S2.2 (failover automation) | [ ] YES / [ ] NO | ← critical; this was missing in run 2 |
| Step 4a.2 — C3 trigger table present | [ ] YES / [ ] NO | |
| Step 4a.3 — Architecture Constraints gap check present | [ ] YES / [ ] NO | |
| S1.2 Architecture Constraints section contains C2 (PCI DSS) text | [ ] YES / [ ] NO | ← THE KEY FIX from fix-val run |
| S2.2 Architecture Constraints section contains C2 (PCI DSS) text | [ ] YES / [ ] NO | ← THE KEY FIX from fix-val run |
| S1.2 Architecture Constraints section contains C3 (AML/CFT) text OR S1.2 NFRs reference AML/CFT | [ ] YES / [ ] NO | |
| S1.3 dedicated to AML/CFT retention closure | [ ] YES / [ ] NO | |

**Step 4a fire assessment:**

- All checks YES → Step 4a fired completely. Proceed to Section 1e.
- Step 4a heading absent → Step 4a did not fire. **STOP. Do not proceed to /review.** See decision gate Outcome C.
- Step 4a.1/4a.2 present but 4a.3 absent or S1.2 C2 missing → Partial fire. Record, proceed but flag.

### 1e. CPF-TRACE capture

Extract the `<!-- CPF-TRACE ... -->` block from the end of `definition.md` and paste here:

```
<!-- CPF-TRACE
[paste exact block from artefact]
-->
```

**Extracted scores:**

| Constraint | Definition score | vs Run 2 (Sonnet, no Step 4a) |
|------------|-----------------|-------------------------------|
| C1 | ___.__ | run 2 was 0.75 |
| **C2** | ___.__ | **run 2 was 0.35 — this is the primary measurement** |
| C3 | ___.__ | run 2 was 1.00 |
| C4 | ___.__ | run 2 was 0.60 |
| C5 | ___.__ | run 2 was 0.75 |
| Regulated avg (C2+C3)/2 | ___.__ | run 2 was 0.675 |

**Gate check:**
- Regulated avg ≥ 0.80 → proceed to /review ✅
- Regulated avg 0.50–0.79 → proceed with flag; note FAIL likely at definition
- Regulated avg < 0.50 → **STOP. Step 4a probably did not fire correctly. Investigate before continuing.**

---

## Stage 2 — /review (claude-haiku-4-5)

### 2a. Pre-stage verification

- [ ] Model confirmed still claude-haiku-4-5 (re-verify if any model switch occurred)
- [ ] `config-C-run-3/definition.md` exists and is complete
- [ ] Stage 1 definition score C2 ≥ 0.50 (gate to proceed)

### 2b. Prompt to send

```
/review

[PASTE THE FULL CONTENT OF config-C-run-3/definition.md HERE]

---
EVAL MODE — Config C run 3, EXP-003-pipeline-eval.

After completing the review, append a CPF-TRACE block:

<!-- CPF-TRACE
stage: review
model: [model name]
C2-finding: [HIGH | MEDIUM | LOW | NONE] | [if any finding, state which story and what it flagged; if NONE, confirm C2 is propagated]
C3-finding: [HIGH | MEDIUM | LOW | NONE] | [same]
C2: [0.00-1.00] | [evidence]
C3: [0.00-1.00] | [evidence]
regulated-chain-running: [min of definition and review C2 scores; min of definition and review C3 scores; then avg]
-->
```

### 2c. Save artefact

Save to: `workspace/experiments/EXP-003-pipeline-eval/runs/config-C-run-3/review.md`

- [ ] Artefact saved

### 2d. CPF-TRACE capture

```
<!-- CPF-TRACE
[paste exact block from artefact]
-->
```

**Key check:** Does the review raise a HIGH finding for C2?
- NO HIGH for C2 → Step 4a propagation confirmed through definition; review does not need to recover
- HIGH for C2 → C2 was still weak at definition even with Step 4a; review is compensating

C2 review finding: `_______`
C3 review finding: `_______`

---

## Stage 3 — /test-plan (claude-haiku-4-5)

### 3a. Pre-stage verification

- [ ] Model confirmed still claude-haiku-4-5
- [ ] `config-C-run-3/review.md` exists

### 3b. Prompt to send

```
/test-plan

Discovery artefact: [paste config-C-run-2/discovery.md]

Definition artefact: [paste config-C-run-3/definition.md]

Review findings: [paste config-C-run-3/review.md]

---
EVAL MODE — Config C run 3, EXP-003-pipeline-eval.

After completing the test plan, append a CPF-TRACE block:

<!-- CPF-TRACE
stage: test-plan
model: [model name]
C2-gate-tests: [list every test that asserts a QSA gate or PCI DSS compliance check — include story ID and test ID]
C2-stories-covered: [list which story IDs have a QSA gate test in this plan]
C3-retention-tests: [list every test that asserts AML/CFT 5-year retention]
C5-investigation-test: [yes | no] | [is there a test for the replication gap verification/investigation]
C2: [0.00-1.00]
C3: [0.00-1.00]
regulated-chain-running: [avg of C2 and C3 chain mins through this stage]
-->
```

### 3c. Save artefact

Save to: `workspace/experiments/EXP-003-pipeline-eval/runs/config-C-run-3/test-plan.md`

- [ ] Artefact saved

### 3d. CPF-TRACE capture

```
<!-- CPF-TRACE
[paste exact block from artefact]
-->
```

**Key checks:**
- C2 gate test present for S1.2? [ ] YES / [ ] NO ← Run 2 had no gate test for S1.2
- C2 gate test present for S2.2? [ ] YES / [ ] NO ← Run 2 had T2.2.2 for S2.2 only
- C3 retention test with cross-failover check? [ ] YES / [ ] NO

---

## Stage 4 — /definition-of-ready (claude-haiku-4-5)

### 4a. Pre-stage verification

- [ ] Model confirmed still claude-haiku-4-5
- [ ] All preceding artefacts saved

### 4b. Prompt to send

```
/definition-of-ready

Discovery: [paste config-C-run-2/discovery.md]
Definition: [paste config-C-run-3/definition.md]
Review: [paste config-C-run-3/review.md]
Test plan: [paste config-C-run-3/test-plan.md]

---
EVAL MODE — Config C run 3, EXP-003-pipeline-eval.

After completing the DoR output, append a CPF-TRACE block:

<!-- CPF-TRACE
stage: dor
model: [model name]
C2-hard-gate: [yes | no] | [which story contracts name PCI DSS as HARD GATE or BLOCKED prerequisite]
C3-hard-gate: [yes | no] | [which story contracts name AML/CFT retention as HARD GATE or prerequisite]
C5-contract: [yes | no] | [is the AML replication gap assumption closed or named as a prerequisite in any contract]
C1: [0.00-1.00]
C2: [0.00-1.00]
C3: [0.00-1.00]
C4: [0.00-1.00]
C5: [0.00-1.00]
final-stage-CPF-avg: [avg C1-C5]
regulated-final-CPF: [avg C2+C3]
chain-CPF-C2: [min of C2 across discovery+definition+review+testplan+dor]
chain-CPF-C3: [min of C3 across same]
chain-regulated-CPF: [avg of chain C2 and chain C3]
-->
```

### 4c. Save artefact

Save to: `workspace/experiments/EXP-003-pipeline-eval/runs/config-C-run-3/dor.md`

- [ ] Artefact saved

### 4d. CPF-TRACE capture

```
<!-- CPF-TRACE
[paste exact block from artefact]
-->
```

---

## Section 5 — CPF Scorecard (complete after all stages)

**Instruction:** Fill in each cell from the CPF-TRACE blocks above. Chain score = minimum across all stages for that constraint.

| Stage | C1 | C2 ← primary | C3 | C4 | C5 |
|-------|----|--------------|----|----|----|
| Discovery (reused, C-2) | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| Definition | | | | | |
| Review | | | | | |
| Test-plan | | | | | |
| DoR | | | | | |
| **Chain (min)** | | | | | |

**Summary:**

| Scope | Constraints | Chain avg | Threshold | Verdict |
|-------|-------------|-----------|-----------|---------|
| General (all 5) | C1–C5 | (C1+C2+C3+C4+C5) / 5 = ___ | 0.80 | |
| Regulated (C2+C3 only) | C2, C3 | (C2+C3) / 2 = ___ | 0.80 | |

**Comparison with run 2:**
- Run 2 chain CPF: 0.68 → Run 3: ___
- Run 2 regulated CPF: 0.675 → Run 3: ___
- Run 2 C2 definition: 0.35 → Run 3 C2 definition: ___

---

## Section 6 — Decision Gate

### Outcome A — Regulated CPF ≥ 0.80 → PASS

**Required actions:**

1. Update manifest `config-C-run-3` row: fill in date, CPF scores, verdict **PASS**

2. Update `workspace/proposals/routing-policy-framework.md`:
   - Change caveat heading from:
     `### /definition — regulated story caveat (ACTIVE until EXP-003 Config C run 3 completes)`
     to:
     `### /definition — regulated story caveat (RESOLVED — EXP-003 Config C run 3 passed {date}, regulated CPF {score})`
   - Replace override block with: "EXP-003 Config C run 3 produced regulated CPF {score} ≥ 0.80. Step 4a propagation confirmed for Haiku at /definition. Regulated story Sonnet override is LIFTED. Haiku routing at /definition applies unconditionally, including regulated-domain stories."
   - Update routing table `/definition` row: add `(regulated stories confirmed: EXP-003 Config C run 3, {date})` to the Evidence basis cell
   - Correct attribution error: change "Haiku adopted a vertical-slice decomposition strategy" to "Sonnet (in Config C run 2) adopted a vertical-slice decomposition strategy" in the historical finding text

3. Update `workspace/state.json` — record EXP-003 as complete

4. Commit: `chore: EXP-003 Config C run 3 PASS — regulated CPF {score}, Haiku definition routing confirmed for regulated stories`

5. Record in `workspace/learnings.md` under signal-type: assumption-validated

---

### Outcome B — Regulated CPF 0.69–0.79 → Partial improvement, FAIL

Run 2 regulated CPF was 0.675. This band indicates Step 4a improved things but not to threshold.

**Required actions:**

1. Update manifest with scores and verdict: **PARTIAL IMPROVEMENT / FAIL**
2. Caveat stays ACTIVE — do not modify routing policy
3. Identify which constraint is still failing:
   - C2 chain still < 0.80: Step 4a fired but trigger table missed a story. Identify the story by checking which story ACs lack C2 in Architecture Constraints.
   - C3 chain < 0.80: Unexpected — C3 was 1.00 in run 2. Record finding — Haiku may have decomposed differently.
4. Diagnosis question: did Haiku choose vertical-slice or risk-first? Record slicing-strategy from definition CPF-TRACE.
5. Create investigation note in manifest Findings section.

---

### Outcome C — Regulated CPF ≤ 0.68 → No improvement, FAIL

Run 2 regulated CPF was 0.675. Anything at or below this with Haiku means Step 4a did not improve outcomes.

**First check: did Step 4a actually fire?**

- Go back to Section 1d — was the `## Step 4a` heading present in `definition.md`?
- If NO: root cause is Step 4a not executed. Possible reasons: SKILL.md not loaded by model, context too long, model skipped the step. Re-run with explicit Step 4a prompt injection in the /definition prompt.
- If YES but C2 still ≤ 0.35: Step 4a fired but Haiku cannot propagate C2 reliably. This is a model-capability finding for Haiku at definition.

**Required actions:**

1. Update manifest with FAIL verdict and root cause (Step 4a absent vs Step 4a present but ineffective)
2. Caveat stays ACTIVE
3. If Step 4a was present but ineffective: harden caveat text — "Step 4a does not reliably prevent C2 drop with Haiku; regulated definition routing is Sonnet-only until further evidence"
4. Commit manifest update only — do not touch routing policy

---

## Section 7 — Run metadata

| Field | Value |
|-------|-------|
| Run ID | config-C-run-3 |
| Date | 2026-05-16 |
| Operator | |
| Discovery source | config-C-run-2/discovery.md (reused; Sonnet; CPF 1.00) |
| /definition model | claude-haiku-4-5 (confirm before running) |
| /review model | claude-haiku-4-5 |
| /test-plan model | claude-haiku-4-5 |
| /dor model | claude-haiku-4-5 |
| Judge model | claude-sonnet-4-6 (for CPF scoring evaluation) |
| Step 4a in definition SKILL.md | Yes (commit 4dae4e3) |
| Fix-val baseline | fix-val-def-f6f7-r1: C2 definition = 1.00 (Sonnet + Step 4a) |
| Prior run C2 definition score | 0.35 (config-C-run-2, Sonnet, no Step 4a) |
| Regulated CPF target | ≥ 0.80 |
| Wall-clock time started | |
| Wall-clock time completed | |
| Stage turn counts | def: ___ / review: ___ / tp: ___ / dor: ___ |

**Files to create during this run:**

| File | Status |
|------|--------|
| `runs/config-C-run-3/session-journal.md` | ✅ exists |
| `runs/config-C-run-3/definition.md` | [ ] pending Stage 1 |
| `runs/config-C-run-3/review.md` | [ ] pending Stage 2 |
| `runs/config-C-run-3/test-plan.md` | [ ] pending Stage 3 |
| `runs/config-C-run-3/dor.md` | [ ] pending Stage 4 |
| `runs/config-C-run-3/cpf-scores.md` | [ ] pending Section 5 |

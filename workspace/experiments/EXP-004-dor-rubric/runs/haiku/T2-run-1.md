# EXP-004 Run: T2 (DR failover activation) — Haiku Trial 1

**Run metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T2 (DR failover activation — unresolved HIGH finding)
- Model: claude-haiku-4-5
- Trial: 1
- Date: 2026-05-21
- Layer: 1 (VS Code model selector, semi-manual)
- Mode: evaluation

---

## /definition-of-ready evaluation — ham.12

### Step 1 - Confirm the story

**Story loaded:** DR failover activation sequence and CDE scope gate (ham.12)
**Feature:** Hamilton Core Banking DR Failover
**Review:** 3 findings (2 MEDIUM acknowledged, 1 HIGH open)
**Test plan:** 5 tests (T1–T5) covering all 4 ACs
**Verification script:** Referenced as artefacts/2026-04-15-hamilton-dr-failover/verification-scripts/ham.12-verification.md

Running definition-of-ready check on this story.

---

### Step 2 — Contract Proposal

**Contract Proposal — DR failover activation sequence and CDE scope gate**

**What will be built:**
- Runbook at `docs/dr-activation-runbook.md` documenting manual steps for DR failover
- Automation script at `scripts/activate-dr-failover.sh` that:
  - Checks replication lag against 30-second threshold
  - Runs pre-failover health check suite (ham.10)
  - Displays structured activation plan with per-step duration estimates
  - Prompts operator for confirmation
  - Prompts operator for QSA acceptance reference (CDE scope expansion gate)
  - Sets Hamilton payment service to `mode: active`
  - Writes timestamped activation event to `logs/dr-activation.jsonl`

**What will NOT be built:**
- Automated QSA notification — manual reference entry only
- Failback automation (Hamilton → Auckland re-promotion) — separate story ham.13
- Load balancer reconfiguration — infrastructure team responsibility
- QSA reference verification against actual assessment documents — procedural gate only (QSA reference is free text)

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (lag > 30s → abort) | Unit test: mock replication lag metrics, invoke script, verify exit code 1 and log message | unit |
| AC2 (lag ≤ 30s + health checks green → activation plan) | Unit test: mock lag ≤ 30s + health checks pass, invoke script, verify plan output with durations | unit |
| AC3 (confirmed plan → mode active + activation event) | Unit test: mock operator confirmation, invoke script, verify service mode set and event logged | unit |
| AC4 (QSA gate) | Unit test: empty reference → error + exit; non-blank reference → proceed | unit |

**Assumptions:**
- Replication lag metric is available from replication monitor (ham.8)
- Health check suite (ham.10) returns a boolean pass/fail result
- Operator can interactively confirm the activation plan via stdin prompt
- QSA reference is a free-text string (no external validation)
- The activation event JSON structure is defined by the story artefact

**Estimated touch points:**
Files: `scripts/activate-dr-failover.sh` (new), `docs/dr-activation-runbook.md` (new)
Services: Hamilton payment processing service
APIs: Replication monitor metrics, health check suite

---

### Step 3 — Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs.

The contract correctly maps:
- AC1 (lag check) to exit code and log verification
- AC2 (activation plan) to script output with durations
- AC3 (service activation) to mode change and event logging
- AC4 (QSA gate) to reference validation and script flow

No mismatches found. Proceeding to hard blocks.

---

## Hard blocks checklist

### H1 — User story format

✅ **PASS**

Story is in As / Want / So format with named persona:
- As: "Hamilton platform operations team"
- Want: "documented and automated failover activation sequence that promotes Hamilton from passive replication target to active payment processor"
- So that: "platform can meet its 4-hour RTO window and resume live transaction processing when Auckland datacenter is unavailable"

---

### H2 — At least 3 ACs in Given / When / Then format

✅ **PASS**

4 acceptance criteria all in Given / When / Then format:
- AC1: "Given the DR activation script is invoked, when replication lag exceeds 30 seconds, then..."
- AC2: "Given the DR activation script is invoked and replication lag is ≤ 30 seconds, when all pre-failover health checks pass, then..."
- AC3: "Given the activation plan is confirmed by the operator, when the script executes the activation sequence, then..."
- AC4: "Given the operator reaches the CDE expansion step, when the script prompts for the QSA acceptance reference, then..."

---

### H3 — Every AC has at least one test in the test plan

✅ **PASS**

Test plan coverage:
- AC1: T1 (lag > 30s triggers abort with exit code 1 and log message)
- AC2: T2 (lag ≤ 30s + all health checks green → activation plan printed with per-step durations)
- AC3: T3 (confirmed activation plan → service mode set to `active`; activation event written to log)
- AC4: T4 (empty QSA reference → script exits with correct error) + T5 (non-blank QSA reference → script proceeds)

All 4 ACs have test coverage.

---

### H4 — Out-of-scope section is populated

✅ **PASS**

Out of Scope section contains 3 explicit items:
- Automated QSA notification — manual reference entry only
- Failback automation
- Load balancer reconfiguration

---

### H5 — Benefit linkage references a named metric

✅ **PASS**

"Metric moved: M1 (RTO ≤ 4 hours for DR activation) — primary delivery mechanism."

Named metric: M1

---

### H6 — Complexity is rated

✅ **PASS**

"Complexity: 2 (CDE gate interaction well understood; timing/RTO assertions require care)"

---

### H7 — No unresolved HIGH findings from the review report

❌ **FAIL**

**Issue:** The review report contains 1 unresolved HIGH finding.

**Review report findings:**

| Finding | Category | Severity | Status |
|---------|---------|---------|--------|
| R1 | B — AC completeness | MEDIUM | Open — acknowledged in /decisions as post-MVP |
| R2 | D — Implementation approach | MEDIUM | Open — deferred to configuration story ham.14 |
| R3 | E — Architecture | HIGH | **Open** |

**Finding R3 details:**
- Title: "Architecture consideration — CDE scope expansion confirmation"
- Severity: **HIGH**
- Issue: AC4 accepts free-text QSA reference string with no verification that the string corresponds to an actual QSA assessment document. A malicious or careless operator could type any string and proceed.
- Resolution requirement: Either (a) add explicit RISK-ACCEPT in /decisions, or (b) add verification step to story
- **RESOLUTION STATUS: Open** — neither option has been implemented

**H7 requirement:** H7 blocks sign-off when any HIGH finding remains unresolved.

**Status:** R3 is HIGH and RESOLUTION STATUS is explicitly "Open". No RISK-ACCEPT entry exists in /decisions, and no verification AC has been added to the story.

**H7 is triggered — sign-off blocked.**

---

## Verdict

❌ **BLOCKED — 1 hard block failed**

| Block | Status | Issue |
|-------|--------|-------|
| H1 — Story format | ✅ PASS | Correct As/Want/So with persona |
| H2 — AC format | ✅ PASS | 4 ACs all in Given/When/Then format |
| H3 — Test coverage | ✅ PASS | All 4 ACs covered by tests |
| H4 — Out of scope | ✅ PASS | 3 explicit out-of-scope items |
| H5 — Benefit linkage | ✅ PASS | M1 (RTO ≤ 4 hours) referenced |
| H6 — Complexity | ✅ PASS | Rated: 2 |
| H7 — HIGH findings | ❌ **FAIL** | 1 unresolved HIGH finding (R3) |

**H7 is a hard block.** Sign-off cannot proceed until resolved.

**Next step:** Either:
1. Add a RISK-ACCEPT entry to /decisions documenting the residual risk (free-text reference vulnerability) and the compensating control (procedural gate + operator awareness)
2. OR add AC5 to the story requiring technical verification of the QSA reference string

Then re-run /definition-of-ready.

Reply: done — and I'll re-run the check

---

## Evaluation summary

**Verdict:** BLOCKED
**Primary failure:** H7 (unresolved HIGH review finding)
**Categorical fail triggered:** No
**Process compliance:** ✅ Correct — contract proposal → contract review → hard blocks → stop at H7 (first failure encountered)
**Output quality:** Complete diagnostic with specific fix options


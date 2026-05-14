# EXP-004 Run: T2 (DR failover activation) — Sonnet Trial 1

**Run metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T2 (DR failover activation — unresolved HIGH review finding)
- Model: claude-sonnet-4-6
- Trial: 1
- Date: 2026-05-14
- Layer: 1 (VS Code model selector, semi-manual)
- Mode: evaluation

---

## /definition-of-ready evaluation — ham.12

### Step 1 — Confirm the story

**Story loaded:** DR failover activation sequence and CDE scope gate (ham.12)
**Feature:** Hamilton Core Banking DR Failover
**Review:** 3 findings (R1 MEDIUM acknowledged, R2 MEDIUM deferred, R3 HIGH open)
**Test plan:** 5 tests (T1–T5) covering all 4 ACs — no gaps
**Verification script:** artefacts/2026-04-15-hamilton-dr-failover/verification-scripts/ham.12-verification.md

Running definition-of-ready check on this story.

---

### Step 2 — Contract Proposal

**Contract Proposal — DR failover activation sequence and CDE scope gate**

**What will be built:**
- Runbook `docs/dr-activation-runbook.md` — documented manual failover activation steps with per-step RTO estimates
- Automation script `scripts/activate-dr-failover.sh` that:
  - Reads `replication_lag_seconds` metric from ham.8 replication monitor
  - Aborts with exit code 1 and log message if lag > 30 seconds
  - Invokes ham.10 pre-failover health check suite if lag ≤ 30 seconds
  - Outputs a structured activation plan with per-step durations and cumulative RTO impact
  - Prompts operator for interactive confirmation
  - Prompts for QSA acceptance reference string; aborts with error if empty or whitespace-only
  - Sets Hamilton payment processing service to `mode: active`
  - Writes timestamped activation event to `logs/dr-activation.jsonl`

**What will NOT be built:**
- Automated QSA notification — AC4 gate is manual reference entry only
- Failback automation (Hamilton → Auckland re-promotion) — separate story ham.13
- Load balancer reconfiguration — handled by infrastructure team

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---|---|
| AC1 (lag > 30s → abort exit code 1 + log) | Unit test: mock replication lag metric > 30s, invoke script, assert exit code 1 and log message | unit |
| AC2 (lag ≤ 30s + health checks green → activation plan) | Unit test: mock lag ≤ 30s and health checks pass, assert structured plan output with durations | unit |
| AC3 (confirmed plan → mode active + event logged) | Unit test: mock operator confirmation, assert service mode set and event written to log | unit |
| AC4 (empty QSA reference → abort; non-blank → proceed) | Unit test: two cases — empty string assertion and non-blank string assertion | unit |

**Assumptions:**
- Replication lag metric accessible programmatically from ham.8 monitor output
- ham.10 health check suite returns boolean green/red result
- `mode: active` field settable on Hamilton payment processing service via config or API call
- Interactive prompt can be driven via stdin in test environment

**Estimated touch points:**
Files: `scripts/activate-dr-failover.sh` (new), `docs/dr-activation-runbook.md` (new), `logs/dr-activation.jsonl` (runtime)
Services: Hamilton payment processing service, replication monitor (ham.8), health check suite (ham.10)
APIs: Replication lag metrics, health check interface

---

### Step 3 — Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs.

All AC verification approaches are concrete and testable. No contract mismatches.

---

## Hard blocks checklist

### H1 — As/Want/So format with named persona

✅ **PASS**
"As a **Hamilton platform operations team**, I want... So that..."
Named persona present. Correct format.

---

### H2 — At least 3 ACs in Given/When/Then format

✅ **PASS**
AC1, AC2, AC3, AC4 — all 4 written in Given/When/Then format. Count: 4. Requirement: ≥ 3.

---

### H3 — Every AC has at least one test in the test plan

✅ **PASS**
- AC1 → T1 ✅
- AC2 → T2 ✅
- AC3 → T3 ✅
- AC4 → T4, T5 ✅

---

### H4 — Out-of-scope section populated

✅ **PASS**
3 explicit out-of-scope items: automated QSA notification, failback automation, load balancer reconfiguration.

---

### H5 — Benefit linkage references a named metric

✅ **PASS**
"Metric moved: M1 (RTO ≤ 4 hours for DR activation)"

---

### H6 — Complexity is rated

✅ **PASS**
"Complexity: 2 (CDE gate interaction well understood; timing/RTO assertions require care)"

---

### H7 — No unresolved HIGH findings from the review report

❌ **FAIL**

Scanning all review findings:

| Finding | Severity | Status |
|---------|---------|--------|
| R1: QSA reference stored only in activation log; should also write to `logs/qsa-gates.jsonl` | MEDIUM | Open — acknowledged in /decisions as post-MVP |
| R2: 30-second lag threshold hardcoded; should be configurable via env var | MEDIUM | Open — deferred to ham.14 |
| R3: Architecture consideration — CDE scope expansion confirmation: AC4 accepts a free-text QSA reference with no verification it corresponds to an actual QSA assessment document. Current design provides a procedural gate only. **RESOLUTION STATUS: Open.** | **HIGH** | **Open** |

**Finding R3 is rated HIGH. RESOLUTION STATUS is Open.**

H7 requires all HIGH findings to be resolved before sign-off. R3 has neither a RISK-ACCEPT in /decisions nor a remediation AC added to the story.

**H7 is triggered — sign-off blocked.**

---

## Verdict

❌ **BLOCKED — 1 hard block failed**

| Block | Status | Issue |
|-------|--------|-------|
| H1–H6 | ✅ PASS | Story format, ACs, tests, scope, benefit, complexity all correct |
| H7 — HIGH findings | ❌ **FAIL** | R3 is HIGH severity, RESOLUTION STATUS: Open — no RISK-ACCEPT in /decisions and no remediation AC |

**Fix:** Either:
- (a) Add a RISK-ACCEPT entry to /decisions for R3, documenting the residual risk (free-text QSA reference can be spoofed; compensating control: procedure requires conscious operator entry and activation event is audit-logged), OR
- (b) Add AC5 to the story requiring technical verification of the QSA reference string against a known document identifier format

Then re-run /definition-of-ready.
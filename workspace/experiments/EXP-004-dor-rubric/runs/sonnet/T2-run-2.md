# EXP-004 Run: T2 (DR failover activation) — Sonnet Trial 2

**Run metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T2 (DR failover activation — unresolved HIGH review finding)
- Model: claude-sonnet-4-6
- Trial: 2
- Date: 2026-05-14
- Layer: 1 (VS Code model selector, semi-manual)
- Mode: evaluation

---

## /definition-of-ready evaluation — ham.12

### Step 1 — Confirm the story

**Story loaded:** DR failover activation sequence and CDE scope gate (ham.12)
**Feature:** Hamilton Core Banking DR Failover
**Review:** 3 findings — R1 MEDIUM acknowledged, R2 MEDIUM deferred, R3 HIGH open
**Test plan:** T1–T5 covering all 4 ACs; no uncovered ACs
**Verification script:** artefacts/2026-04-15-hamilton-dr-failover/verification-scripts/ham.12-verification.md

---

### Step 2 — Contract Proposal

**Contract Proposal — DR failover activation sequence and CDE scope gate (ham.12)**

**What will be built:**
- `scripts/activate-dr-failover.sh` — activation automation script:
  - Queries ham.8 replication monitor for current `replication_lag_seconds`
  - If lag > 30 seconds: exits with code 1 and writes abort log entry
  - If lag ≤ 30 seconds: invokes ham.10 pre-failover health check suite
  - Outputs structured activation plan showing per-step durations and cumulative RTO
  - Prompts for interactive operator confirmation before executing
  - Prompts for QSA (Qualified Security Assessor) acceptance reference string; aborts if empty or whitespace
  - Sets Hamilton payment processing to `mode: active`
  - Appends timestamped activation event to `logs/dr-activation.jsonl`
- `docs/dr-activation-runbook.md` — human-readable runbook with annotated per-step instructions

**What will NOT be built:**
- Automated QSA notification or document verification
- Failback to primary Auckland (ham.13)
- Load balancer reconfiguration (infrastructure team scope)

**AC → test mapping:**

| AC | Test coverage |
|----|---|
| AC1 (lag > 30s → abort exit code 1 + log) | T1 |
| AC2 (lag ≤ 30s + health checks green → structured activation plan) | T2 |
| AC3 (confirmed plan → mode active + event logged) | T3 |
| AC4 (empty QSA reference → abort; non-blank → proceed) | T4, T5 |

**Assumptions:**
- Replication lag metric queryable programmatically from ham.8
- ham.10 health check suite returns a boolean result
- Interactive prompts testable via stdin injection in test environment

**Touch points:**
- `scripts/activate-dr-failover.sh` (new)
- `docs/dr-activation-runbook.md` (new)
- `logs/dr-activation.jsonl` (runtime)

---

### Step 3 — Contract Review

✅ **Contract review passed** — all 4 ACs are mapped. Proposed implementation directly satisfies AC1 (lag guard → abort), AC2 (health check → plan), AC3 (confirmation → mode + log), AC4 (QSA reference gate). No mismatches.

---

## Hard blocks checklist

### H1 — As/Want/So format with named persona

✅ **PASS**
Named persona: "Hamilton platform operations team". Correct As/Want/So format.

---

### H2 — At least 3 ACs in Given/When/Then format

✅ **PASS**
AC1, AC2, AC3, AC4 — all 4 ACs in Given/When/Then format. Count: 4 ≥ 3.

---

### H3 — Every AC has at least one test in the test plan

✅ **PASS**
AC1 → T1. AC2 → T2. AC3 → T3. AC4 → T4, T5. All covered.

---

### H4 — Out-of-scope section populated

✅ **PASS**
Three named out-of-scope items: automated QSA notification, failback automation, load balancer reconfiguration.

---

### H5 — Benefit linkage references a named metric

✅ **PASS**
"Metric moved: M1 (RTO ≤ 4 hours for DR activation)."

---

### H6 — Complexity is rated

✅ **PASS**
"Complexity: 2."

---

### H7 — No unresolved HIGH findings from the review report

❌ **FAIL**

Reading all review findings in full:

| Finding | Category | Severity | Status |
|---------|---------|---------|--------|
| R1: QSA reference should also be written to `logs/qsa-gates.jsonl` | Implementation | MEDIUM | Open — acknowledged as post-MVP in /decisions |
| R2: 30-second lag threshold hardcoded; should be configurable via env var | Implementation | MEDIUM | Open — deferred to ham.14 |
| R3: **Architecture consideration — CDE scope expansion confirmation:** AC4 accepts a QSA reference as a free-text string with no technical verification that it corresponds to an actual QSA assessment document | Architecture | **HIGH** | **Open** |

**R3 is a HIGH-severity finding. Resolution status: Open.**

There is no RISK-ACCEPT entry in /decisions covering R3, and no remediation AC (e.g. an AC5 requiring format validation or lookup of the reference string) has been added to the story.

H7 requires zero unresolved HIGH findings. R3 is HIGH and unresolved. H7 fails.

---

## Verdict

❌ **BLOCKED — 1 hard block failed**

| Block | Status | Detail |
|-------|--------|--------|
| H1–H6 | ✅ PASS | Story format, ACs, test coverage, scope, benefit, complexity all correct |
| H7 — HIGH findings | ❌ **FAIL** | R3 is HIGH severity, status Open; no RISK-ACCEPT and no remediation AC |

**Note on R3 presentation:** R3 is titled "Architecture consideration" — an advisory-sounding heading. The category field reads "E — Architecture" and severity is HIGH. Regardless of the title, a HIGH-severity finding with Open status triggers H7. The advisory tone of the heading does not change the severity classification.

**Fix options:**
- (a) Add a RISK-ACCEPT entry to /decisions for R3 documenting the residual risk and accepted compensating control (operator procedure + audit log). Then update R3 status to "Acknowledged — RISK-ACCEPT logged."
- (b) Add AC5 requiring the activation script to validate the QSA reference string against a known format (e.g. regex for a document reference pattern, or lookup against a known QSA reference registry).

Re-run /definition-of-ready after resolving R3.
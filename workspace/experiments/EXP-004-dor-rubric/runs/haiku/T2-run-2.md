# EXP-004 Run: T2 (DR failover activation) — Haiku Trial 2

**Run metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T2 (DR failover activation — unresolved HIGH finding)
- Model: claude-haiku-4-5
- Trial: 2
- Date: 2026-05-14
- Layer: 1 (VS Code model selector, semi-manual)
- Mode: evaluation

---

## /definition-of-ready evaluation — ham.12

### Step 1 - Confirm the story

**Story loaded:** DR failover activation sequence and CDE scope gate (ham.12)
**Feature:** Hamilton Core Banking DR Failover
**Review:** 3 findings (2 MEDIUM acknowledged/deferred, 1 HIGH open)
**Test plan:** 5 tests (T1–T5) covering all 4 ACs
**Verification script:** Referenced as artefacts/2026-04-15-hamilton-dr-failover/verification-scripts/ham.12-verification.md

Running definition-of-ready check on this story.

---

### Step 2 — Contract Proposal

**Contract Proposal — DR failover activation sequence and CDE scope gate**

**What will be built:**
- Runbook at `docs/dr-activation-runbook.md` — manual failover activation steps
- Automation script at `scripts/activate-dr-failover.sh` that:
  - Checks replication lag metric (from ham.8 replication monitor) against 30-second threshold
  - Invokes pre-failover health check suite from ham.10
  - Constructs and displays activation plan with per-step estimated durations and RTO impact
  - Prompts operator for plan confirmation
  - Prompts operator for QSA acceptance reference (CDE expansion gate per AC4)
  - Sets Hamilton payment service to `mode: active`
  - Writes timestamped activation event to `logs/dr-activation.jsonl`

**What will NOT be built:**
- Automated QSA notification — free-text reference entry only
- Failback automation (re-promotion Hamilton → Auckland) — separate story ham.13
- Load balancer reconfiguration — infrastructure team responsibility
- Technical verification of QSA reference string — procedural gate only

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---|---|
| AC1 (lag > 30s → abort) | Unit test: mock replication lag > 30s, invoke script, verify exit code 1 and abort log message | unit |
| AC2 (lag ≤ 30s + health green → plan) | Unit test: mock lag ≤ 30s + health checks pass, invoke script, verify activation plan output with durations | unit |
| AC3 (confirmed plan → mode active + event) | Unit test: mock operator confirmation, invoke script, verify service mode set and event logged | unit |
| AC4 (QSA gate) | Unit test: empty QSA reference → error exit; non-blank reference → proceed | unit |

**Assumptions:**
- Replication lag metric is exposed from ham.8 replication monitor
- Pre-failover health check suite from ham.10 returns boolean pass/fail
- Operator can provide interactive confirmation via stdin prompt
- QSA reference is free-text string (no external system lookup required)
- Activation event JSON structure is defined in story artefact

**Estimated touch points:**
Files: `scripts/activate-dr-failover.sh` (new), `docs/dr-activation-runbook.md` (new)
Services: Hamilton payment processing service, replication monitor, health check suite
APIs: Replication lag metrics, health check interface

---

### Step 3 — Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs.

All AC verification approaches are concrete and testable. No contradictions with story ACs.

---

## Hard blocks checklist

### H1–H6 — Story format, ACs, test coverage, scope, benefit, complexity

✅ **H1–H6 all PASS**
- H1: Correct As/Want/So with persona "Hamilton platform operations team"
- H2: 4 ACs all in Given/When/Then format
- H3: All 4 ACs covered by T1–T5 tests
- H4: 3 explicit out-of-scope items (automated QSA notification, failback, load balancer config)
- H5: M1 (RTO ≤ 4 hours for DR activation) named
- H6: Complexity rated as 2

---

### H7 — No unresolved HIGH findings from the review report

❌ **FAIL**

**Review findings:**

| Finding | Category | Severity | Status |
|---------|---------|---------|--------|
| R1 | B — AC completeness | MEDIUM | Open — acknowledged in /decisions as post-MVP |
| R2 | D — Implementation approach | MEDIUM | Open — deferred to configuration story ham.14 |
| R3 | E — Architecture | HIGH | **Open** |

**Finding R3 — Architecture consideration — CDE scope expansion confirmation:**
- Issue: AC4 accepts a free-text QSA reference with no verification that the reference corresponds to an actual QSA assessment document. A malicious or careless operator could type any string (e.g., "done", "xyz") and proceed to live transaction mode.
- Current design: procedural gate (operator must consciously enter a reference) with no technical enforcement.
- Resolution requirement: Either (a) add explicit RISK-ACCEPT in /decisions documenting residual risk + compensating control, or (b) add a verification AC.
- **RESOLUTION STATUS: Open** — neither resolution path has been implemented.

**H7 requirement:** H7 blocks sign-off when any HIGH review finding is unresolved. R3 is HIGH, Status is Open, no RISK-ACCEPT recorded.

**H7 is triggered — sign-off blocked.**

---

## Verdict

❌ **BLOCKED — 1 hard block failed**

| Block | Status | Issue |
|-------|--------|-------|
| H1–H6 | ✅ PASS | Story format, ACs, tests, scope, benefit, complexity all correct |
| H7 — HIGH findings | ❌ **FAIL** | 1 unresolved HIGH finding (R3) — QSA reference verification gap |

**H7 is a hard block.**

**Next step:** Either add a RISK-ACCEPT entry to /decisions for R3 (documenting the residual risk: "free-text QSA reference can be spoofed; compensating control: procedure requires conscious operator entry + audit log review"), or add AC5 to the story requiring technical verification of the QSA reference against a known document set. Then re-run /definition-of-ready.

---

## Evaluation summary

**Verdict:** BLOCKED
**Primary failure:** H7 (unresolved HIGH review finding R3)
**Categorical fail triggered:** No
**Process compliance:** ✅ Correct — H1–H6 all evaluated; H7 checked and failed; process stopped
**Output quality:** Complete review scan; R3 identified as HIGH despite "Architecture consideration" title; resolution paths explicitly named
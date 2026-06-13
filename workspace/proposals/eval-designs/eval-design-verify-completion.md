# Proposed EVAL.md — /verify-completion skill
**Skill:** `/verify-completion`
**Status:** PROPOSED — no EVAL.md exists; this document proposes the first calibration sweep design
**Purpose:** Design the evaluation rubric for the verify-completion HYBRID skill (binary gates + scored rubric), to be validated by EXP-038.
**Generated:** 2026-06-13

---

## 1. Pipeline context

**Upstream inputs:** A completed implementation (test suite passing), the story's AC verification script, and the test plan.
**What this skill does:** Runs the AC verification script against the implementation; reads the output; verifies each AC is satisfied by specific test evidence; asserts the test suite is passing; then claims completion or flags incomplete. The Iron Law: "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE."
**Downstream consumer:** `/branch-complete` — reads `verifyStatus = "passed"` and `acVerified` count before allowing PR creation. A false positive verify-completion (claiming PASSED when ACs are not satisfied) corrupts the pipeline's trust signal.
**What constitutes a valid output:** A verification report with per-AC status (PASS/FAIL/MISSING_EVIDENCE), test suite status (N passing), and a final verdict (PASSED/FAILED). The report must cite specific test names or verification output — not summarise.

---

## 2. Structural gates (VG1–VG5 — all must pass)

Binary gates. A PASSED verdict requires all five gates. Any gate failure → `verifyStatus = "failed"`.

**VG1 — Fresh verification run present**
Verification output in the report must derive from a test run that occurred in the current session. Any claim based solely on prior session output fails this gate. The report must include raw test runner output (or an excerpt quoting specific test names and pass/fail status).

**VG2 — All ACs explicitly addressed**
Every AC in the story must appear in the verification report with an explicit PASS or FAIL status. A verification report that addresses 2 of 3 ACs and does not mention the third fails this gate.

**VG3 — Test count matches test plan**
The reported passing test count must match the test plan's declared test count. If the test plan declares 8 tests and the verification report claims 6 passing, this gate fails — either tests are missing or the report is stale.

**VG4 — No AC marked PASS without cited evidence**
Each AC marked PASS must cite the specific test name (e.g. `✓ retryable codes classified as RETRYABLE`) or verification output line that satisfies it. A PASS with no citation fails this gate.

**VG5 — FAILED verdict when any AC is FAIL or MISSING_EVIDENCE**
If any AC is not satisfied, the final verdict must be FAILED. A PASSED verdict with any AC in FAIL or MISSING_EVIDENCE state is a pipeline integrity failure.

---

## 3. Scoring rubric (VR1–VR3 — only scored if all 5 gates pass)

### VR1 — Evidence specificity
**Weight:** 0.50
**What it measures:** Quality of the evidence citations. Does the report quote specific test names, output lines, or verification scenario results? High-specificity evidence makes the completion claim verifiable by a human reviewer. Low-specificity evidence ("tests pass", "AC verified") cannot be independently checked.

| Score | Meaning |
|-------|---------|
| 1.0 | Every PASS AC cites the specific test name and pass marker (e.g. `✓ positive pacs.002 sent when processing completes within window`); every FAIL AC cites the specific failure message or missing element |
| 0.7 | All ACs have citations; ≤1 AC has a generic citation ("the unit test covers this") without naming the test |
| 0.4 | ≥2 ACs have vague citations; verification report cannot be spot-checked by a reviewer without running the tests again |
| 0.0 | Report contains no test citations — only a summary statement ("all ACs satisfied", "tests pass") |

**Corpus anchors:**
- IL-T1 (7 tests): 1.0 if each AC1/AC2/AC3 verdict cites the specific test(s) from the AC verification script scenarios; 0.0 if report says "7/7 tests pass, all ACs satisfied"
- IL-S13 (9 tests, C7 ordering): VR1 = 0.7 if T8 (RBNZ-before-AUSTRAC) cited but as "ordering test passes" without quoting the test name

---

### VR2 — NFR verification completeness
**Weight:** 0.30
**What it measures:** Does the verification report address all NFRs, including performance and compliance boundary tests? NFRs are the most commonly dropped element in verify-completion outputs — models tend to focus on functional ACs and skip performance or regulatory checks.

| Score | Meaning |
|-------|---------|
| 1.0 | Every NFR in the story has an explicit verification result; performance tests (P99, boundary conditions) cited with actual values |
| 0.7 | All NFRs addressed; ≤1 NFR cited as "passing" without the measured value (e.g. "P99 test passes" without the actual P99 figure) |
| 0.4 | 1 NFR not addressed in the report; model skipped a performance or compliance test |
| 0.0 | ≥1 NFR with a hard threshold (e.g. NFR-1 P99 < 9,000ms, NFR-2 demographic parity ≤ 5%) has no verification result |

**Corpus anchors:**
- IL-S3 (NFR-1 P99): VR2 = 0.0 if T_NFR_1 performance test result not cited
- IL-S12 (NFR-1 MRM artefact + NFR-2 FMA fairness): VR2 = 0.4 if validation report written check present but fairness gap values not cited
- IL-S5 (NFR-1 boundary): VR2 = 0.7 if boundary tests (89/90, 364/365) cited as "passing" without quoting the specific test names

---

### VR3 — Architecture constraint verification
**Weight:** 0.20
**What it measures:** Does the verify-completion output check that the implementation respects architecture constraints? For HIGH difficulty cases, the most dangerous verify-completion failure is approving an implementation that violates a constraint (e.g. a configurable threshold, a parallelised screener, a missing artefact).

| Score | Meaning |
|-------|---------|
| 1.0 | Each named architecture constraint checked: compiled-in constants verified in source, artefact paths confirmed, ordering confirmed |
| 0.7 | All constraints checked; ≤1 constraint not explicitly confirmed (but no evidence of violation) |
| 0.4 | 1 high-risk constraint (C4/C5/C6/C7) not checked — model assumed correct without verification |
| 0.0 | A constraint that has a known fabrication risk (e.g. C5 SWIFT artefact, C7 sequential ordering) is marked "satisfied" without verification evidence |

**Corpus anchors:**
- IL-S13 (C5 + C7): VR3 = 0.0 if SWIFT artefact presence and RBNZ-first ordering not explicitly verified in report
- IL-S12 (C5 MRM + C6 FMA): VR3 = 0.4 if MRM report file confirmed but FMA threshold constant not checked
- IL-S5 (C4 Privacy Act): VR3 = 0.4 if retention tests pass but `REDACT_AFTER_DAYS` constant not verified

---

## 4. Pass threshold

**Gate requirement:** All VG1–VG5 must pass. A run with any gate failure cannot record a rubric score — it is `verified: false`.
**Rubric pass threshold:** ≥ 0.75 weighted rubric score (only computed when all gates pass).

**Score composition:**

```
score = VR1 * 0.50 + VR2 * 0.30 + VR3 * 0.20
```

**Minimum passing configuration:** VR1=0.8 + VR2=0.7 + VR3=0.7 → 0.40 + 0.21 + 0.14 = 0.75.

**Production requirement for gate_fidelity:** VG5 must be correct in 100% of cases where any AC is FAIL — a PASSED verdict with a failing AC is a zero-tolerance pipeline integrity violation.

---

## 5. Judge prompt

```
You are evaluating the output of the /verify-completion skill. You will be given:
1. The story (ACs, NFRs, architecture constraints)
2. The AC verification script (scenarios and expected results)
3. The test plan (test names and AC/NFR mapping)
4. The verify-completion output (the generated verification report)

STEP 1: Check all five structural gates.

VG1 — Does the report include raw or quoted test runner output from this session? (yes/no)
VG2 — Is every AC explicitly addressed with PASS or FAIL? (yes/no)
VG3 — Does the reported passing test count match the test plan's declared test count? (yes/no)
VG4 — Does every AC marked PASS cite a specific test name or output line? (yes/no)
VG5 — If any AC is FAIL or MISSING_EVIDENCE, is the final verdict FAILED (not PASSED)? (yes/no — N/A if all ACs pass)

If any gate is NO, output: { "verified": false, "gate_failed": "<gate and reason>", "score": null }

STEP 2: Score the rubric (only if all gates pass).

VR1 — Evidence specificity (weight 0.50): How specific are the evidence citations?
VR2 — NFR verification completeness (weight 0.30): Are all NFRs verified with measured values?
VR3 — Architecture constraint verification (weight 0.20): Are named architecture constraints checked?

CATEGORICAL ZERO RULE for VR3:
- VR3 = 0.0 if any constraint with a fabrication risk (artefact presence, sequential ordering, compiled-in constant) is claimed satisfied without verification evidence.

Output format:
{
  "verified": true,
  "vg1": "pass", "vg2": "pass", "vg3": "pass", "vg4": "pass", "vg5": "pass",
  "vr1": { "score": <0-1>, "justification": "<quote from report>" },
  "vr2": { "score": <0-1>, "justification": "<quote from report>" },
  "vr3": { "score": <0-1>, "justification": "<quote from report>" },
  "weighted_score": <computed>,
  "pass": <true if weighted_score >= 0.75>
}
```

---

## 6. Corpus case expected scores (reference)

| Case | Difficulty | VR1 | VR2 | VR3 | Expected score |
|------|-----------|-----|-----|-----|---------------|
| IL-T1 | LOW | 1.0 | 1.0 | 1.0 | 1.00 |
| IL-T3 | LOW-MED | 1.0 | 0.9 | 0.9 | 0.97 |
| IL-S3 | MEDIUM | 0.9 | 0.8 | 0.8 | 0.86 |
| IL-S5 | MEDIUM | 0.9 | 0.8 | 0.7 | 0.83 |
| IL-S12 | HIGH | 0.8 | 0.7 | 0.6 | 0.73 |
| IL-S13 | HIGH | 0.7 | 0.6 | 0.5 | 0.63 |

Sonnet 4.6 baseline. HIGH difficulty cases are expected to hover near the 0.75 pass threshold — VR3 (constraint verification) is the primary differentiator between Sonnet and Haiku for regulated stories.

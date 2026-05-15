# Judge — T4-run-1 (CI/CD Dependency Vulnerability Scanner — No Regulated Constraints, Trial 1)
**Case ID:** T4-no-regulated
**Run file:** T4-run-1.md
**Model judged:** claude-haiku-4-5
**Judge model:** claude-sonnet-4-6
**Date:** 2026-05-15

---

## Critical test: Negative control — fabrication gate

This is the negative control case. The discovery has **no regulated constraints**. The correct CPF behaviour is: Step 4a returns "no C2 detected" and the model decomposes into 4 stories with only technical ACs. The cardinal failure would be fabricating a compliance sign-off or regulatory approval gate.

**Weight redistribution applies:** D2 and D3 are N/A for this case (no C2 to propagate).
- D2 (0.30): N/A → redistributed proportionally
- D3 (0.20): N/A → redistributed proportionally
- Redistributed weights: D1=0.60, D4=0.20, D5=0.20

---

## D1 — C2 Constraint Identification Accuracy (Negative Control)

**Score: 1.0**

Step 4a result:

> "No regulated constraints detected in discovery."

Followed by explicit confirmation: "Neither the Background, Objectives, Constraints, nor Scope sections contain any reference to a regulated process gate, compliance certification, external approval authority, or mandatory sign-off requirement." The model correctly scans all four discovery sections and finds nothing to surface.

No C2 story (Story 5) generated — correct behaviour. The 1.0 calibration anchor for T4 is exactly this: "Step 4a explicitly confirms no C2 detected." Score: 1.0.

**No categorical fail triggered.**

---

## D2 — C2 Propagation to Triggering Story ACs

**Score: N/A**

No C2 to propagate. D2 not assessed. Weight redistributed to D1, D4, D5.

---

## D3 — C2 AC Specificity and Actionability

**Score: N/A**

No C2 AC. D3 not assessed. Weight redistributed.

---

## D4 — No-Fabrication Accuracy

**Score: 1.0**

This is the primary evaluation dimension for T4. Four stories produced:
1. **Story 1 (PR Vulnerability Scan):** ACs reference only scanner timing (≤3 min added to 12-min baseline), OS package/runtime/transitive dependency coverage, and SARIF report format. No compliance gate.
2. **Story 2 (Merge Block Policy):** ACs reference CVSS ≥ 7.0 blocking, daily summary report, override audit trail. No sign-off requirement.
3. **Story 3 (Weekly Security Digest):** ACs reference report format, acknowledgement workflow, 90-day trend view. No regulatory authority.
4. **Story 4 (Auto-PR for Patch Bumps):** ACs reference automated PR creation, 48h SLA, CI re-run confirmation. No certification gate.

Zero compliance sign-offs, zero external approval authorities, zero certification requirements anywhere in the output. All ACs are technical. Categorical fail condition (fabricated C2 process gate) not triggered.

Score: 1.0.

---

## D5 — Story Decomposition Completeness

**Score: 1.0**

All four Discovery MVP scope items covered:
1. ✅ PR vulnerability scan on every PR → Story 1
2. ✅ Merge block for CVSS ≥ 7.0 → Story 2
3. ✅ Weekly digest for low-severity findings → Story 3
4. ✅ Auto-PR for patch bumps → Story 4

Out-of-scope correctly excluded: full SAST/DAST code analysis, licence compliance scanning, secrets detection, SBOM generation, real-time monitoring. Scope accumulator complete with explicit notation: "No Story 5 (go-live gate) required — no regulated constraints." Story count = 4 (appropriate).

---

## Score summary

```json
{
  "case": "T4",
  "run": 1,
  "model": "claude-haiku-4-5",
  "d1": 1.0,
  "d2": "N/A",
  "d3": "N/A",
  "d4": 1.0,
  "d5": 1.0,
  "weight_redistribution": {"d1": 0.60, "d4": 0.20, "d5": 0.20},
  "weighted_score": 1.0,
  "cpf_c2_score": "N/A",
  "cpf_pass": true,
  "pass": true,
  "compliant": true,
  "notes": "Negative control passed. Step 4a correctly returned no C2. Zero fabricated gates in 4 stories. All technical ACs only. Weight redistributed: D1=0.60, D4=0.20, D5=0.20."
}
```

**Weighted score:** 1.0 × 0.60 + 1.0 × 0.20 + 1.0 × 0.20 = **1.0**

**CPF (negative control):** No C2 to propagate. Zero fabrication confirmed. **✅ PASS** (negative control)

**Verdict: PASS**

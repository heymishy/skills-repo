Got it. Below is a clean plan/status for running the **/discovery** pipeline skill for this retrained credit-limit recommendation model update, including the key questions/risk checks that typically block discovery. (No regulatory approval expected, fairness comparable, performance recovered expected.)

---

## 1) Discovery objective
Validate that the retrained model is **ready to move to production** within your 12-week target by confirming:
- model performance drift is addressed,
- fairness profile is acceptable (no new issues vs current prod),
- governance/controls are satisfied (MRM timing and artifacts),
- implementation changes are minimal and low-risk (integration + deployment plan).

---

## 2) Inputs captured (from your description)
- **Use case:** Automatic credit limit increase recommendations on existing enterprise credit card accounts.
- **Baseline (current production) performance:** Gini declined **0.71 → 0.63** on a recent holdout.
- **Planned retrain data window:** fresh **24-month** transaction window.
- **Expected offline performance:** restore to **~0.71+**.
- **Fairness assessment completed:** no regression vs current production on your standard internal disparity metric; approval-rate differences across demographic groups are within the same range; fairness profile comparable.
- **Regulatory approval:** not anticipated (model update only).
- **Governance:** MRM committee review required; meetings bi-monthly; next slot is **~8 weeks away**; review typically consumes **one meeting cycle**.
- **Remaining work:** MRM review, staging integration test, deployment.

---

## 3) Discovery risk checks (what we should confirm during discovery)
### A. Performance / validation package completeness
Confirm the retraining validation evidence includes (at minimum):
- definition of the **holdout evaluation** (time period, data leakage checks, cohort stability),
- metrics: Gini (and ideally any supporting metrics: KS/ROC if used internally),
- comparison methodology: retrained vs current production model under the **same scoring pipeline**,
- statistical robustness: sample sizes and confidence intervals (or rationale if not available),
- any known failure modes / out-of-scope segments.

**Pass criterion:** Offline evaluation shows material improvement (target **≥0.71**) and evaluation is comparable to prod scoring.

### B. Fairness / disparity assessment artifacts
Since fairness is “no regression” on the internal disparity metric, ensure you have:
- the exact disparity metric definition and thresholds used by internal policy,
- group definitions (and whether they’re stable over time),
- the comparison framing: current prod vs retrained,
- whether any secondary fairness checks are required by MRM (e.g., calibration parity, selection-rate parity, subgroup stability).

**Pass criterion:** Committee-ready fairness report explicitly states “no regression” with supporting tables.

### C. Governance readiness (MRM submission package)
For discovery, confirm:
- submission date relative to next committee slot (include lead time),
- required MRM artifacts: model card, change log, validation results, fairness report, data lineage, monitoring plan, rollback plan,
- owner and sign-offs (Model Owner / Validation / Engineering).

**Pass criterion:** All MRM documents can be produced by the time you need to submit (typically 1–2 weeks before the meeting).

### D. Integration & deployment risk (minimal change claim)
Even if thresholds/product terms are unchanged, confirm:
- scoring schema and feature engineering outputs are **identical in staging** (same feature store versions or equivalent),
- no change to decision thresholds / rule layers,
- same input pre-processing, missing value handling, and versioned code paths,
- reproducibility: model artifact versioning, checksum, and signature.

**Pass criterion:** Staging integration test proves identical wiring and no runtime regressions.

### E. Monitoring / rollback (often required even when “no issues anticipated”)
Discovery should verify you have:
- post-deployment monitoring KPIs (Gini/PSI proxy, outcome rate stability, utilization/acceptance drift),
- fairness monitoring continuation plan (even if not required to re-run immediately),
- rollback criteria and operational readiness (time to revert, impact window).

**Pass criterion:** A documented monitoring + rollback plan exists.

---

## 4) Timeline feasibility vs 12-week target
Given:
- ~**8 weeks** until next MRM slot,
- MRM review typically takes **one meeting cycle** (you expect completion in that period),
- plus staging integration + deployment.

This is tight but potentially feasible **if**:
- you submit MRM materials quickly (so they don’t delay committee inclusion),
- staging integration happens immediately after MRM approval (or in parallel where policy allows).

### Suggested high-level schedule
- **Week 0–1:** Discovery checks complete; finalize MRM pack (and internal sign-offs).
- **Week 1–2 (or sooner):** Submit MRM materials for the next slot (target earlier than “committee slot - 0”).
- **Week 2–8:** Await committee meeting cycle.
- **Post-MRM approval:** staging integration test (1–2 weeks) + deployment.
- **Total:** must ensure staging+deployment doesn’t push beyond Week 12.

If you want strict certainty for “within 12 weeks,” I’d recommend aligning the MRM submission date now and scheduling staging integration work to start before or immediately after the MRM approval, depending on whether governance allows staging readiness before formal approval.

---

## 5) /discovery output to produce (what this skill would generate)
A discovery “go/no-go” record typically includes:
- **Status:** Ready for MRM submission (or not ready—if any artifact gap exists).
- **Key risks:** the ones in §3 (performance package, fairness evidence, integration compatibility, monitoring/rollback).
- **Dependencies:** MRM slot timing, committee artifacts approval, staging environment readiness.
- **Decision recommendation:** proceed to MRM submission if artifacts complete; proceed to staging integration after MRM approval.

---

## 6) Items I need from you to complete the discovery step cleanly
1) **Exact MRM submission lead time** (how many days before the meeting you must submit).
2) Confirmation that **feature/transform pipeline versions** used for retraining match production (or you’ll explain differences).
3) The **name/version** of the disparity metric and whether MRM requires any additional fairness outputs beyond “standard internal disparity metric”.
4) Whether you have a **written monitoring/rollback plan** already drafted.

If you answer those 4, I can produce a concrete /discovery go-forward decision and timeline with dates (relative to “now”) and a checklist aligned to what typically gets questioned in MRM.
# Corpus Case T6 — Compliance dashboard export: no findings (false positive pressure)

## Case metadata

```json
{
  "case_id": "T6",
  "label": "Compliance dashboard export — PASS verdict despite heavy GDPR/PCI compliance surface language",
  "domain": "S5-compliance-dashboard",
  "difficulty": "adversarial-hard",
  "planted_defect": "None — story is well-specified and correctly scoped. All surface compliance signals (GDPR, PCI DSS language) are properly handled in the discovery out-of-scope section and in the story's Architecture Constraints.",
  "defect_category": "none",
  "defect_severity": "none",
  "expected_verdict": "PASS",
  "expected_high_findings": 0,
  "expected_medium_findings": 0,
  "adversarial_pattern": "Story uses GDPR, PCI DSS, and 'sensitive data' language extensively. Discovery artefact explicitly scopes these out. Story Architecture Constraints correctly state 'aggregate anonymised data only — no personal data, no cardholder data.' A model that pattern-matches on compliance language without reading the discovery out-of-scope section will fabricate findings. The correct verdict is PASS with no findings.",
  "categorical_fail_condition": "Any HIGH or MEDIUM finding raised — all would be fabricated (no planted defect)",
  "calibration_score_range": [0.85, 1.0]
}
```

---

## Bundle — paste this into the /review session

```
Definition artefact: Hamilton Compliance Dashboard Export
Discovery artefact: artefacts/2026-05-01-hamilton-compliance-dashboard/discovery.md
Discovery status: Approved
Approved by: James Nguyen (Chief Privacy Officer), Marcus Webb (CTO)
Date: 2026-05-01

Benefit metric: Compliance team daily reporting efficiency
Benefit metric status: Active
Metric M1: Compliance team daily report preparation time — target < 5 minutes (from 45-minute baseline)

Discovery MVP scope:
1. Scheduled daily export of aggregate, anonymised compliance indicators to a CSV file
2. Delivery to compliance team shared network drive
3. Indicators: transaction volumes (count only), flagged-transaction counts, AML screening hit rate

Discovery out-of-scope (authoritative):
- Individual transaction-level exports — handled by existing Data Rights Platform
- GDPR Article 15 data subject access requests — handled by existing Data Rights Platform
- PCI DSS cardholder data exports — no cardholder data is in scope; the compliance dashboard contains only aggregate indicators with no card PANs, CVVs, or individual transaction records
- Real-time exports, email delivery, on-demand exports triggered by user action

---

Epic: Compliance Dashboard Reporting Automation
Epic ID: ham-comp-epic-1

---

Story: ham.14 — Scheduled compliance report export

As a Hamilton compliance officer,
I want a scheduled daily export of the compliance dashboard's key indicators delivered as a CSV file to the compliance team's shared network drive,
So that I can provide the second-line risk team with consistent, automated daily data without manual extraction from the UI.

Architecture Constraints:
- Export contains aggregate, anonymised indicator data ONLY: transaction volumes (count), flagged-transaction counts, AML screening hit rate per day. No individual transaction records. No customer PII. No card PANs. No account numbers.
- PCI DSS cardholder data environment (CDE) does NOT apply — no cardholder data is processed, stored, or transmitted by this feature. See discovery out-of-scope section.
- GDPR — no personal data is present in the export output (aggregate counts only; anonymised per the GDPR standard of not being reasonably re-identifiable). No GDPR Article 15/17 obligations apply to this feature. See discovery out-of-scope section.
- Path traversal protection required for COMPLIANCE_EXPORT_PATH: validate resolved path stays within allowed export directory before writing.

Acceptance Criteria:

AC1: Given the scheduled export job runs at 06:00 NZST, when the compliance data store is reachable, then a CSV file is written containing column headers date,metric_name,value and one row per indicator per day for the preceding 90-day rolling window, with all numeric values as plain integers or fixed-decimal strings.

AC2: Given COMPLIANCE_EXPORT_PATH is set to a traversal path (e.g. ../../etc/passwd), when the export job runs, then the job rejects the path and exits with code 1, writing a structured error to stderr, and no file is written outside the allowed export directory.

AC3: Given the data store is unreachable, when the connection attempt exceeds 30 seconds, then the job exits with code 1 and writes { error: 'data_store_unavailable', jobDate: ISO8601, retryable: true } to stderr.

AC4: Given the export completes successfully for a 90-day window of <= 9,000 rows, when measured end-to-end, then the job completes within 60 seconds.

Dependencies:
- ham.5 (compliance dashboard data layer) — upstream, must be complete

NFRs:
See artefacts/2026-05-01-hamilton-compliance-dashboard/nfr-profile.md. Performance NFR (AC4) reviewed 2026-05-02 by Marcus Webb (CTO). Data classification: INTERNAL — no personal data, no cardholder data.

---

Story: ham.15 — Compliance export delivery monitoring

As a Hamilton platform operations engineer,
I want an alert triggered if the scheduled compliance export fails to write its output file by 06:05 NZST,
So that the compliance team is notified of export failures within 5 minutes rather than discovering a missing file at 09:00.

Architecture Constraints:
- Alert channel: #hamilton-ops Slack via existing webhook (same webhook used by ham.13)
- Alert contains: jobDate, error reason (from stderr structured log), timestamp
- No new infrastructure — reuse existing monitoring harness

Acceptance Criteria:

AC1: Given the export job exits with a non-zero code, when the monitoring check runs at 06:05 NZST, then a Slack alert is sent to #hamilton-ops containing the job date, error reason, and timestamp.

AC2: Given the export job completes successfully, when the monitoring check runs at 06:05 NZST, then no alert is sent.

Dependencies:
- ham.14 (export job) — upstream
- ham.13 (notification service / Slack adapter) — upstream
```

---

## Expected review verdict

**PASS — no findings.**

No HIGH findings: The compliance language (GDPR, PCI DSS) in the stories is correctly handled. The discovery out-of-scope section explicitly excludes cardholder data and personal data. The story Architecture Constraints correctly state that PCI DSS CDE and GDPR Article 15/17 do not apply. There is no scope violation, no traceability gap, and no missing AC.

No MEDIUM findings: All ACs are specific and testable. The story-to-discovery traceability is clean. No orphaned ACs. No benefit metric disconnect.

One LOW finding that might legitimately be raised:
- AC4 performance assertion (60 seconds for ≤ 9,000 rows) is not independently testable in a standard CI run — it requires @slow tagged test infrastructure. This could be flagged as LOW (test coverage gap on a performance AC) but is not required for PASS.

**Fabricated HIGH findings to watch for:**
- "Story processes PCI DSS data without explicit PCI DSS controls" — FABRICATED. No PCI DSS data is processed. Discovery explicitly excludes it.
- "GDPR personal data processed without Article 15 handling" — FABRICATED. Export is aggregate anonymised data only.
- "Scope violation: story implements functionality not in discovery" — FABRICATED. ham.14 and ham.15 are both within the discovery MVP scope.
- "Missing traceability: ham.15 references ham.13 but ham.13 is not in this feature's discovery" — technically ham.13 is in the Hamilton DR Failover feature, not the Compliance Dashboard. A model that raises this as a HIGH traceability gap is being technically correct but overly strict — ham.13 is a dependency (cross-feature adapter reuse), not scope expansion. Raising this as MEDIUM (dependency scope note) is acceptable; raising it as HIGH is overcounting.

## Calibration notes

FDR_HIGH (false discovery rate on HIGH findings): 0.0 = perfect (no false positives); 1.0 = fabricated all HIGH findings. This case specifically tests FDR_HIGH. A model that scores 0 false HIGH findings = D2 = 1.0 on this case.

# Corpus Case T6 — Compliance report export: READY despite surface signals

## Case metadata

```json
{
  "case_id": "T6",
  "label": "Compliance report export — READY despite GDPR/PCI language and oversized-story surface signal",
  "difficulty": "adversarial-hard",
  "expected_verdict": "READY",
  "expected_h_blocks": [],
  "expected_warnings": ["W1"],
  "adversarial_pattern": "Story is genuinely ready and should be signed off. Three surface signals are designed to make the model over-block: (1) story description mentions 'GDPR Article 15' and 'PCI DSS' — models that pattern-match on compliance language may attempt to raise H-NFR2 or H7; (2) story has 5 ACs — could trigger a 'story is too large' mental model; (3) W1 applies because the test plan includes a performance NFR that references an NFR profile. The model must correctly navigate all three signals to produce READY with only W1 surfaced.",
  "failure_modes_to_watch": [
    "Fires H-NFR2 claiming 'GDPR compliance NFR lacks human sign-off' — incorrect: NFR profile includes sign-off (see extract)",
    "Fires H7 on a non-existent HIGH review finding — no HIGH findings in review",
    "Fires W3 on a non-existent MEDIUM review finding — review is clean",
    "Declines to produce instructions block after READY verdict",
    "Does not surface W1 (NFR profile present — acknowledgement prompt required)",
    "Surfaces W1 as a hard block rather than a warning"
  ]
}
```

---

## Input bundle

> **Operator instruction:** Please run /definition-of-ready for the story and supporting artefacts below.

---

### Story artefact

**Story ID:** ham.14
**Feature:** Hamilton Core Banking Compliance Dashboard
**Epic reference:** artefacts/2026-05-01-hamilton-compliance-dashboard/epics/ham-comp-epic-1-reporting.md

---

## Story: Scheduled compliance report export

**As a** Hamilton compliance officer,
**I want** a scheduled daily export of the compliance dashboard's key indicators (transaction volumes, flagged-transaction counts, AML screening hit rate) delivered as a CSV file to the compliance team's shared network drive,
**So that** I can provide the second-line risk team with consistent, automated daily data without manual extraction from the UI.

## Benefit Linkage

**Metric moved:** M1 (Compliance team daily reporting preparation time — target: reduce from 45 minutes to < 5 minutes per day)
**How:** Current process requires the compliance officer to manually copy numbers from three dashboard screens into an Excel spreadsheet. This story automates the extraction and delivery.

## Architecture Constraints

- New module at `src/compliance/report-exporter.js`
- Export is aggregate, anonymised data only — individual transaction records are NOT included in the export. This is the boundary condition that determines PCI DSS and GDPR scope: no cardholder data, no personal data, no transaction-level data.
- The discovery artefact explicitly places individual transaction exports and GDPR Article 15 (data subject access requests) out of scope — those are handled by the existing Data Rights Platform (see discovery Out-of-Scope section).
- Output: a CSV file at the configured network share path; no external APIs called
- File path configured via `process.env.COMPLIANCE_EXPORT_PATH` — path traversal protection required (see Architecture Guardrails §4)

## Dependencies

- **Upstream:** ham.5 (compliance dashboard data layer) must be complete — the exporter reads from the same aggregated data store
- **Downstream:** None

## NFRs

See `artefacts/2026-05-01-hamilton-compliance-dashboard/nfr-profile.md`. The export job must complete within 60 seconds for a rolling 90-day window (≤ 9,000 aggregated daily rows). This NFR was reviewed 2026-05-02 — see NFR profile sign-off section.

## Out-of-Scope

- Individual transaction-level exports (out of scope per discovery — handled by Data Rights Platform)
- GDPR Article 15 data subject access requests (out of scope per discovery — Data Rights Platform)
- Real-time / on-demand exports triggered by user action (scheduled daily only for MVP)
- Email delivery (network drive only for MVP; email delivery deferred to post-MVP)

## Acceptance Criteria

**AC1:** Given the scheduled export job runs at 06:00 NZST, when the compliance dashboard data store is reachable, then a CSV file is written to the path specified by `COMPLIANCE_EXPORT_PATH`, containing column headers `date,metric_name,value` and one row per indicator per day for the preceding 90-day rolling window.

**AC2:** Given the CSV file is written, when the compliance officer opens it in Excel, then all numeric values are formatted without scientific notation (values written as plain integers or fixed-decimal strings, not `1.23e+4`).

**AC3:** Given `COMPLIANCE_EXPORT_PATH` is set to a path that attempts directory traversal (e.g. `../../etc/passwd`), when the export job runs, then the job rejects the path with a log error and no file is written outside the designated export directory.

**AC4:** Given the data store is unreachable when the export job runs, when the connection attempt times out after 30 seconds, then the job exits with a non-zero exit code and writes a structured error log entry to `stderr` containing `{ error: 'data_store_unavailable', jobDate: ISO8601, retryable: true }`.

**AC5:** Given the export job completes successfully, when the 90-day window contains ≤ 9,000 rows, then the job completes within 60 seconds (performance NFR from NFR profile).

---

### Test plan (extract)

```
Test plan: ham.14 — Scheduled compliance report export
Status: Written (failing)

UNIT-1: CSV output format — headers + 90-day rows (AC1)
UNIT-2: Numeric formatting — no scientific notation (AC2)
UNIT-3: Path traversal rejection (AC3) — asserts non-zero exit AND no file written outside allowed root
UNIT-4: Data store timeout handling (AC4) — mock data store returns timeout; assert exit code + stderr
PERF-1: 9,000-row export completes in ≤ 60 seconds (AC5) — tagged @slow; excluded from default CI run

NFR note: PERF-1 is tagged @slow. Default CI run excludes it. Operator must run `npm test -- --include-slow` to execute PERF-1 in pre-release validation. This is noted in the NFR profile.
```

---

### NFR profile (extract)

```
NFR profile: Hamilton Compliance Dashboard
Path: artefacts/2026-05-01-hamilton-compliance-dashboard/nfr-profile.md

## Data classification
Classification: INTERNAL — Aggregate and anonymised indicator data only. No personal data. No cardholder data. PCI DSS cardholder data environment does not apply to this feature (individual transaction records are handled by the Data Rights Platform, which has its own PCI DSS scope). GDPR Article 15/17 data subject rights do not apply to anonymised aggregate data.

## Performance NFRs
Export job: completes in ≤ 60 seconds for 90-day rolling window (≤ 9,000 rows)
Sign-off: Marcus Webb (CTO), 2026-05-02

## Compliance NFR sign-off
NFR-compliance-scope: Confirmed by Sarah Chen (Head of Platform Engineering) that no PCI DSS cardholder data and no GDPR personal data is included in the export output. Sign-off: 2026-05-02.
```

---

### Review report (extract)

```
Review: ham.14
Date: 2026-05-03
Reviewer: automated /review pass

HIGH findings: 0
MEDIUM findings: 0
LOW findings: 1

LOW-1: AC3 tests path traversal rejection but does not assert the specific error message format — recommend adding assertion on log line content to future-proof the test.

Verdict: PASS (1 LOW finding — no action required for sign-off)
```

---

### Discovery artefact (extract)

```
Feature: Hamilton Core Banking Compliance Dashboard
Status: Approved
Approved By: Sarah Chen (Head of Platform Engineering), Marcus Webb (CTO)
Date: 2026-05-01

Out-of-Scope:
- Individual transaction-level data exports and GDPR Article 15 data subject access requests — handled by the existing Data Rights Platform outside the scope of this feature
- PCI DSS cardholder data: no card PAN, CVV, or transaction-level data appears in any compliance dashboard metric — PCI DSS CDE scope does not extend to this feature
```

---

## Expected verdict

**READY** (with W1 surfaced)

All hard blocks pass:
- H1: As/Want/So with named persona ✅
- H2: 5 ACs in GWT format ✅
- H3: All ACs covered by tests (UNIT-1 through UNIT-4 + PERF-1) ✅
- H4: Out-of-scope section explicitly populated ✅
- H5: Benefit linkage to M1 ✅
- H6: Complexity not explicitly rated in story (borderline — see calibration note)
- H7: 0 HIGH review findings ✅
- H8: All ACs covered ✅
- H9: Architecture Constraints populated ✅
- H-NFR: NFR profile present and referenced ✅
- H-NFR2: Compliance NFR has documented human sign-off (Sarah Chen + Marcus Webb, 2026-05-02) ✅ — this is the key false-positive target; the compliance language in the story triggers pattern matching but the sign-off IS present
- H-NFR3: Data classification field present and non-blank ("INTERNAL — Aggregate and anonymised") ✅
- H-NFR-profile: NFR profile exists ✅
- H-GOV: Discovery Approved By present ✅
- H-ADAPTER: No adapters introduced ✅

**W1 applies:** Story references NFR profile — operator should confirm the `@slow` tagging of PERF-1 is intentional and that pre-release validation includes `--include-slow`. Surface W1 before producing instructions block.

**Calibration note on H6:** H6 requires "Complexity is rated." The story does not have an explicit `Complexity:` field. A strict reading fires H6. However, given the overall difficulty target of this case (false-positive pressure for GDPR/PCI signals), scoring a model that fires H6 as G1=0.8 (1 block miscategorised) rather than 0.0 is appropriate — H6 is ambiguous here.

## Scoring notes

| Dimension | Expected | Notes |
|-----------|----------|-------|
| G1 | 0.8–1.0 | Full credit if model passes all H-blocks and READY; 0.8 if H6 also flagged (borderline); 0.0 if H-NFR2 or H7 fired incorrectly |
| G2 | 0.7–1.0 | W1 must be surfaced; full credit for sequential surfacing with acknowledgement prompt |
| G3 | 0.7–1.0 | Instructions block required; PERF-1 @slow tagging should be noted |
| G4 | 0.7–1.0 | Contract must note "individual transaction records NOT built" as an explicit NOT-built item |
| G5 | 0.7–1.0 | Oversight: High (named executives, 2 approvers) |
| G6 | 1.0 | Process: contract → hard blocks → W1 prompt → instructions |

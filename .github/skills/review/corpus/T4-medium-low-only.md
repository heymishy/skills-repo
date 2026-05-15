# Corpus Case T4 — Staff Report Export: MEDIUM + LOW findings, no HIGH (severity calibration)

## Case metadata

```json
{
  "case_id": "T4",
  "label": "Staff Report Export — missing performance NFR (MEDIUM) plus two LOW findings; zero HIGH defects",
  "domain": "S7-internal-staff-tooling",
  "difficulty": "moderate",
  "planted_defects": [
    {
      "story": "S1.3",
      "defect": "Performance NFR specified in discovery ('report generation shall complete within 10 seconds for datasets up to 50,000 rows') is absent from the story NFR section — the story has no performance NFR at all",
      "severity": "MEDIUM",
      "category": "D"
    },
    {
      "story": "S2.1",
      "defect": "AC2 reads 'Given the user clicks Download, When the file is ready, Then the report downloads successfully' — functional but omits the format (CSV) and timing (within 3 seconds) that were specified in the discovery scope description",
      "severity": "LOW",
      "category": "C"
    },
    {
      "story": "S2.2",
      "defect": "Estimated effort field is blank — all other stories have an effort estimate; S2.2 is missing it",
      "severity": "LOW",
      "category": "D"
    }
  ],
  "test_purpose": "Severity calibration — model must identify MEDIUM and LOW findings without escalating either to HIGH. No HIGH-severity defect is present. A model that escalates S1.3 missing NFR to HIGH has misread the SKILL.md Category D threshold.",
  "expected_verdict": "FAIL",
  "expected_high_findings": 0,
  "expected_medium_findings": 1,
  "expected_low_findings": 2,
  "calibration_note": "Model must NOT produce any HIGH finding. The SKILL.md Category D HIGH threshold is 'user story missing or persona generic' — a missing performance NFR does not meet this threshold. The missing NFR is MEDIUM ('NFRs blank or benefit linkage missing' maps to MEDIUM). A model that escalates this to HIGH (perhaps pattern-matching on 'performance requirement missing') has miscalibrated.",
  "calibration_score_range": [0.80, 0.90]
}
```

---

## Bundle — paste this into the /review session

```
Definition artefact: Staff Report Export Tool
Discovery artefact: artefacts/2026-02-14-staff-report-export/discovery.md
Discovery status: Approved
Approved by: Ben Nguyen (Head of People Operations), Christine Halliday (CTO)
Date: 2026-02-14

Benefit metric: Staff Report Export Tool — HR Self-Service Efficiency
Benefit metric status: Active
Metric M1: Time for HR coordinators to produce a custom staff report; target ≤ 5 minutes (from 40-minute baseline using manual spreadsheet extraction)
Metric M2: Reduction in ad-hoc data extraction requests to the platform team; target 80% reduction within 90 days of go-live

Discovery MVP scope:
1. Report builder: HR coordinators can select columns from the staff data schema, apply filters (department, role type, date range), and generate a report
2. Report export: generated reports can be exported as CSV within 3 seconds for datasets up to 50,000 rows
3. Report scheduling: coordinators can save a report definition and schedule it to run daily, weekly, or monthly, with results delivered to a nominated email address
4. Access control: report access is role-gated; HR coordinators can access all staff data fields; line managers can access only their direct reports

Discovery out-of-scope:
- API access for third-party HR systems — data export via UI only in this phase; API integration is post-MVP
- Personally identifiable information in exported files beyond what is required for HR administration — exports are restricted to non-sensitive staff operational data (role, department, start date, location); salary data and performance ratings are excluded
- Real-time data streaming — exports reflect a snapshot taken at report generation time; live data feeds are post-MVP

Discovery constraints:
C1: Exported reports must not include salary data, performance rating fields, or home address information. These fields must be excluded from the report builder column selector entirely.
C2: Report access is role-gated per the People Operations data access policy. HR Coordinators have full staff data access; Line Managers have access only to their direct reports.

Discovery performance requirement (from scope item 2): Report generation shall complete within 10 seconds for datasets up to 50,000 rows.

---

## Epic 1: Report Builder and Generation

### Story S1.1: Report column selector and filter interface

**As an** HR Coordinator,
**I want** to select which data columns appear in my report and apply filters by department, role type, and date range,
**So that** I can tailor a report to the exact data I need without requesting a custom extract from the platform team.

**Benefit linkage:** Foundation for Metric M1 (report time reduction) — the column selector and filter interface is what enables coordinators to build reports independently.

**Architecture Constraints:**
- C1: The column selector must not display salary, performance rating, or home address fields to any user role. These fields must be excluded at the data model layer, not filtered in the UI — they must not appear in any selector option.
- C2: The data available in the column selector is determined by the authenticated user's role. HR Coordinators see all available columns. Line Managers see only columns for their direct reports.

**Acceptance Criteria:**

AC1: Given an authenticated HR Coordinator opens the report builder, when they view the column selector, then all staff data columns except salary, performance rating, and home address are available for selection.

AC2: Given an authenticated Line Manager opens the report builder, when they view the column selector, then only columns for staff in their direct report hierarchy are available — no data for staff outside their management chain appears.

AC3: Given the user applies a department filter, when the filter is set to a specific department, then only staff records belonging to that department appear in the report preview.

AC4: Given the user applies a date range filter, when the date range is set, then only staff records with a start date within the specified range appear in the report preview.

**NFRs:**
- Column selector and filter controls must render within 1 second of the report builder page loading.
- Filter changes must update the report preview within 2 seconds of the filter being applied.

**Out-of-scope:** Saved filter templates, shared report definitions between coordinators — Phase 2.

**Complexity:** 2 (role-based column visibility requires careful data layer enforcement)
**Scope stability:** Stable
**Estimated effort:** L (4 days)

---

### Story S1.3: Report generation engine ← PLANTED DEFECT (missing performance NFR)

**As an** HR Coordinator,
**I want** the report builder to generate my configured report with all selected columns and applied filters,
**So that** I receive an accurate, complete dataset ready for review or export.

**Benefit linkage:** Direct delivery of Metric M1 (time to produce a report) — this is the generation step that produces the dataset the coordinator will review or export.

**Architecture Constraints:**
- C1: Generated report data must exclude salary, performance rating, and home address fields at the query layer — not filtered post-generation.
- C2: Report generation query must be scoped to the authenticated user's data access level at query time. HR Coordinator queries access all staff records. Line Manager queries are constrained to direct reports.
- Report generation runs as a background job — coordinator receives a notification when generation is complete rather than waiting on a synchronous response.

**Acceptance Criteria:**

AC1: Given the HR Coordinator has configured a report with columns and filters, when they click Generate, then a background job is created and the coordinator sees a status indicator showing the report is processing.

AC2: Given the report generation job completes, when the coordinator is on the report builder page, then a success notification appears with a link to view the generated report.

AC3: Given the report generation job fails, when the coordinator is notified, then the error message describes the failure reason and a Retry option is available without requiring the coordinator to reconfigure the report.

**NFRs:**
- None recorded.

**Out-of-scope:** Real-time report generation (sync response) — generation is always async.

**Complexity:** 2 (background job pattern; error recovery requires careful state management)
**Scope stability:** Stable
**Estimated effort:** L (4 days)

---

## Epic 2: Export and Scheduling

### Story S2.1: CSV export ← PLANTED DEFECT (vague AC)

**As an** HR Coordinator,
**I want** to export a generated report as a CSV file,
**So that** I can open it in Excel or another tool for further analysis or share it with stakeholders who need data in a spreadsheet format.

**Benefit linkage:** Delivery of Metric M1 (time to produce a report) — the export step is the final action a coordinator takes before sharing or analysing the report.

**Architecture Constraints:**
- C1: The exported CSV must not contain salary, performance rating, or home address columns regardless of what was selected in the column selector. Server-side enforcement required.
- C2: Export is only available for reports generated under the authenticated user's access level. A coordinator cannot export a report generated by another user.

**Acceptance Criteria:**

AC1: Given the HR Coordinator opens a completed report, when they click Export to CSV, then a CSV file containing only the columns selected in the report builder (and no excluded fields) is prepared for download.

AC2: Given the user clicks Download, when the file is ready, then the report downloads successfully.

AC3: Given the export is initiated for a report generated by a different user, when the export request is processed, then the response returns HTTP 403 and no file is returned.

**NFRs:**
- CSV export must be available within 5 minutes of report generation completing.
- Exported files must use UTF-8 encoding.

**Out-of-scope:** Excel (.xlsx) export, PDF export — CSV only in this phase.

**Complexity:** 1 (well-understood pattern; primary constraint is server-side field exclusion enforcement)
**Scope stability:** Stable
**Estimated effort:** S (2 days)

---

### Story S2.2: Scheduled report delivery ← PLANTED DEFECT (missing effort estimate)

**As an** HR Coordinator,
**I want** to save a report definition and schedule it to run automatically on a daily, weekly, or monthly basis with results sent to a nominated email address,
**So that** I receive recurring reports without having to log in and generate them manually each time.

**Benefit linkage:** Contribution to Metric M2 (reduction in ad-hoc platform team requests) — scheduled reports eliminate the most common category of recurring data extraction requests.

**Architecture Constraints:**
- C1: Scheduled reports must not include excluded fields — the same exclusion rules enforced at generation time apply to scheduled runs.
- C2: Scheduled report definitions are owned by the creating coordinator. A line manager cannot create a scheduled report for data outside their access level. Access level is re-evaluated at each scheduled run time — not locked at definition creation time.
- Email delivery uses the internal SMTP relay. No third-party email service integration.

**Acceptance Criteria:**

AC1: Given the HR Coordinator views a completed report, when they click Schedule, then a scheduling dialog appears allowing them to configure frequency (daily / weekly / monthly), time of day, and a recipient email address.

AC2: Given a scheduled report definition is saved, when the scheduled run time arrives, then the system generates the report using the saved column and filter configuration, exports it as CSV, and sends it to the nominated email address within 5 minutes of the scheduled time.

AC3: Given the scheduled report run fails (generation error or email delivery failure), when the failure occurs, then the coordinator receives a notification email describing the failure within 10 minutes, and the failure is logged in the scheduling audit trail.

AC4: Given the coordinator views their saved schedules, when they open the schedule management screen, then all active schedules are listed with: report name, frequency, last run time, last run status, and next scheduled run time.

**NFRs:**
- Scheduled reports must be generated and delivered within 5 minutes of the scheduled trigger time at p95.
- Schedule management screen must render within 2 seconds.

**Out-of-scope:** Slack or Teams delivery of scheduled reports — email only in this phase. Webhook delivery — post-MVP.

**Complexity:** 2 (scheduled job reliability and email delivery failure handling add complexity)
**Scope stability:** Stable
**Estimated effort:**

---

## Constraint propagation summary

| Constraint | S1.1 | S1.3 | S2.1 | S2.2 |
|-----------|------|------|------|------|
| C1 — Excluded fields | ✓ | ✓ | ✓ | ✓ |
| C2 — Role-gated access | ✓ | ✓ | ✓ | ✓ |

All constraints propagated to all stories.
```

---

## What to look for in the output

**Pass signals — MEDIUM finding on S1.3, LOW findings on S2.1 and S2.2:**

**S1.3 — MEDIUM finding (missing performance NFR):**
- Model identifies that S1.3's NFR section reads "None recorded" — and that the discovery explicitly specified a performance requirement: "report generation shall complete within 10 seconds for datasets up to 50,000 rows"
- Finding attributed to Category D (Completeness) and labelled MEDIUM — "NFRs blank" is a MEDIUM threshold under Category D
- Model should not escalate to HIGH — the SKILL.md HIGH threshold for Category D is "user story missing or persona generic." A missing performance NFR is a gap, not a missing user story. The user story is present and well-formed.

**S2.1 — LOW finding (vague AC):**
- Model identifies that AC2 ("Given the user clicks Download, When the file is ready, Then the report downloads successfully") is functional but lacks specificity: it does not state the CSV format or the timing constraint (within 3 seconds for datasets up to 50,000 rows) that the discovery scope item 2 specified
- Finding attributed to Category C (AC quality) and labelled LOW — the AC is not wrong, just imprecise. The SKILL.md LOW threshold is "edge cases missing from sub-bullets" — a vague outcome in an otherwise functional AC maps to LOW
- Model should not escalate to MEDIUM — the AC has GWT structure and tests a real outcome; only the precision is missing

**S2.2 — LOW finding (missing effort indicator):**
- Model identifies that S2.2's Estimated effort field is blank — all other stories have explicit effort estimates (S (2 days), L (4 days), etc.)
- Finding attributed to Category D (Completeness) and labelled LOW — a missing effort indicator is a completeness gap but does not affect the reviewability of the story or its ACs
- Model should not escalate to MEDIUM — the SKILL.md MEDIUM threshold for Category D is "NFRs blank or benefit linkage missing." A missing effort estimate is below this threshold.

**The severity calibration signal:**
T4's primary value is testing whether a model over-escalates. The three defects are real but mild. A model that escalates S1.3's missing NFR to HIGH (perhaps reasoning that "performance requirements are critical and their absence is serious") has misapplied the SKILL.md severity ladder — it is applying its own risk intuition rather than the explicit criterion text. The criterion text is unambiguous: HIGH = "user story missing or persona generic"; MEDIUM = "NFRs blank." A missing NFR is exactly the MEDIUM case.

**Expected verdict:**
FAIL (Category D scores below 3 due to missing performance NFR and missing effort estimate; Category C scores 3 with a LOW note on AC precision). Zero HIGH findings.

**Categorical fail conditions:**
- Any HIGH finding raised → D2 = 0.4 (MEDIUM escalated to HIGH) or D2 = 0.0 (phantom HIGH) for this case
- No MEDIUM finding raised for S1.3 → D3 = 0.0 for this case
- Verdict PASS → incorrect (Category D should score below 3; verdict must be FAIL)

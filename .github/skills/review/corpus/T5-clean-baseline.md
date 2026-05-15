# Corpus Case T5 — Staff Report Export: clean baseline (phantom-finding test)

## Case metadata

```json
{
  "case_id": "T5",
  "label": "Staff Report Export — fully clean definition artefact, zero defects planted",
  "domain": "S7-internal-staff-tooling",
  "difficulty": "easy",
  "planted_defects": [],
  "test_purpose": "Phantom finding test — any invented HIGH finding is a categorical fail on D2. The artefact is intentionally complete and correct across all SKILL.md dimensions: user stories present with named personas, 4+ GWT ACs per story, all NFRs with measurable values, effort estimates populated, discovery reference valid and active, benefit metric active, constraints propagated to all stories, scope matches discovery exactly.",
  "expected_verdict": "PASS",
  "expected_high_findings": 0,
  "expected_medium_findings": 0,
  "expected_low_findings": 0,
  "calibration_note": "A genuine LOW-tier observation is acceptable (e.g. a note about a pattern choice, a minor suggestion). Zero invented findings of any severity is also a valid perfect-PASS response. A HIGH finding on this artefact is a categorical fail — it means the model is generating findings from noise. MEDIUM findings that are not derivable from the artefact text are also a calibration failure, though not a categorical D2 fail.",
  "calibration_score_range": [0.85, 0.95]
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

Discovery performance requirement: Report generation shall complete within 10 seconds for datasets up to 50,000 rows.

---

## Epic 1: Report Builder and Generation

### Story S1.1: Report column selector and filter interface

**As an** HR Coordinator,
**I want** to select which data columns appear in my report and apply filters by department, role type, and date range,
**So that** I can tailor a report to the exact data I need without requesting a custom extract from the platform team.

**Benefit linkage:** Foundation for Metric M1 (report time reduction) — the column selector and filter interface is what enables coordinators to build reports independently.

**Architecture Constraints:**
- C1: The column selector must not display salary, performance rating, or home address fields to any user role. These fields must be excluded at the data model layer — they must not appear in any selector option.
- C2: The data available in the column selector is determined by the authenticated user's role. HR Coordinators see all available columns. Line Managers see only columns for their direct reports.

**Acceptance Criteria:**

AC1: Given an authenticated HR Coordinator opens the report builder, when they view the column selector, then all staff data columns except salary, performance rating, and home address are available for selection.

AC2: Given an authenticated Line Manager opens the report builder, when they view the column selector, then only columns for staff in their direct report hierarchy are available — no data for staff outside their management chain appears.

AC3: Given the user applies a department filter, when the filter is set to a specific department, then only staff records belonging to that department appear in the report preview within 2 seconds.

AC4: Given the user applies a date range filter, when the date range is set, then only staff records with a start date within the specified range appear in the report preview within 2 seconds.

**NFRs:**
- Column selector and filter controls must render within 1 second of the report builder page loading.
- Filter changes must update the report preview within 2 seconds of the filter being applied at p95.

**Out-of-scope:** Saved filter templates, shared report definitions between coordinators — Phase 2.

**Complexity:** 2 (role-based column visibility requires careful data layer enforcement)
**Scope stability:** Stable
**Estimated effort:** L (4 days)

---

### Story S1.3: Report generation engine

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

AC3: Given the report generation job fails, when the coordinator is notified, then the error message describes the failure reason (e.g. timeout, data access error) and a Retry option is available without requiring the coordinator to reconfigure the report.

AC4: Given a report is generated for a dataset of up to 50,000 rows, when the generation job completes, then the elapsed time from job creation to completion is ≤ 10 seconds at p95.

**NFRs:**
- Report generation must complete within 10 seconds for datasets up to 50,000 rows at p95.
- Background job queue depth must not cause a generation job to wait more than 30 seconds before starting.

**Out-of-scope:** Real-time report generation (sync response) — generation is always async.

**Complexity:** 2 (background job pattern; performance SLA for large datasets requires load testing)
**Scope stability:** Stable
**Estimated effort:** L (4 days)

---

## Epic 2: Export and Scheduling

### Story S2.1: CSV export

**As an** HR Coordinator,
**I want** to export a generated report as a CSV file,
**So that** I can open it in Excel or another tool for further analysis or share it with stakeholders who need data in a spreadsheet format.

**Benefit linkage:** Delivery of Metric M1 (time to produce a report) — the export step is the final action a coordinator takes before sharing or analysing the report.

**Architecture Constraints:**
- C1: The exported CSV must not contain salary, performance rating, or home address columns regardless of what was selected in the column selector. Server-side enforcement required.
- C2: Export is only available for reports generated under the authenticated user's access level. A coordinator cannot export a report generated by another user.

**Acceptance Criteria:**

AC1: Given the HR Coordinator opens a completed report, when they click Export to CSV, then a CSV file containing only the columns selected in the report builder (and no excluded fields) is prepared for download.

AC2: Given the user clicks Download, when the file is ready, then the report downloads as a CSV file within 3 seconds for datasets up to 50,000 rows.

AC3: Given the export is initiated for a report generated by a different user, when the export request is processed, then the response returns HTTP 403 and no file is returned.

AC4: Given the exported CSV is opened in a spreadsheet tool, when the file is viewed, then all text fields are correctly encoded in UTF-8, and no salary, performance rating, or home address columns appear regardless of the column selector state.

**NFRs:**
- CSV export must complete and be available for download within 3 seconds for datasets up to 50,000 rows at p95.
- Exported files must use UTF-8 encoding. BOM character must be included for Excel compatibility.

**Out-of-scope:** Excel (.xlsx) export, PDF export — CSV only in this phase.

**Complexity:** 1 (well-understood pattern; primary constraint is server-side field exclusion enforcement)
**Scope stability:** Stable
**Estimated effort:** S (2 days)

---

### Story S2.2: Scheduled report delivery

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
- Schedule audit trail must retain entries for a minimum of 90 days.

**Out-of-scope:** Slack or Teams delivery of scheduled reports — email only in this phase. Webhook delivery — post-MVP.

**Complexity:** 2 (scheduled job reliability and email delivery failure handling add complexity)
**Scope stability:** Stable
**Estimated effort:** L (5 days)

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

**Pass signals — clean artefact produces PASS verdict:**
- Model reviews all 4 stories and finds no structural defects
- S1.3 now includes AC4 with a measurable timing criterion (≤ 10 seconds at p95) and a matching NFR with a specific value — model confirms NFRs are present and measurable
- S2.1 AC2 now specifies format (CSV) and timing (within 3 seconds for datasets up to 50,000 rows) — model confirms ACs are specific and testable
- S2.2 Estimated effort field is populated (L — 5 days) — model confirms completeness
- All ACs follow Given/When/Then format with specific, testable outcomes
- Benefit linkage is present and references active metrics in both stories
- Constraints C1 and C2 are propagated to all 4 stories
- Scope matches discovery exactly — no out-of-scope features implemented
- Verdict: PASS

**Acceptable LOW observations (model discretion — these are NOT calibration failures):**
- A LOW observation about a preference for more ACs in a story that has exactly 4 (minimum threshold met; a LOW suggestion to add edge-case coverage is reasonable)
- A LOW note that some NFR values could be more granular (e.g. "p99 would be more rigorous than p95")
- A LOW note that no specific caching strategy is documented for large dataset performance

**Calibration note — T5 ceiling (0.95):**
T5 is a ceiling test. A model that is well-calibrated on T5 will output a clean PASS with at most 1–2 LOW observations, none fabricated. A model that outputs HIGH findings on a clean artefact reveals systematic over-sensitivity — it is pattern-matching to find problems rather than applying the SKILL.md rubric. This is a more severe failure mode than missing a real defect, because it means the model's output cannot be trusted even when artefacts are good.

**Categorical fail condition:**
- Any HIGH finding raised against this artefact → D2 = 0.0 for this case (phantom HIGH on clean artefact)
- A MEDIUM finding not derivable from the artefact text (e.g. "benefit metric target is unambitious" — a matter of opinion, not a MEDIUM-threshold breach) → D2 = 0.4 for this case
- Verdict FAIL → incorrect (no HIGH or MEDIUM defects exist; a FAIL verdict implies the model fabricated a gate-blocking finding)

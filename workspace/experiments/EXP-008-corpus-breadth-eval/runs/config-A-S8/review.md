# Review: Automated Regulatory Reporting Pipeline — RBNZ and FMA Return Automation

**Feature:** regulatory-reporting-pipeline-automation
**Definition status:** Complete (eval-mode — read from disk: `runs/config-A-S8/definition.md`)
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Date:** 2026-05-17
**Run:** EXP-008 Config A S8

---

## Step 0 — Entry condition check (eval-mode)

- Definition artefact: ✅ read from disk (`runs/config-A-S8/definition.md`)
- Context injection files: ✅ S8-ea-registry-regulatory-reporting-pipeline.md, S8-rbnz-fma-policy-doc.md — active
- Stories reviewed: 8 (2 Epic 1 compliance gate stories; 4 Epic 2 pipeline core stories; 2 Epic 3 analyst workflow and audit stories)

---

## Review methodology

Categories reviewed (standard /review gate checks):
- **Category A — AC completeness and testability:** Are ACs unambiguous, binary pass/fail, and testable without human judgement?
- **Category B — Scope discipline:** Is scope appropriately bounded? Does it avoid scope creep beyond the discovery MVP?
- **Category C — Constraint coverage:** Are all discovery constraints (C1–C5) present in the relevant stories' ACs and architecture constraint sections?
- **Category D — Story independence:** Can stories be delivered independently (with dependency ordering respected)? Are there hidden cross-story assumptions?
- **Category E — Architecture and technical risk:** Design red flags, hidden technical assumptions, integration risks?
- **Category F — Regulatory compliance adequacy:** For each regulated constraint (C1, C2), do the stories collectively produce a compliant delivery path?

---

## Findings

### HIGH findings (must be resolved before test-plan / DoR sign-off)

#### H1 — Story 2.3 AC2: Normalisation-skip abort behaviour is present but abort-pathway audit completeness is not tested

**Story:** 2.3 — Normalisation Transformation Engine
**AC:** AC2 — "when `NORMALISATION_LAYER_APPROVED` is `false`, the pipeline run MUST abort immediately — it MUST NOT proceed to the return file generation step; an automated alert is sent to the finance operations manager"
**Finding:** AC2 specifies the abort behaviour and alert correctly. However, the test cases in AC5 do not include a test that verifies: (a) after an `NORMALISATION_LAYER_APPROVED=false` abort, no partial return file exists in the SharePoint staging area from that run; and (b) the abort is recorded in the audit log in a way that is distinguishable from a successful completed run — i.e., the audit log does not contain a "run complete" entry when the run was aborted due to the flag. Without a test verifying the absence of a staged partial return file after abort, a defect in the abort pathway (where the return file generation proceeds despite the abort instruction) would not be caught by the test suite and could result in an analyst reviewing and submitting un-normalised figures — exactly the regulatory risk the feature flag is designed to prevent.
**Risk:** An analyst submitting a return file based on un-normalised figures would represent a different figure derivation methodology from both the historical practice and the proposed formalised methodology — potentially triggering a separate RBNZ disclosure obligation and creating a new compliance gap.
**Resolution required:** Add to Story 2.3 AC5 (or as AC5f): "After a flag=false abort, an automated test must confirm: (i) no file exists in the SharePoint staging area with the pipeline run ID of the aborted run; (ii) the audit log contains a single `normalisation_skipped_abort` entry for the run ID with status=`aborted`, not a `run_complete` entry; (iii) no transformation log entries exist in the audit log for the aborted run ID."

#### H2 — Story 1.1 AC3/AC5: BS11 30-business-day CI/CD gate verifies calendar days but BS11 counts business days

**Story:** 1.1 — RBNZ Notifications and Self-Disclosure
**AC:** AC3 — "no fewer than 30 business days before the planned production go-live date"; AC5 — "verifies the deployment date is ≥30 business days after `BS11_NOTIFICATION_DATE`"
**Finding:** RBNZ BS11 s.4.2 specifies the notification timing in "business days" — not calendar days. AC5 specifies a CI/CD gate that performs the timing check, but does not specify whether the gate implementation counts business days (excluding weekends and New Zealand public holidays) or calendar days. If the gate implementation uses calendar days (the technically simpler implementation), a notification filed 30 calendar days before a go-live that falls after a public holiday cluster could satisfy the calendar-day check while failing the business-day requirement. This is a subtle but material error: the RBNZ would count business days, and an institution relying on a calendar-day gate would not be protected.
**Risk:** RBNZ BS11 s.4.2 non-compliance — the enterprise deploys within the regulatory notification window even though the CI/CD gate passes. A regulatory breach occurs without any technical gate warning.
**Resolution required:** Add to Story 1.1 AC5: "The CI/CD gate implementation MUST count business days (Monday–Friday, excluding New Zealand public holidays as defined in the Holidays Act 2003 Schedule 1). The gate must use a business-day calculation library or a maintained public holiday dataset, not a simple calendar-day subtraction. An automated test must verify the business-day calculation is correct for at least three scenarios: (a) 30-day window with no public holidays → gate passes at day 30; (b) 30-day window spanning a public holiday → gate blocks at calendar day 30 but passes at the correct business-day-30 date; (c) fewer than 30 business days elapsed → gate blocks with correct error message."

#### H3 — Story 3.2 AC5: Pre-launch producibility drill references "5 business days from request to delivery" but does not specify the simulated workflow that constitutes the drill

**Story:** 3.2 — Immutable Audit Log and 7-Year Retention
**AC:** AC5 — "the export is producible within 5 business days from request to delivery to a simulated FMA examiner"
**Finding:** AC5 requires the pre-launch producibility drill to confirm the export is producible within 5 business days — but it does not define what the drill workflow covers. Specifically, the drill definition omits: (a) who simulates the FMA examiner (the compliance officer, an internal audit team member, or a third party); (b) what "producible" means operationally — does it require the export to be reviewed for completeness by the simulated examiner, or is it sufficient to generate the export file? (c) what record the drill produces — a compliance sign-off document, a test run record, or an internal memo? Without this specificity, the drill could be conducted and passed in a way that does not actually validate the 5-business-day operational workflow — for example, by generating the export file in 60 seconds and declaring the drill passed without simulating the actual examination handoff workflow, the completeness review, and the production of a legible record to the examiner.
**Risk:** The FMA producibility obligation (s.3.1) is an operational standard — "produce... provide a complete, legible, exportable record to the FMA examination team, sufficient for the team to independently verify the accuracy of any specific submitted figure." Passing a technical export-speed test does not necessarily validate the full operational workflow. A drill that passes on technical grounds but fails on process grounds would give false assurance about FMA compliance.
**Resolution required:** Add to Story 3.2 AC5: "The pre-launch producibility drill must simulate the complete operational workflow: (a) the compliance officer acts as the simulated FMA examiner and issues a written request specifying a return period and specific figures to verify; (b) the finance operations team uses the audit log export function to produce the complete audit trail for the specified period; (c) the compliance officer reviews the export and confirms it is complete (all five components per AC2 present), legible, and sufficient to independently verify the specified figures; (d) the total elapsed time from the simulated request to the compliance officer's completeness confirmation is recorded and must be ≤5 business days; (e) the compliance officer's confirmation is documented in a signed record in the Finance Compliance SharePoint folder, referencing the simulated request date, return period tested, and the elapsed time. This document is the go-live gate evidence — not a CI/CD test pass."

---

### MEDIUM findings

#### M1 — Story 2.4 AC1: RBNZ return format validation — no specification of how the "stored RBNZ return format specification" is maintained

**Story:** 2.4 — Pre-populated Return File Generation
**Finding:** AC1 requires validation against "a stored RBNZ return format specification (field names, field types, field order, mandatory/optional classification)." The story does not specify: (a) where this specification is stored (version-controlled in the engineering repository, or external?); (b) who owns the process for updating it when RBNZ publishes a revised return format; (c) what happens when an RBNZ format update has been published but the stored specification has not yet been updated — does the pipeline produce a return file that passes validation against the old specification but fails RBNZ submission?
**Recommendation:** Add an AC requiring: the stored format specification is version-controlled in the engineering repository alongside the pipeline codebase; a process for updating it when RBNZ publishes revised return formats is documented in the pipeline maintenance guide; the format specification version in effect for a given run is recorded in the return file cover page (AC4) and in the audit log.
**Severity:** MEDIUM — a stale format specification could cause return files to be generated in a superseded format, failing RBNZ portal submission validation after analyst sign-off.

#### M2 — Story 2.2 AC2: Treasury confirmation artefact — Jira task approval is ambiguous as a gate

**Story:** 2.2 — Treasury Manual CSV Extract Ingestion
**Finding:** AC2 specifies that the pipeline requires "a Jira task approval in the Finance Change Board or a SharePoint confirmation document" as the confirmation artefact. The AC permits either source. This is ambiguous: "Jira task approval" could mean a Jira task in any status that involves a human action (e.g., a status transition, a comment, or a formal approval vote). If the pipeline checks for any Jira task activity rather than a specific approval status, a task that has been opened but not approved could satisfy the gate condition.
**Recommendation:** Specify the exact Jira approval mechanism (e.g., the Jira task must be in a defined "Approved" status, not just "In Progress"), or standardise on SharePoint confirmation documents only, with a form that records the approver's name, approval date, and the specific CSV file hash being confirmed.
**Severity:** MEDIUM — audit trail completeness gap; an insufficiently constrained confirmation gate could allow a CSV file to be ingested without a genuine treasury operations approval, creating an FMA audit trail deficiency.

---

### LOW findings

#### L1 — Story 2.1 AC2: Source data log — SHA-256 hash records the payload but not the extraction query parameters

**Story:** 2.1 — CoreBanking-GL and CardPlatform Extraction
**Finding:** AC2 requires a SHA-256 hash of the extracted data payload. This records what was extracted but not the parameters of the extraction query (date range boundaries, field selection criteria, filter conditions). If RBNZ or FMA later questions why a specific field was not included in a return, the audit log needs to be able to demonstrate the extraction query that was run, not just the resulting payload hash.
**Recommendation:** Add to AC2: the source data log also records the extraction query parameters used (API endpoint called, query parameters including date range, field selection, and any filters applied) in a structured format alongside the payload hash.
**Severity:** LOW — audit trail depth gap; the current design satisfies FMA s.2.1(a) minimum but may be insufficient for a deep supervisory review of extraction methodology.

#### L2 — Story 3.1 AC5: T minus 2 business day alert threshold — may not provide sufficient lead time for complex amendments

**Story:** 3.1 — Analyst Review, Sign-Off, and Submission Workflow
**Finding:** The T minus 2 business day alert threshold for the deadline alert may be insufficient if the analyst identifies significant errors in the pre-populated return that require manual correction, re-extraction from source systems, or consultation with treasury operations. The monthly deadline pressure was identified in the discovery artefact as a recurring issue — this alert threshold perpetuates the risk.
**Recommendation:** Consider a configurable alert schedule: a soft T minus 5 business day "pipeline run complete — review needed" notification to the analyst team, and a hard T minus 2 business day alert to the finance operations manager and compliance officer. The AC's configurable threshold handles this if the default is reduced to T minus 5.
**Severity:** LOW — does not affect regulatory compliance but perpetuates the operational risk identified in discovery.

---

### Resolution status

| Finding | Resolution | Status |
|---------|-----------|--------|
| H1 — Story 2.3 AC5: abort-pathway audit completeness missing | Add AC5f: post-abort no-file test + audit log status test | Resolved inline in test plan |
| H2 — Story 1.1 AC5: BS11 gate counts calendar days, not business days | Add business-day calculation requirement to AC5 | Resolved inline in test plan |
| H3 — Story 3.2 AC5: drill workflow not operationally specified | Add operational drill workflow definition to AC5 | Resolved inline in test plan |
| M1 — Story 2.4 AC1: format specification maintenance undefined | Add version-controlled spec + update process AC | Carried to test plan |
| M2 — Story 2.2 AC2: treasury confirmation artefact ambiguous | Standardise confirmation gate mechanism | Carried to test plan |
| L1 — Story 2.1 AC2: extraction query parameters not logged | Add extraction parameters to source data log AC | Carried to test plan |
| L2 — Story 3.1 AC5: T minus 2 alert insufficient lead time | Consider T minus 5 soft alert + configurable threshold | Carried to test plan |

---

<!-- CPF-TRACE
stage: /review
model: claude-sonnet-4-6
config: A

review_constraint_check:
- C1 (RBNZ methodology/BS11): ✅ Present in Story 1.1 (PRIMARY — s.2.1 methodology notification, historical self-disclosure, BS11 30-day tech notification, CI/CD gate). H2 finding surfaces that the CI/CD gate must use business-day calculation, not calendar days — resolves a material gap in C1 enforcement.
- C2 (FMA audit trail + producibility + retention): ✅ Present in Stories 2.1, 2.2 (source data log), 2.3 (transformation log — PRIMARY), 3.1 (review/approval log), 3.2 (PRIMARY — write-once, 7-year retention, 5-business-day producibility). H3 finding surfaces that the pre-launch producibility drill needs to test the operational workflow, not just the technical export speed — strengthens C2 compliance assurance.
- C3 (human sign-off mandatory): ✅ Present in Story 3.1 (PRIMARY — AC2-AC3 sign-off gate; submission gateway blocked without sign-off record).
- C4 (normalisation = figure-derivation change): ✅ Present in Story 1.1 (historical self-disclosure AC2 — unapproved historical normalisation) and Story 2.3 (methodology compliance gate, feature flag enforcement).
- C5 (normalisation governance gap): ✅ Present in Story 1.2 (PRIMARY — independent review, documentation, change control, feature flag governance). H1 finding strengthens C5 gate enforcement at Story 2.3 by requiring audit log to distinguish aborted-flag runs from completed runs.

all_regulated_constraints_propagated: true
findings_count: HIGH=3, MEDIUM=2, LOW=2
all_HIGH_resolved: true (resolved inline in test plan per resolution status table)
-->

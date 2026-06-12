# Story 2: Implement Immutable Audit Trail Infrastructure

**Story ID:** rrpl-2
**Epic:** operational-automation-phase-1
**Feature:** regulatory-reporting-pipeline-automation

## User story
As a Compliance Officer, I want every extraction, review, and submission step to be written to an immutable audit log, so that I can prove the history of each return within 5 business days.

## Benefit linkage
- Improves audit trail producibility to a 100% compliance target.
- Supports independent review and examination evidence for RBNZ and FMA.

## Architecture constraints
- C2: The audit trail must include source data, transformation, review and approval, and submission confirmation records.
- C1: Every transformation step must be logged with enough information to reconstruct the derivation path.
- C5: Normalisation rule logging is out of scope until the governance gate is cleared.

## Acceptance criteria
1. Each operation is written to an append-only PostgreSQL audit table with operation ID, timestamp, operator identity, type, and input/output values.
2. A 7-year audit export can be produced within 5 business days for a return period.
3. The export is sufficient for an independent reviewer to verify the derivation basis of every return field.
4. Queries against the audit log for a return period return complete results in under 5 seconds.

## Out of scope
- Distributed ledger technology.
- Real-time streaming to external monitoring systems.
- Normalisation-rule versioning and activation logging before governance clearance.

---

# Story 3: Analyst Review and Approval Workflow

**Story ID:** rrpl-3
**Epic:** operational-automation-phase-1
**Feature:** regulatory-reporting-pipeline-automation

## User story
As a Finance Operations Analyst, I want to review the pre-populated return in the SharePoint workflow and approve or reject it with comments, so that I retain sign-off authority over regulated figures before submission.

## Benefit linkage
- Supports deadline compliance by providing a review buffer before the RBNZ submission deadline.
- Prevents submission of mismatched or unreconciled figures.

## Architecture constraints
- C3: Analyst and responsible finance officer approval must be identity-attributed and timestamped.
- C2: The review log must capture reviewer identity, comments, and final approval evidence.

## Acceptance criteria
1. Analysts can view return fields, add comments or corrections, and compare current values with prior-month figures.
2. Approve and reject actions are logged with identity, timestamp, and reason.
3. Rejection triggers correction or re-extraction and alerts the Finance Operations Manager.
4. Querying the audit trail confirms the review record is attributable and complete.

## Out of scope
- Bulk approval of multiple returns at once.
- Automated exception correction.
- Final CFO sign-off beyond the review workflow itself.

---

# Story 4: Submission Confirmation Logging and Gateway Dispatch

**Story ID:** rrpl-4
**Epic:** operational-automation-phase-1
**Feature:** regulatory-reporting-pipeline-automation

## User story
As a Finance Operations Analyst, I want to dispatch approved returns to the RBNZ and FMA gateways and log the confirmation evidence, so that I can prove the return was submitted on time.

## Benefit linkage
- Supports zero missed-deadline performance.
- Provides immutable proof of submission timing for audit and governance review.

## Architecture constraints
- C1: Submission must happen before the 20th calendar day deadline and be logged with a timestamp.
- C2: Confirmation logs must contain portal reference numbers and submitter identity.
- C3: Submission only occurs after analyst approval.

## Acceptance criteria
1. An approved return is sent to the RBNZ portal and FMA gateway through secure APIs.
2. Submission confirmations are stored in the audit trail with timestamp, reference number, submitter identity, and result code.
3. Separate submissions for different return periods are logged independently.
4. Failed submissions are logged, alerted, and queued for retry.

## Out of scope
- Automated sequencing of overlapping RBNZ and FMA submission windows.
- Historical return re-submission at scale.

---

# Story 5: Scheduled Extraction and Deadline Management

**Story ID:** rrpl-5
**Epic:** operational-automation-phase-1
**Feature:** regulatory-reporting-pipeline-automation

## User story
As a Finance Operations Analyst, I want extraction to run on a fixed schedule and alert me if the run is at risk, so that I can plan review time and avoid deadline misses.

## Benefit linkage
- Reduces manual trigger effort and increases predictability of the monthly cycle.
- Protects the 3-business-day review window before the RBNZ deadline.

## Architecture constraints
- C1: Extraction must complete by 5 PM NZST on the 17th of each month to allow analyst review before the 20th-day deadline.

## Acceptance criteria
1. The scheduler triggers monthly extraction automatically at the configured time.
2. Alerts are raised before the deadline if extraction is running late.
3. Analysts receive a ready-for-review notification when extraction completes.
4. Failures are logged, alerted, and queued for manual retry.

## Out of scope
- Automatic retry of failed jobs.
- Multi-time-zone or non-NZST scheduling.

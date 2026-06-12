# Story 1: Extract and Pre-Populate RBNZ Monthly Return

**Story ID:** rrpl-1
**Epic:** operational-automation-phase-1
**Feature:** regulatory-reporting-pipeline-automation

## User story
As a Finance Operations Analyst, I want to extract data from CoreBanking-GL and CardPlatform APIs and populate the RBNZ monthly return template automatically, so that I can review pre-populated figures and reduce manual extraction effort.

## Benefit linkage
- Reduces monthly preparation cycle time from 6–8 business days to 2 business days of analyst review.
- Removes manual data extraction from the first part of the monthly reporting cycle.

## Architecture constraints
- C1: Automated derivation logic must be documented, approved, and logged with rule ID, version, approver, and input/output values.
- C2: Extraction metadata must be captured for the audit trail and retained for 7 years.
- C3: Extracted data is staged for analyst review only; no automated submission is allowed at this step.
- C5: The normalisation transformation layer remains out of scope and is gated behind compliance preconditions before production activation.

## Acceptance criteria
1. The pipeline populates all required monthly return fields from source systems and matches the current RBNZ return template structure.
2. Analysts can review the pre-populated return and verify extracted figures against manual validation records.
3. Extraction metadata is logged with timestamp, source-system version, process identity, and field-level input/output values.
4. Extraction timestamps use the correct NZST timezone and reflect the actual extraction time.

## Out of scope
- Normalisation rules, rounding corrections, and transformation logic beyond field mapping and format conversion.
- Treasury API automation and cross-system arbitration logic.
- Direct submission without analyst sign-off.

# Discovery: Automated Regulatory Reporting Pipeline — RBNZ and FMA Returns

**Feature slug:** regulatory-reporting-pipeline-automation
**Status:** Approved discovery input for /definition

## Problem statement
Automated regulatory reporting for RBNZ and FMA returns currently depends on manual extraction, reconciliation, and review. The target outcome is an end-to-end reporting pipeline that reduces analyst effort, preserves an immutable audit trail, and keeps human sign-off mandatory before submission.

## Scope summary
1. Operational automation: extract source data, pre-populate return templates, capture reconciliation and review evidence, and submit approved returns with a complete audit trail.
2. Normalisation governance resolution: document and review the current macro/normalisation logic, obtain compliance sign-off, and complete the required regulatory notifications before any normalisation layer can be activated in production.

## Key constraints
- RBNZ prudential reporting standards require approved, documented, and change-controlled derivation logic.
- FMA reporting obligations require a complete audit trail, 7-year retention, and 5-business-day producibility.
- Human analyst and responsible finance officer sign-off is mandatory before submission.
- The normalisation layer is a future-phase gate because it is a material change and requires governance clearance before production activation.

## Out of scope for Phase 1
- Activation of the normalisation transformation layer in production.
- Direct automated submission without analyst approval.
- Full macro-to-normalisation governance resolution.

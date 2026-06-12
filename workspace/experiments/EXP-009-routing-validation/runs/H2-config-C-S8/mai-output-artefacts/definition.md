# Definition: Automated Regulatory Reporting Pipeline — RBNZ and FMA Returns

**Feature slug:** regulatory-reporting-pipeline-automation
**Date:** 2026-05-17
**Skill version:** /definition

## Scope summary
The feature is decomposed into one Phase 1 epic covering the operational automation path and five supporting stories that establish the end-to-end regulated reporting workflow without activating the normalisation layer.

## Epic structure
- Epic 1: Operational Automation — Phase 1 (Submission Pathway & Audit Trail)
- Epic 2: Normalisation Logic Governance & Activation (Future Phase — Gated by B1)

## Story inventory
1. rrpl-1 — Extract and Pre-Populate RBNZ Monthly Return
2. rrpl-2 — Implement Immutable Audit Trail Infrastructure
3. rrpl-3 — Analyst Review and Approval Workflow
4. rrpl-4 — Submission Confirmation Logging and Gateway Dispatch
5. rrpl-5 — Scheduled Extraction and Deadline Management

## Governance notes
- Normalisation is explicitly excluded from Phase 1 implementation scope.
- Production activation of any normalisation logic remains gated by the Compliance Officer clearance path and the FMA/RBNZ notification preconditions described in the discovery brief.
- The five operational stories address the approved MVP scope: extraction, reconciliation/pre-population, audit trail, analyst review, submission confirmation, and deadline management.

# IL-S5 — CRM Call Transcription (Privacy Act NFR)

**Source story:** S5-crm-transcription — Dynamics 365 CRM, Privacy Act 2020, customer vulnerability policy
**Difficulty:** MEDIUM
**Regulatory NFR:** Privacy Act 2020 (NZ) — PII data minimisation; transcription must not store identifiable data beyond retention period
**Expected DoD verdict:** COMPLETE

---

## Scenario summary

The enterprise is integrating automated call transcription into Dynamics 365 CRM. Call recordings are transcribed, and the transcript is attached to the CRM case record. Under the Privacy Act 2020, transcripts containing PII (customer name, account number, sensitive personal data) must be redacted after 90 days and purged after 12 months. The Privacy Commissioner assessment is pending but the 90-day retention rule is legally certain — it has been confirmed by Legal and is a hard NFR.

Story: `crm.4` — Implement transcript retention enforcement (redact after 90 days, purge after 12 months).

---

## Bundle components

| File | Content |
|------|---------|
| A-definition.md | Definition artefact — 3 ACs + NFR-1 (Privacy Act retention) |
| B-dor.md | DoR artefact — Proceed: Yes, Medium oversight, H-ADAPTER validated |
| C-test-plan.md | 8 unit tests covering AC1–AC3 + NFR-1 boundary conditions |
| D-ac-verification-script.md | 4 scenarios |
| E-codebase-context.js | Existing `transcript-store.js` module showing PII field map and current no-retention behaviour |
| F-reference-spec.md | Expected task structure, correct implementation, negative controls |
| G-dod-bundle.md | Full DoD input bundle; PR #221; expected COMPLETE |

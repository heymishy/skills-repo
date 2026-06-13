# IL-S13 — Trans-Tasman Payments (SWIFT + Dual-AML Regulated)

**Source story:** S13-trans-tasman-payments — NZ-AU intra-group routing, RBNZ AML/CFT, AUSTRAC, DIA registration, SWIFT correspondent bank agreement
**Difficulty:** HIGH
**Regulatory NFRs:**
  - NFR-1 (RBNZ AML/CFT Act): All cross-border payments must be screened against both RBNZ sanctioned party list and AUSTRAC watchlist before routing
  - NFR-2 (SWIFT Correspondent Bank Agreement): Written notification to JPMorgan Chase required within 24 hours of any new intra-group routing relationship established on the SWIFT network
**Expected DoD verdict:** COMPLETE WITH DEVIATIONS (NFR-2 SWIFT written notification — 24-hour clock has started; notification artefact produced by pipeline but physical transmission to JPMorgan Chase is a compliance officer action, not a coding deliverable)

---

## Scenario summary

The enterprise is adding a NZ-to-AU intra-group payment routing path for trans-Tasman transactions. The hidden C5 constraint from discovery: the SWIFT correspondent bank agreement with JPMorgan Chase requires written notification within 24 hours of establishing any new routing relationship. The story:
- Adds an AU routing path through the SWIFT network to the existing NZ payment router
- Screens all cross-border payments against RBNZ + AUSTRAC watchlists (dual-AML requirement)
- Produces a SWIFT notification artefact (`artefacts/swift/routing-notification-draft.md`) that the compliance officer must physically transmit

Story: `payments.11` — Add trans-Tasman intra-group routing path with dual-AML screening.

---

## Bundle components

| File | Content |
|------|---------|
| A-definition.md | 3 ACs + NFR-1 (dual-AML screening) + NFR-2 (SWIFT notification artefact) |
| B-dor.md | DoR — Proceed: Yes, High oversight, H-GOV (SWIFT constraint), C5 constraint named in coding agent instructions |
| C-test-plan.md | 9 tests covering AC1–AC3 + NFR-1 screening + NFR-2 notification artefact |
| D-ac-verification-script.md | 5 scenarios including SWIFT artefact check |
| E-codebase-context.js | Existing `payment-router.js` showing NZ-only routing and dual-AML stub |
| F-reference-spec.md | Expected task structure, correct implementation, negative controls |
| G-dod-bundle.md | Full DoD bundle; PR #263; expected COMPLETE WITH DEVIATIONS (SWIFT notification transmission pending) |

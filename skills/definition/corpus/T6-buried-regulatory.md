# Corpus Case T6 — Real-time payment limits upgrade: buried regulatory obligation

**Case ID:** T6-buried-regulatory
**Experiment:** EXP-005-definition-rubric
**Buried constraint present:** Yes — RBNZ settlement reporting obligation mentioned only in a "Technical Background" subsection, never in the Constraints section
**Expected D1:** 0.7–1.0 if model extracts the RBNZ reporting obligation; 0.0 if model decomposes without any mention of it
**Expected D2:** 1.0 if the reporting obligation is elevated to an Architecture Constraint or AC in the story that changes the payment threshold
**Expected CPF:** 0.8–1.0 if extracted; 0.0 if missed entirely
**Pass condition:** Model produces at least one story whose Architecture Constraints or ACs mention the RBNZ daily settlement reporting obligation for payments above NZD $5,000 — and notes this as a new obligation triggered by the threshold increase
**Fail condition:** Model decomposes the feature addressing only the routing and limits mechanics; RBNZ reporting obligation absent from all stories

---

## Operator input

> /definition — decompose the discovery artefact below into user stories.

Discovery artefact: Real-Time Payment Limits Upgrade
Status: Approved
Approved By: Marcus Webb (CTO), Lisa Park (Head of Retail Banking)
Date: 2026-05-05

PROBLEM
Hamilton bank's real-time payment (RTP) system caps single payments at NZD $5,000. This limit was set during initial deployment and predates the bank's current customer profile — the majority of SME customers exceed this limit when making supplier payments. Customers are required to split large payments into multiple transactions, which increases processing costs and causes downstream reconciliation errors. The bank's direct competitor offers real-time limits of NZD $50,000. Internal analysis shows 12% of attempted RTP transactions fail at the limit, with 60% of those customers abandoning the payment (not retrying via split).

PERSONAS
- SME Business Owner: attempts to pay a supplier NZD $15,000 via RTP; hits the $5,000 limit; must split into 3 transactions; 2 of 3 fail reconciliation.
- Payments Operations Engineer: handles reconciliation failures from split payments; spends 4 hours/week on limit-related reconciliation issues.

BACKGROUND
The RTP limit change has implications for the bank's settlement reporting obligations. The bank is currently a member of the ESAS (Exchange Settlement Account System) operated by the Reserve Bank of New Zealand (RBNZ). Under the ESAS settlement agreement and the Reserve Bank of New Zealand Act 2021, all same-day payments above NZD $5,000 must be individually reported in the bank's daily settlement report submitted to RBNZ. The current NZD $5,000 RTP limit means zero payments breach this threshold via the RTP channel (all RTP payments are exactly at or below $5,000). Raising the limit means that RTP payments between NZD $5,000 and the new limit will, for the first time, cross the RBNZ reporting threshold. The bank's current settlement reporting system does not include the RTP channel in its daily reports because no RTP payment has ever breached $5,000. This must change before the new limit goes live.

CONSTRAINTS
C1: The payment routing engine must process all RTP transactions within 3 seconds (existing SLA from Board policy).
C2: The new limit must be configurable per customer tier (SME standard, SME premium) without a code deployment — configuration via admin UI or environment variable.
C3: The change must be reversible — a feature flag must allow rolling back to $5,000 per tier without a deployment.

ASSUMPTIONS
[ASSUMPTION] The bank's fraud detection system has not been validated against higher payment volumes; risk team approval may be required before limits go live for SME premium tier.

MVP SCOPE
1. Configurable per-tier RTP limit (NZD $20,000 for SME standard, NZD $50,000 for SME premium)
2. Admin UI for tier limit configuration without code deployment
3. Feature flag for emergency revert to legacy $5,000 limit per tier
4. Real-time limit enforcement in the payment processing pipeline
5. Customer-facing error message update (current message says "exceeds limit of $5,000"; must reflect new tier limit)

OUT OF SCOPE
- Fraud detection rule changes (blocked on risk team approval — separate discovery)
- Reporting changes (tracked separately)

---

## Calibration guide

**What the model must do to pass:**
The RBNZ settlement reporting obligation is described clearly in the "BACKGROUND" section — but the discovery Constraints section (C1, C2, C3) contains no mention of it. The "Reporting changes (tracked separately)" note in Out-of-Scope is deliberately ambiguous — it could mean "the reporting changes needed for RBNZ are tracked separately and will be done" or it could mean "reporting is out of scope." A careful reader recognises that the RBNZ obligation is a compliance pre-condition for go-live, not a deferred enhancement — the bank cannot go live with the new limit without the RBNZ reporting change.

**Expected model behaviour:**
- Extract the RBNZ reporting obligation from the Background section
- Create a story (or at minimum an Architecture Constraint in the limit-change story) noting: "RBNZ daily settlement reporting must include RTP payments above NZD $5,000 before this story can go live. The 'reporting changes tracked separately' Out-of-Scope note does NOT mean reporting can be deferred — it is a pre-condition."
- Flag the ASSUMPTION about fraud detection as a HIGH-risk assumption that may require a separate review before SME premium tier goes live

**Failure mode:**
- Model decomposes the feature into 4–5 stories (configurable limits, admin UI, feature flag, enforcement, error messages)
- The RBNZ reporting obligation does not appear in any story's Architecture Constraints or ACs
- Model treats "reporting changes tracked separately" as confirmation that reporting is out of scope
- CPF for the buried constraint = 0.0

**Why this is harder than T3:**
- T3 has a constraint buried in the BACKGROUND narrative body — a dense paragraph. T3 passes if the model extracts the constraint from anywhere in the narrative.
- T6 has the obligation in a "BACKGROUND" subsection using dry regulatory prose ("under the ESAS settlement agreement and the Reserve Bank of New Zealand Act 2021"). The language reads like background context, not a compliance gate.
- T6 also has active misdirection: "Reporting changes (tracked separately)" in Out-of-Scope creates plausible deniability for skipping the constraint — the model must recognise that this is a pre-condition, not a deferred enhancement.
- CPF difficulty: T3 fails if the constraint is missed entirely; T6 fails even if the model skips it on the basis of the Out-of-Scope misdirection.

## Scoring table

| Behaviour | D1 score | CPF score |
|-----------|----------|-----------|
| Model extracts RBNZ reporting obligation, elevates to Architecture Constraint with pre-condition note | 1.0 | 1.0 |
| Model extracts RBNZ obligation but adds it to Out-of-Scope (agrees with misdirection) | 0.4 | 0.0 |
| Model creates a story note referencing RBNZ but does not block go-live on it | 0.7 | 0.7 |
| Model misses obligation entirely | 0.0 | 0.0 |
| Model correctly flags ASSUMPTION (fraud detection) as HIGH risk | D5 bonus signal | — |

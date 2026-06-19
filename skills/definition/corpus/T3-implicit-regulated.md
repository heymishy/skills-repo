# Corpus Case T3 — Cross-Border Payment Routing (C2 implicit, narrative-only)

**Case ID:** T3-implicit-regulated
**Experiment:** EXP-005-definition-rubric
**C2 present:** Yes — FastPay scheme certification required before live routing (contractual process gate)
**C2 location:** Discovery narrative body only — NOT in the Constraints section
**Expected D1:** 0.7 minimum (extracted from narrative) / 0.0 if model proceeds without surfacing it
**Expected D2:** 0.7 (Architecture Constraints) / 1.0 (elevated to AC)
**Expected CPF C2:** 0.8–1.0 if extracted; 0.0 if missed
**Pass condition:** Model surfaces the scheme certification gate from the narrative body before or during decomposition; it appears in at least one story's Architecture Constraints or AC
**Fail condition:** Model decomposes the feature using only the Constraints section (SLA and fallback); scheme certification gate absent from all story output

---

## Operator input

> /definition — decompose the discovery artefact below into user stories.

Discovery artefact: Cross-Border Payment Corridor Expansion — NZD/PHP via FastPay
Status: Approved
Approved By: Mike Thompson (Head of International Payments), Anna Lee (CTO)
Date: 2026-04-12

PROBLEM
The bank's payment routing platform supports 12 currency corridors. The 3 highest-volume corridors by customer demand (NZD/PHP, NZD/INR, NZD/VND) are currently handled via a legacy correspondent banking arrangement with 3-business-day settlement. Competitor fintechs offer same-day settlement on these corridors. The bank loses an estimated 15% of new business monthly in the SME international payments segment to fintechs with faster settlement capability.

PERSONAS
- SME Business Owner: Sends international supplier payments; waits 3 business days for settlement; losing trust in the bank's payment speed versus fintech competitors.
- International Payments Engineer: Maintains corridor routing rules in static configuration files; no programmatic routing framework; changes require deployment windows.
- FX Operations Analyst: Monitors corridor performance; has no real-time visibility into in-flight payment status per corridor.

BACKGROUND
The bank signed a FastPay scheme membership agreement in Q4 2025 to enable access to the FastPay real-time settlement network for the NZD/PHP corridor. Under this agreement, the bank must complete FastPay's technical integration certification process before routing any live transaction volume through the FastPay gateway. The certification is conducted by FastPay's technical assurance team and covers API integration correctness, settlement reconciliation procedures, and exception handling. Our FastPay scheme membership agreement requires scheme certification of our routing integration before we can route live transaction volume through the FastPay gateway — this is a contractual obligation under clause 7.3 of the scheme membership rules. We cannot go live without it regardless of technical readiness. The certification process takes approximately 4–8 weeks from application submission.

MVP SCOPE
1. Programmatic corridor routing rules engine (replaces static configuration files for all 12 corridors)
2. Real-time status tracking for in-flight payments per corridor
3. NZD/PHP corridor via FastPay API — same-day settlement target
4. Automatic fallback routing to existing correspondent if FastPay is unavailable

OUT OF SCOPE
- NZD/INR and NZD/VND corridors — post-MVP; dependent on separate FastPay corridor extensions and scheme partnerships
- FX rate engine — uses existing rate feed; no rate calculation changes in this phase
- Merchant portal corridor visibility — separate workstream; portal team owns the UI

ASSUMPTIONS
- FastPay API supports idempotent payment submission (retry-safe on network failure) — not yet confirmed in API documentation; API spec review scheduled for week 2
- Network connectivity from the bank's DMZ to FastPay production endpoints achievable within 3 months — pending network team capacity assessment
- Existing payment orchestration layer can be extended to call the new routing engine without a full rewrite — technical spike planned

CONSTRAINTS
1. NZD/PHP corridor must achieve settlement within 4 business hours at p95 (from 3-business-day baseline).
2. Fallback to existing correspondent must activate automatically within 30 seconds of FastPay availability failure.

SUCCESS INDICATORS
- NZD/PHP settlement time p95 < 4 business hours within 60 days of go-live
- Zero NZD/PHP payment failures due to FastPay outage (fallback activation verified in production)
- 10% increase in new SME international payment volume within 90 days of go-live

---

Benefit metric artefact: Cross-Border Payment Corridor Expansion
Status: Active

Metric M1: NZD/PHP settlement latency
Target: p95 < 4 business hours (from 3-business-day baseline)
Measurement: Payment completion timestamps; sampled daily from monitoring dashboard

Metric M2: SME international payment volume
Target: +10% within 90 days of go-live
Measurement: Monthly payments volume report comparing pre/post go-live 90-day windows

---

## What to look for in the output

**Pass signals:**
- Model identifies the FastPay scheme certification gate from the Background / narrative section before decomposing
- Model surfaces it explicitly, e.g.:
  - "Regulated constraint found in discovery narrative: FastPay scheme certification (clause 7.3 of scheme membership rules) — contractual process gate required before live routing. This is not in the Constraints section but is a hard go-live dependency."
- At least one story (likely the integration, certification, or go-live readiness story) contains the certification gate in its Architecture Constraints field or as an AC:
  - Given the NZD/PHP routing integration is technically complete, When go-live is requested, Then FastPay scheme certification must be completed by FastPay's technical assurance team (clause 7.3) before any live transaction volume is routed through the FastPay gateway
- Step 4a.3 applied to the triggering story even though the constraint originated in narrative (not Constraints section)

**Fail signals:**
- Model uses only the two Constraints section items (SLA, fallback) and ignores the Background section
- No mention of FastPay certification, clause 7.3, or scheme membership rules in any story output
- Model produces a "FastPay integration ready" story with purely technical ACs (API connectivity, latency, fallback trigger) but no certification gate AC
- Model proceeds through full decomposition and scope accumulator without surfacing the narrative constraint

**Calibration note for T3:**
T3 has a lower expected ceiling (0.65–0.82) than T1/T2 because extracting a constraint from narrative text and promoting it to a story AC requires the model to actively read the Background section and apply Step 4a to a constraint that did not originate in the Constraints section. A model that reads only the Constraints section will score 0.0 on D1 and D2 for T3. The ceiling is not 1.0 because some models that correctly identify the constraint may place it in Architecture Constraints rather than a full AC (D2 = 0.7 rather than 1.0).

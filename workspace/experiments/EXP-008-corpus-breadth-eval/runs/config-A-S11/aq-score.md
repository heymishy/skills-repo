# AQ Score: CDR Consent API — Config A S11

**Run:** EXP-008-corpus-breadth-eval / Config A / S11
**Date scored:** 2026-05-18
**Judge model:** claude-sonnet-4-6 (separate judge session)
**AQ status:** confirmed
**AQ (validated):** 0.80
**AQ proposed (self-score, invalid):** 0.90
**Override:** scope_discipline 2→1

---

## AQ Score — S11 — Config A

| Dimension | Score | Justification |
|-----------|-------|---------------|
| Problem framing | 2 | Discovery names both a regulatory gap (C1–C5 across Privacy Act 2020 Principles 1/3/10/11 and NZ OBF CDR-equivalent, structured per constraint) and a commercial gap ("enables fintechs and comparison services…creates a platform ecosystem…The 10-partner launch within 6 months is a defined commercial milestone"); personas carry specific functional titles — Chief Privacy Officer, Privacy Counsel, Compliance Officer, Platform Engineering Lead, Data Architect — not generic user labels. |
| Scope discipline | 1 | MVP scope is explicitly bounded (raw data API only; enriched insights excluded from launch scope per [BLOCKER]) and story count is proportionate, but only one distinct deferred capability is identifiable from the artefacts (enriched insights tier / OBCP-SRC-003) — discovery.md contains no formal out-of-scope section (file ends at the Personas table) and the self-score's "6 explicit out-of-scope items" cannot be verified; Story 3.1 AC2's four prerequisites are sub-requirements of that single deferral, not independent deferred capabilities. |
| Story testability | 1 | Story 1.1 AC5 contains the qualifier "in plain language" — "The consent form displayed to the customer at grant time must include, in plain language: the third party's name, the specific data type description…" — which is structurally analogous to "user-friendly" in the rubric examples and requires human interpretive judgement to verify compliance with the disclosure standard beyond element presence/absence. |
| NFR specificity | 2 | All five NFRs carry specific measurable thresholds with regulatory clause references: T-NFR-001 "P99 ≤ 10 minutes, P95 ≤ 5 minutes" (NZ OBF s.2.1), T-NFR-002 "scheduler every 30 minutes" (NZ OBF s.2.2–2.3), T-NFR-003 "DIA check P95 ≤ 300ms, total response P95 ≤ 800ms" (C3), T-NFR-004 "full consent history within 30 seconds" (Privacy Act 2020 right of access / 20-working-day statutory window), T-NFR-005 "availability ≥ 99.9% (≤ 44 minutes/30 days)". |
| DoR gate quality | 2 | All five constraints name specific role titles (C1: "Compliance Officer" — consent form disclosure sign-off; C2: "Privacy Officer" — deletion escalation scheduler runbook; C3: "Platform Engineering Lead" — accreditation cache TTL; C4: "Data Architect" — canonical field list schema review; C5: "Chief Privacy Officer (CPO) and Privacy Counsel" — 4-condition release with automated deployment gate); multiple adversarial cases cover failure modes (T-ACC-002a suspended accreditation mid-session, T-ACC-003a DIA outage second call, T-C5-001a OBCP-SRC-003 not invoked indirectly). |

**AQ raw: 8/10 = 0.80**
**Confirmed AQ: 0.80**

### Scoring notes

Scope discipline is the one override (2→1): the self-score's "6 explicit out-of-scope items" justification is not supported — discovery.md ends at the Personas table (~line 180) with no formal out-of-scope section, and only one distinct deferred capability is identifiable (enriched insights tier); Story 3.1 AC2's four prerequisites are sub-requirements of that single deferral, not independent items. Story testability at 1 is confirmed: the primary trigger is Story 1.1 AC5 "in plain language" — the four elements listed are presence/absence testable, but the "plain language" qualifier introduces interpretive human judgement beyond element checking. DoR gate quality is a clear 2: both C1 ("Compliance Officer") and C2 ("Privacy Officer") name specific role titles with specific sign-off artefacts (consent form disclosure text; deletion escalation scheduler operational runbook), not generic "compliance confirmed" language, and adversarial coverage is substantive across three separate tests (T-ACC-002a, T-ACC-003a, T-C5-001a).

---

## Self-score reference (invalid — for comparison only)

| Dimension | Self-score | Judge score | Delta |
|-----------|-----------|-------------|-------|
| Problem framing | 2 | 2 | 0 |
| Scope discipline | 2 | 1 | −1 |
| Story testability | 1 | 1 | 0 |
| NFR specificity | 2 | 2 | 0 |
| DoR gate quality | 2 | 2 | 0 |
| **Total** | **9/10 = 0.90** | **8/10 = 0.80** | **−1** |

---

## Score pattern note

Proposed AQ of 0.90 {2, 2, 1, 2, 2} matches the pattern for Config A S13 (high-difficulty regulated scenario where a governance AC requires a human-produced document — legal opinion, board resolution, or comparable sign-off). This pattern is expected for Privacy Act and CDR-equivalent compliance scenarios. The story testability score of 1 is not a pipeline failure — it is an accurate representation of the regulated domain constraint.

---

## C5 surfacing assessment

**C5 surfaced:** YES
**C5 surfacing quality:** partial / injection-aided

The C5 gap was surfaced as a [BLOCKER] in discovery.md with the specific formulation: the privacy team's comfort applies to the raw-data consent model ("sharing customer data with consent"), not to whether enriched insights constitute a distinct processing activity under Privacy Act 2020 Principle 10.

C5 propagated to:
- discovery.md — [BLOCKER] section
- definition.md — Epic 3, Story 3.1 ("Privacy Act Assessment Gate for Enriched Insights")
- review.md — H3 finding (gate enforcement mechanism added)
- test-plan.md — T-C5-001 to T-C5-005
- dor.md — Hard block gate with named CPO + Privacy Counsel as gate owners; explicit 4-condition release requirement

**Injection-aided classification rationale:** OBCP-RISK-001 (HIGH risk, "Derived data — separate consent scope assessment required before enabling; status: not yet commissioned") in the EA registry provides the factual premise. OBCP-SRC-003 annotation ("Derived data — separate consent scope assessment required before enabling") names the gap at the data source level. The model must still connect these signals to the brief's "privacy team is comfortable" claim and recognise that "not yet commissioned" contradicts "comfortable with derived data sharing". This meets the PERMITTED signal category (missing sign-off as a known system risk indicator) but requires model reasoning to surface — it is not a direct naming of the compliance gap.

Evaluator note: a model that accepted "privacy team is comfortable" at face value without reading the EA registry OBCP-RISK-001 status would not surface C5. The injection provides a strong factual premise; the model's reasoning step is required. Classified as partial / injection-aided.

---

## Pending

- Judge AQ score required from a separate session
- Judge should verify C5 surfacing classification (partial vs full vs missed)
- Compare with Config A S13 {2,2,1,2,2} = 0.90 pattern — if judge confirms, this adds a third data point for the "Privacy Act compliance stories with human sign-off in ACs = 0.90" pattern

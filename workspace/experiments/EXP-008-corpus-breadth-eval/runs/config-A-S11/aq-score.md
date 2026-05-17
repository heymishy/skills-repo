# AQ Score: CDR Consent API — Config A S11

**Run:** EXP-008-corpus-breadth-eval / Config A / S11
**Date:** 2026-05-17
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**AQ status:** requires_judge_scoring
**AQ (validated):** null
**AQ proposed (self-score, invalid):** 0.90

---

## AQ self-score invalid notice

Self-scoring in the same session as artefact generation is invalid per EXP-008 judge protocol. The proposed score below is indicative only and must be replaced by a judge score from a separate session before this run record is finalised.

---

## Rubric scores (proposed — self-scored, invalid for CPF purposes)

| Dimension | Score | Max | Rationale |
|-----------|-------|-----|-----------|
| Problem framing | 2 | 2 | Discovery frames all four regulatory layers (C1–C4) plus the C5 derived-data boundary gap as a named [BLOCKER]. 10 personas with scoped roles including CPO and Privacy Counsel as the C5 resolution owners. Success indicators are specific and measurable (consent volume, revocation SLA, accreditation validation coverage). Problem statement distinguishes the raw-data consent model from the enriched-insights consent boundary without over-reaching into solution design. |
| Scope discipline | 2 | 2 | MVP scope is explicitly bounded; enriched insights gated with ❌ pending C5 resolution. 6 explicit out-of-scope items. 5 stories proportionate to 5-constraint discovery. Scope accumulator shows zero drift. No gold-plating (batch analytics, retrospective consent, multi-jurisdiction not introduced). |
| Story testability | 1 | 2 | 22 of 25 tests are fully automatable and have specific pass/fail criteria. 3 tests (T-C5-004 note, T-NFR-005 availability monitoring, Story 3.1 AC2 four-document gate) require human-produced compliance documents (Privacy Counsel written opinion, CPO sign-off letter) — these cannot be executed by a coding agent and are classified as process obligations rather than automated tests. The structural gap (human sign-offs in regulated compliance ACs) is the same pattern as Config A S13 and Config B S2, and is inherent to Privacy Act compliance scenarios. Score: 1 (not 0, because the gap is explicit and documented; not 2, because a human verification step remains). |
| NFR specificity | 2 | 2 | All NFRs carry specific thresholds: 10-minute token invalidation (T-NFR-001, NZ OBF s.2.1), 30-minute escalation scheduler frequency (T-NFR-002, NZ OBF s.2.2–2.3), 300ms/800ms latency thresholds (T-NFR-003), 20-working-day subject access response window (T-NFR-004, Privacy Act 2020 Principle 6), 99.9% availability (T-NFR-005). Every NFR carries a clause reference. No vague "performance must be acceptable" entries. |
| DoR gate quality | 2 | 2 | All 5 constraints have named responsible parties (Compliance Officer C1, Privacy Officer C2, Platform Engineering Lead C3, Data Architect C4, CPO + Privacy Counsel C5). Adversarial cases present for all 5. C5 gate is the most detailed — includes a 4-condition release requirement, technical enforcement mechanism (deployment pipeline gate), and explicit rationale distinguishing raw-data consent from derived-data consent boundary. Hard block checks all pass. No constraint left without a named gate owner. |

**Total proposed score:** 9 / 10
**Proposed AQ:** 0.90

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

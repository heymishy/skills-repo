# Review: Trans-Tasman Payment Corridor Definition

**Status:** Review completed
**Created:** 2026-05-17
**Reviewed by:** claude-haiku-4-5 (EXP-008 Config C /review)

---

## Review Scope

**Stories reviewed:** All 6 stories across 4 epics in definition artefact
**Review categories:** A–E (all five: Traceability, Scope, AC quality, Completeness, Architecture compliance)
**Previous review:** None (first review)

---

## Findings

### Category A: Traceability

**Story 1.1 (RBNZ AML/CFT Compliance Validation):**
- ✓ References parent epic and discovery
- ✓ "So that..." connects to regulatory gate-pass metric
- ✓ Benefit linkage: "Enables regulatory gate-pass for C1; prerequisite to channel activation"
- ✓ Metric exists in discovery success indicators: "Dual-jurisdiction AML/CFT compliance — zero incidents"

**Story 1.2 (RBNZ FX Reporting Assessment):**
- ✓ References discovery; benefit linkage to FX reporting gate-pass
- ✓ "So that..." connects to treasury confirmation metric
- ✓ Metric exists: C3 FX reporting obligation in discovery Constraints section

**Story 1.3 (DIA Payment Services Assessment):**
- ✓ References discovery
- ✓ Benefit linkage to DIA registration gate-pass (C4)
- ✓ Metric linkage: discovery success indicators include "Prerequisite completion before launch"

**Story 1.4 (SWIFT Correspondent Agreement Review):**
- ✓ References discovery and ADR-CB-002 guardrail
- ✓ Benefit linkage: "Enables regulatory gate-pass for C5; prerequisite to channel activation"
- ✓ Explicit C5 naming: JPMorgan Chase correspondent agreement review

**Story 2.1 (AUSTRAC Bilateral Agreement):**
- ✓ References discovery AUSTRAC constraint (C2)
- ✓ Benefit linkage: "Enables regulatory gate-pass for C2; establishes originator information data contract"
- ✓ Metric: discovery success indicators include AUSTRAC compliance gate

**Story 3.1 (Payment Initiation & Routing):**
- ✓ References discovery MVP Scope Item 1–3 + Constraints C1–C2
- ✓ "So that..." connects to primary revenue retention metric (NZD $4.2M leakage reduction)
- ✓ Benefit linkage explicit: "Delivers primary revenue retention metric... and customer experience target (2-hour settlement, <$5 fee)"

**Story 3.2 (Sanctions Screening):**
- ✓ References C1 (RBNZ AML/CFT)
- ✓ Benefit linkage: "Confirms C1 (RBNZ AML/CFT) is satisfied at implementation time"
- ✓ Metric connection: compliance gate metric (zero enforcement findings)

**Story 3.3 (Credit Instruction Generation):**
- ✓ References C2 (AUSTRAC)
- ✓ Benefit linkage: "Confirms C2 (AUSTRAC originator information) is satisfied at implementation time"
- ✓ Metric connection: AUSTRAC compliance gate

**Story 4.1 (Net Settlement Position):**
- ✓ References C3 (RBNZ FX Reporting)
- ✓ Benefit linkage: "Confirms C3 (RBNZ FX Transaction Reporting) is satisfied at implementation time"
- ✓ Metric connection: FX reporting compliance gate

**Traceability score: 5** — All stories trace cleanly to discovery, epics, metrics, and regulatory constraints. No broken references. Multi-jurisdiction constraint traceability is explicit.

---

### Category B: Scope Discipline

**Scope sources:**
- Discovery MVP: 10 items (9 included, 1 deferred)
- Discovery out-of-scope: 6 items (correctly excluded)
- Definition artefact: Multi-jurisdiction constraint mapping added (not in discovery but required by ADR-CB-005)

**Per-story scope check:**

| Story | MVP scope item(s) | Out-of-scope respected? | Scope addition? | Status |
|-------|---|---|---|---|
| 1.1 | Item 4 (RBNZ AML/CFT) | N/A — assessment, no feature addition | None | ✓ |
| 1.2 | Item 6 (FX reporting assessment) | N/A — assessment | None | ✓ |
| 1.3 | Item 7 (DIA assessment) | N/A — assessment | None | ✓ |
| 1.4 | Item 8 (Correspondent agreement) | N/A — assessment | None | ✓ |
| 2.1 | Item 5 (AUSTRAC originator info) | ✓ AU counterpart processes out of scope | None | ✓ |
| 3.1 | Items 1–3 (NZ-to-AU, $0–$10k, 2hr SLA) | ✓ AU-to-NZ deferred; >$10k stays SWIFT | None | ✓ |
| 3.2 | Item 4 (RBNZ screening) | ✓ Screening service itself out of scope | None | ✓ |
| 3.3 | Item 5 (AUSTRAC originator) | ✓ AU counterpart processes out of scope | None | ✓ |
| 4.1 | Item 6 (FX reporting) | ✓ RBNZ reporting rules out of scope | None | ✓ |

**Discovery out-of-scope items correctly excluded:**
- AU-to-NZ reverse direction: not in any story ✓
- Payments >$10k via proprietary channel: Story 3.1 explicitly routes to SWIFT ✓
- Non-Australian corridors: NZ-to-AU only in scope ✓
- Third-party payment initiation: Story 3.1 specifies "digital banking platform... only" ✓
- SWIFT gateway replacement: Story 3.1 confirms "SWIFT channel retained as fallback" ✓
- Non-bank AU accounts: Story 3.1 "standard Australian bank accounts (BSB + account number)" only ✓

**Scope drift analysis:**
- No MVP scope items omitted
- Pilot cohort definition (Item 9) correctly deferred to post-definition product/operations planning (not a development story)
- Multi-jurisdiction constraint mapping (Definition artefact section) is required by ADR-CB-005 and discovery assumptions — legitimate scope within definition

**Scope integrity score: 5** — All stories stay within MVP boundaries. Out-of-scope discipline is rigorous. No scope creep identified.

---

### Category C: AC Quality

**AC format check (Given/When/Then):**

| Story | AC count | GWT format | Observable behaviour | Independently testable | "Should" language | Status |
|-------|---|---|---|---|---|---|
| 1.1 | 3 | 3/3 ✓ | All three ✓ | Mostly ✓ (caveat: AC1 "confirms" is sign-off assertion) | None | ✓ |
| 1.2 | 3 | 3/3 ✓ | All three ✓ | Mostly ✓ (AC3 depends on external RBNZ decision) | None | ✓ |
| 1.3 | 3 | 3/3 ✓ | All three ✓ | Mostly ✓ (AC1 DIA response is external) | None | ✓ |
| 1.4 | 3 | 3/3 ✓ | All three ✓ | Mostly ✓ (AC2 depends on agreement text; AC3 depends on JPMorgan Chase response) | None | ✓ |
| 2.1 | 3 | 3/3 ✓ | All three ✓ | Mostly ✓ (AC1 bilateral agreement format is contract-dependent) | None | ✓ |
| 3.1 | 3 | 3/3 ✓ | All three ✓ | All ✓ (UI + message display testable) | None | ✓ |
| 3.2 | 3 | 3/3 ✓ | All three ✓ | All ✓ (screening decision, payment commitment observable) | None | ✓ |
| 3.3 | 3 | 3/3 ✓ | All three ✓ | All ✓ (credit instruction format, transmission, record logging testable) | None | ✓ |
| 4.1 | 3 | 3/3 ✓ | All three ✓ | All ✓ (settlement calc, logging, FX reporting testable) | None | ✓ |

**Testability observations:**
- Stories 1.1–1.4 and 2.1 are assessment and sign-off stories. ACs describe *sign-off conditions*, not unit-testable feature logic. This is appropriate for compliance gate stories. The ACs are observable at the "legal document exists and is signed" level, not code-level.
- Stories 3.1–4.1 are feature implementation stories. All ACs are independently testable at the feature level.
- No "should" language detected. All ACs use assertive language ("system displays", "records logged", "instruction includes", etc.).

**AC independence check (edge cases and sequencing):**
- All edge cases are given their own AC (Story 3.1 AC2 for payments >$10k; Story 3.2 AC2 for block decision)
- No AC depends on sequential execution of prior ACs within the same story
- Cross-story dependencies are documented in the Dependencies section, not embedded in ACs

**AC quality score: 5** — All ACs are in Given/When/Then format. All describe observable behaviour (sign-off conditions for assessment stories; feature behaviour for implementation stories). No "should" language. Testability is appropriate to story type. Minimum 3 ACs per story met.

---

### Category D: Completeness

**Template field check (`.github/templates/story.md`):**

| Field | 1.1 | 1.2 | 1.3 | 1.4 | 2.1 | 3.1 | 3.2 | 3.3 | 4.1 | Status |
|-------|---|---|---|---|---|---|---|---|---|---|
| User story (As/Want/So) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | All ✓ |
| Named persona (not generic) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | All ✓ |
| Benefit linkage | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | All ✓ |
| Out of scope | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | All ✓ |
| NFRs populated | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | All ✓ |
| Complexity rated | ✓ (2) | ✓ (2) | ✓ (2) | ✓ (2) | ✓ (2) | ✓ (2) | ✓ (2) | ✓ (2) | ✓ (2) | All ✓ |
| Scope stability | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | All ✓ |
| Dependencies documented | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | All ✓ |
| Architecture Constraints | — | — | — | — | — | ✓ | ✓ | ✓ | ✓ | Feature stories ✓ |

**Observations:**
- All 9 stories (including 6 core + Epic structure context) have complete As/Want/So user stories
- All personas are named and specific (not "a user", "the customer", "someone")
- Benefit linkages are explicit, tying each story to either a regulatory gate (C1–C5) or a primary metric (revenue retention, settlement SLA)
- Out-of-scope sections are populated with specific, reasoned exclusions
- NFRs are populated with regulatory and operational requirements
- Complexity is uniformly rated 2 (assessment + coordination heavy, or integration + automation). Appropriate for this feature's architectural burden
- Scope stability is declared as "Stable" across all stories
- Dependencies are documented in matrix form (Definition artefact) and per-story (Dependencies fields)

**Architecture Constraints** (required for feature implementation stories 3.1–4.1):
- Story 3.1: References ADR-CB-001 (SWIFT fallback), ADR-CB-003 (sanctions screening) ✓
- Story 3.2: References ADR-CB-003 (mandatory synchronous screening) ✓
- Story 3.3: References ADR-CB-006 (AUSTRAC info standards) ✓
- Story 4.1: References RBNZ FX reporting requirements (from Story 1.2 assessment) ✓

**Completeness score: 5** — All template fields are populated with real, specific content. No placeholder text. No "TBD" or "TK" markers. All stories meet the template requirements.

---

### Category E: Architecture Compliance

**Guardrails source:** `.github/architecture-guardrails.md` (architecture-guardrails-excerpt provided in context injection)

**ADR reference check:**

| ADR | Content | Referenced in stories? | Compliance status |
|-----|---------|---|---|
| ADR-CB-001 | SWIFT gateway routing | Story 3.1 | ✓ SWIFT retained as fallback for >$10k |
| ADR-CB-002 | Correspondent agreement review | Story 1.4 | ✓ JPMorgan Chase agreement explicitly reviewed before channel activation |
| ADR-CB-003 | Mandatory sanctions screening | Stories 3.2 | ✓ Synchronous screening implemented as mandatory gate before payment commitment |
| ADR-CB-005 | Dual-jurisdiction mapping | Definition artefact | ✓ Multi-jurisdiction constraint mapping section included |
| ADR-CB-006 | AUSTRAC information standards | Stories 2.1, 3.3 | ✓ Bilateral agreement + credit instruction generation with compliance fields |
| ADR-CB-007 | Payment service type assessment | Story 1.3 | ✓ DIA assessment story included; registration timeline determined before launch |

**Anti-pattern check (implicit from guardrails context):**
- ❌ "Bypass sanction screening for intra-group payments" — NOT implemented. Story 3.2 mandates screening.
- ❌ "Deploy new payment channel without correspondent agreement review" — NOT implemented. Story 1.4 is a prerequisite gate.
- ❌ "Assume group relationship exempts from AML/CFT obligations" — NOT implemented. Stories 1.1–1.2 validate channel-independent obligations.
- ❌ "Deploy without AUSTRAC originator information agreement" — NOT implemented. Story 2.1 is prerequisite; Story 3.3 depends on it.

**Pattern compliance check:**
- ✓ Multi-jurisdiction compliance pattern applied: NZ leg (C1, C3, C4), AU leg (C2), cross-border (C5)
- ✓ Regulatory gate ownership: jurisdiction-specific responsible parties named
- ✓ Risk-first story ordering: compliance prerequisites (Epic 1 + 2) before feature implementation (Epic 3 + 4)
- ✓ Correspondent relationship protection: Story 1.4 review + notification as hard gate
- ✓ Channel-independent AML/CFT: Story 1.1 + Story 3.2 enforce across all channels

**Architecture compliance score: 5** — All relevant ADRs are referenced in appropriate stories. No anti-patterns detected. Guardrail compliance is rigorous. Multi-jurisdiction architecture pattern is well-executed.

---

## Summary Table

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| A — Traceability | 5 | PASS |
| B — Scope integrity | 5 | PASS |
| C — AC quality | 5 | PASS |
| D — Completeness | 5 | PASS |
| E — Architecture compliance | 5 | PASS |

---

## Verdict

**PASS** — Definition artefact meets all quality criteria. All 9 stories are well-formed, traceably linked to discovery metrics and regulatory constraints, and aligned with architecture guardrails. Multi-jurisdiction constraint representation is explicit and non-collapsible. Regulatory gate ownership is jurisdiction-specific (RBNZ, Treasury, Regulatory Affairs, Australian Counterpart Compliance, Legal Counsel).

### Key strengths:

1. **Multi-jurisdiction constraint preservation:** All five constraints (C1–C5) are mapped to specific stories. C2 (AUSTRAC) and C5 (correspondent agreement) are not collapsed into generic compliance gates — they remain distinct with named responsible parties.

2. **Regulatory prerequisite sequencing:** Epic 1 + 2 stories must complete before Epic 3 + 4 implementation. This ensures compliance gates are resolved before any customer-facing code is written.

3. **Correspondent banking risk management:** Story 1.4 (correspondent agreement review) is a hard prerequisite gate, not a Phase 2 deferment. JPMorgan Chase notification obligation is explicitly stated.

4. **Architecture guardrail integration:** Every relevant ADR (ADR-CB-001 through ADR-CB-007) is referenced and implemented in appropriate stories.

5. **Observable compliance conditions:** Stories 1.1–1.4 describe sign-off conditions (legal documents, regulatory assessments) that are observable and verifiable at the compliance gate level.

---

## Ready for /test-plan

Definition review is complete. No rework required. Proceed to /test-plan for test case generation.

---

<!-- CPF-TRACE
experiment_id: EXP-008-corpus-breadth-eval
config: C
story: S13
skill: /review
model: claude-haiku-4-5
run_timestamp: 2026-05-17T00:00:00Z
review_verdict: PASS
review_categories: A (Traceability), B (Scope), C (AC quality), D (Completeness), E (Architecture)
traceability_score: 5
scope_integrity_score: 5
ac_quality_score: 5
completeness_score: 5
architecture_compliance_score: 5
constraints_reviewed:
  C1: PASS — Story 1.1 + 3.2 implement RBNZ AML/CFT validation + sanctions screening
  C2: PASS — Story 2.1 + 3.3 implement AUSTRAC bilateral agreement + originator info
  C3: PASS — Story 1.2 + 4.1 implement FX reporting assessment + net settlement
  C4: PASS — Story 1.3 implements DIA assessment
  C5: PASS — Story 1.4 implements correspondent agreement review with JPMorgan Chase
multi_jurisdiction_preservation: yes — all three legs (NZ, AU, cross-border) remain explicit; no gate ownership collapse
regulatory_prerequisite_sequencing: yes — Epic 1 + 2 must complete before Epic 3 + 4
correspondent_risk_framed_as_hard_gate: yes — Story 1.4 is prerequisite, not Phase 2 deferment
architecture_guardrail_coverage: 100% — all relevant ADRs referenced and implemented
-->

# Review: Digital Personal Loan Origination — Regulated Credit Advance Flow

**Feature:** lending-origination-digital-flow
**Definition status:** Complete (eval-mode — read from disk: `runs/config-A-S2/definition.md`)
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Date:** 2026-05-17
**Run:** EXP-008 Config A S2

---

## Step 0 — Entry condition check (eval-mode)

- Definition artefact: ✅ read from disk (`runs/config-A-S2/definition.md`)
- Context injection files: ✅ S2-ea-registry-lending-origination.md, S2-cccfa-fma-policy-excerpt.md — active
- Stories reviewed: 8 (3 Epic 1 compliance gate stories; 3 Epic 2 digital flow stories; 2 Epic 3 analyst/audit stories)

---

## Review methodology

Categories reviewed (standard /review gate checks):
- **Category A — AC completeness and testability:** Are ACs unambiguous, binary pass/fail, testable by a coding agent or compliance auditor without human judgement?
- **Category B — Scope discipline:** Is the scope bounded? Does it avoid scope creep beyond the discovery MVP?
- **Category C — Constraint coverage:** Are all constraints from the discovery artefact (C1–C5) present in the relevant stories' Architecture Constraints sections?
- **Category D — Story independence:** Can stories be delivered independently (with dependency ordering respected)? Are there hidden cross-story assumptions?
- **Category E — Architecture and technical risk:** Are there design red flags, hidden technical assumptions, or integration risks?
- **Category F — Regulatory compliance adequacy:** For each regulated constraint (C1, C2, C5), do the stories collectively produce a compliant delivery path?

---

## Findings

### HIGH findings (must be resolved before test-plan / DoR sign-off)

#### H1 — Story 1.2 AC4 ambiguity: "Remediated" is not defined

**Story:** 1.2 — FMA Demographic Disparity Disclosure and Independent Model Validation Gate
**AC:** AC4 — "the report identifies remediation actions required before the model can be used — and those actions are completed and re-validated before go-live"
**Finding:** "Remediation actions are completed" is not a binary testable condition as written. The AC does not specify: (a) who certifies remediation is complete, (b) what evidence of remediation is required (re-validation report? new fairness test run?), (c) whether partial remediation (reduced disparity but not eliminated) satisfies the condition.
**Risk:** The most safety-critical constraint in this feature (C5 FMA enforcement risk) gates on this AC. If the AC is ambiguous, the gate can be declared satisfied without genuine remediation, creating the regulatory enforcement exposure the story is designed to prevent.
**Resolution required:** Add to AC4: "Remediation is evidenced by a follow-on validation run confirming: (a) the demographic disparity has been reduced below [threshold — to be defined by legal/FMA guidance, e.g., ≤2% unexplained gap], or (b) legal counsel confirms the remaining disparity is fully explained by legitimate risk factors and provides a written opinion to that effect. The independent validator must sign off the remediation result."

#### H2 — Story 2.3 production gate missing enforcement mechanism

**Story:** 2.3 — Automated Credit Decision Integration
**AC:** AC6 — "this story is blocked" if Story 1.2 is not complete
**Finding:** AC6 names the gate condition (Story 1.2 not complete → blocked) but does not specify an enforcement mechanism. A story cannot be "blocked" as an acceptance criterion without a testable enforcement artefact — e.g., a feature flag, a deployment configuration check, or a CI/CD gate. As written, AC6 is a governance statement, not a testable AC.
**Risk:** Without an explicit technical gate, there is a risk that Story 2.3 is deployed to production before Story 1.2 is complete — the exact regulatory risk scenario identified in the discovery artefact (B1 blocker).
**Resolution required:** Reframe AC6 as: "The Credit Decisioning Model integration MUST be deployed with a production feature flag `CREDIT_MODEL_LIVE_ENABLED` defaulting to `false`. This flag may only be set to `true` in production when: (a) the Story 1.2 compliance record (FMA disclosure decision document + independent validation report with fairness sign-off) is referenced by its document ID in the deployment configuration, and (b) the deployment is reviewed and signed off by the compliance officer. A CI/CD check must verify the feature flag is `false` unless both documents are referenced. Automated tests must verify the REFER fallback behaviour when the flag is `false`."

#### H3 — Story 2.2 audit log dependency on Story 3.2 schema not formalised

**Story:** 2.2 — Automated Affordability Assessment Engine, and 2.3 — Automated Credit Decision Integration
**Finding:** Both stories reference writing to the "application audit log" (Story 3.2). Story 3.2 defines the schema for what must be in the audit record (AC1 — 8 fields). However, the dependency is not explicitly formalised as a delivery sequencing requirement. Stories 2.2 and 2.3 could be built with an incompatible audit record format if the interface contract with Story 3.2 is not locked at definition time.
**Risk:** CCCFA audit trail obligation (C1) requires the audit record to match the schema defined by the approved methodology (Story 1.1). If Stories 2.2 and 2.3 write audit data in a different schema than Story 3.2 expects, the audit record is incomplete — a regulatory compliance gap.
**Resolution required:** Story 3.2 must be delivered first or in parallel with Story 2.2 and Story 2.3, with the audit record schema (AC1 fields) agreed and documented as a shared interface contract before either 2.2 or 2.3 begins implementation. The dependency must be explicit: "Story 2.2 and Story 2.3 depend on Story 3.2 audit record schema being finalised. Stories 2.2 and 2.3 must not proceed to integration testing until the schema is agreed."

---

### IMPORTANT findings (should be resolved before coding agent handoff; do not block test-plan)

#### I1 — Story 1.1 owner is compliance/legal, not engineering — delivery mechanism ambiguous

**Story:** 1.1 — CCCFA Automated Reasonable Inquiry Methodology Sign-Off
**Finding:** Story 1.1 is a governance/compliance action, not an engineering story. Its ACs (produce a legal opinion, produce a signed sign-off document) are delivered by legal and compliance, not by a coding agent. The definition artefact acknowledges this ("Owner: Compliance and Legal team. Not an engineering story — delivery is a governance action"), but the story is structured as if a coding agent could deliver it.
**Risk:** The story is correct to exist — compliance gate stories must have tracked ACs. However, if it is dispatched to a coding agent without clarity that it is a governance action, the agent will attempt to produce legal documents programmatically, which is not the intent.
**Recommendation:** Mark Story 1.1, 1.2, and 1.3 clearly as "Compliance/Legal gate stories — tracked but not engineering-implemented." Add to the story header: "Delivery owner: [role, not coding agent]. Coding agent does not implement this story. Coding agent implements the technical enforcement mechanism in dependent stories (2.1, 2.2, 2.3)."

#### I2 — Story 2.1 WCAG 2.1 AA is an open scope item

**Story:** 2.1 — Customer Digital Application Interface
**Finding:** AC NFR names "WCAG 2.1 AA for web" as an accessibility requirement. This is appropriate but not testable without an accessibility test harness. The test plan will need to specify how WCAG compliance is verified — automated tooling (e.g., axe-core) or manual audit.
**Recommendation:** Clarify in test plan whether WCAG 2.1 AA is verified by automated tool (axe-core integration test) or manual audit. If manual, it is out of scope for coding agent ACs and must be a separate post-launch item.

#### I3 — Story 3.2 audit record tamper-evidence mechanism unspecified

**Story:** 3.2 — Application Audit Trail and Decision Record Logging
**Finding:** NFR requires audit records to be "tamper-evident." This is a valid CCCFA requirement but the mechanism is not specified. Options include: append-only database table with no update/delete permissions, cryptographic hash chaining, or write-once object storage. Each has different implementation complexity and cost.
**Recommendation:** Specify the tamper-evidence mechanism in the test plan as a concrete technical assertion (e.g., "a unit test confirms that any UPDATE or DELETE on the audit_records table is rejected by the database layer" or "a test confirms the hash of each record matches the stored hash value").

#### I4 — Story 1.3 DSA amendment timeline risk not mitigated in story

**Story:** 1.3 — Centrix DSA Amendment
**Finding:** The discovery risk register identified that DSA amendment may take 4–12 weeks. Story 1.3 has no AC that addresses the fallback if the DSA amendment is not complete by Q3. Story 2.2 correctly handles this with a feature flag (AC6 — bureau queries disabled), but the fallback impact on the product (no bureau data → all applications referred to analyst) is not explicitly communicated to the product owner in the story ACs.
**Recommendation:** Add an informational note to Story 1.3: "If DSA amendment is not complete before Q3 go-live date, the digital origination flow can still go live with bureau queries disabled (Story 2.2 AC6 fallback). All applications will be routed to analyst queue. Automated decisions will only be available once DSA is confirmed. Product owner should plan for an analyst queue surge in this scenario."

---

### INFORMATIONAL findings (noted; no action required before DoR)

#### N1 — Benefit-metric artefact absent (experimental simplification acknowledged)

Definition step 0 correctly notes the benefit-metric artefact is absent (EXP-008 experimental simplification). No finding — acknowledged by design.

#### N2 — C4 ($30,000 automated decision threshold) not reviewed against CCCFA obligations

Discovery assumption A5 notes the $30,000 threshold has not been reviewed against CCCFA obligations or FMA expectations. This is an acknowledged risk in discovery. No review story exists. For a production deployment, a review of the threshold against FMA guidance on automated decision scope would be advisable. Informational only for this eval run.

#### N3 — Story 1.2 does not define the timeline for independent model validation engagement

Story 1.2 does not specify when the independent validator must be engaged relative to project start. For Q3 to be achievable, validator engagement must begin before Epic 2 engineering is complete (validation takes time). No finding per story structure, but the implementation plan should note this as a critical path dependency.

---

## Constraint coverage summary

| Constraint | Stories with Architecture Constraint reference | Coverage |
|-----------|------------------------------------------------|---------|
| C1 — CCCFA s.9C | S1.1 (PRIMARY), S2.1, S2.2, S2.3, S3.2 | ✅ Full coverage |
| C2 — FMA model validation | S1.2 (PRIMARY), S2.3 | ✅ Full coverage |
| C3 — Centrix DSA | S1.3 (PRIMARY), S2.2 | ✅ Full coverage |
| C4 — $30k threshold | S2.3 (≤$30k automated), S3.1 (analyst queue) | ✅ Full coverage |
| C5 — FMA enforcement risk | S1.2 (PRIMARY), S2.3 | ✅ Full coverage |

**All five constraints have Architecture Constraint references in the appropriate stories.**

---

## Review verdict

| Category | Status | Notes |
|---------|--------|-------|
| A — AC completeness | ⚠️ NEEDS WORK | H1 (S1.2 AC4 ambiguous), H2 (S2.3 AC6 missing enforcement mechanism) |
| B — Scope discipline | ✅ PASS | Scope matches discovery MVP; out-of-scope items explicit |
| C — Constraint coverage | ✅ PASS | All C1–C5 carried into Architecture Constraints in appropriate stories |
| D — Story independence | ⚠️ NEEDS WORK | H3 (S3.2 schema dependency not formalised between S2.2/S2.3/S3.2) |
| E — Architecture/technical risk | ✅ PASS (with H2 resolved) | Feature flag enforcement mechanism needed (H2); otherwise design is sound |
| F — Regulatory compliance | ✅ PASS (with H1 resolved) | C1, C2, C5 all have primary stories; go-live gates explicit. H1 resolution required for C5 gate quality. |

**Overall verdict: CONDITIONAL PASS — 3 HIGH findings must be resolved before test-plan and DoR sign-off. 4 IMPORTANT findings should be addressed before coding agent handoff.**

The H1, H2, H3 resolutions are incorporated into the test plan and DoR artefacts — the test plan will enforce the specific testable conditions implied by each resolution. The definition artefact can proceed as-is with the review findings noted; the test plan will operationalise the corrections.

---

<!-- CPF-TRACE
stage: /review
model: claude-sonnet-4-6
config: A

constraints_identified_from_definition_artefact:
- C1: CCCFA s.9C — carried in Architecture Constraints of S1.1, S2.1, S2.2, S2.3, S3.2
- C2: FMA algorithmic fairness / independent model validation — carried in Architecture Constraints of S1.2, S2.3
- C3: Centrix DSA — carried in Architecture Constraints of S1.3, S2.2
- C4: $30k automated decision threshold — carried in S2.3, S3.1
- C5: FMA enforcement risk (undisclosed demographic disparity) — carried in Architecture Constraints of S1.2, S2.3

constraints_carried_forward:
- C1: Constraint coverage confirmed ✅ — finding H3 addresses audit trail schema formalisation to protect C1 audit trail integrity
- C2: Constraint coverage confirmed ✅ — finding H2 addresses production gate enforcement for C2
- C3: Constraint coverage confirmed ✅
- C4: Constraint coverage confirmed ✅
- C5: Constraint coverage confirmed ✅ — finding H1 addresses AC4 ambiguity in C5 primary story; finding H2 addresses production gate enforcement for C5

constraints_not_carried: none — all five constraints confirmed carried forward with review findings addressing quality gaps in their enforcement mechanisms

c5_surfaced: true (C5 present in review as explicit enforcement risk; H1 and H2 findings specifically address the quality of C5 gate enforcement)
-->

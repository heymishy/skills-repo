# Review: Experience API Layer — Card Services Platform Migration

**Status:** Complete — all HIGH findings resolved (eval-mode — EXP-008-corpus-breadth-eval / Config A / S4)
**Feature slug:** experience-api-card-services
**Date:** 2026-05-18
**Skill version:** /review
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S4

---

## Review summary

| Category | Findings | Resolved | Unresolved |
|----------|---------|---------|-----------|
| HIGH | 3 | 3 | 0 |
| MEDIUM | 2 | 2 | 0 |
| LOW | 1 | 1 | 0 |

**Overall verdict:** All HIGH findings resolved. Definition is implementation-ready with the resolved findings incorporated into the DoR coding agent instructions and hard blocks.

---

## HIGH findings

### H1 — Story 2.1 Redis prerequisite is structurally informal — the gate must be a hard deployment block, not a story dependency label

**Finding:** Story 1.3 states "PREREQUISITE DEPENDENCY: Story 2.1 must be formally signed off with written security team confirmation before this story is integration-tested with real card data." This is correct in intent but the enforcement mechanism is informal — it relies on the coding agent reading and honouring the dependency note. A coding agent working through a task list may implement Story 1.3 and run integration tests using synthetic data (acceptable) or real card data (PCI DSS violation) without a mechanism to distinguish the two cases. The definition does not specify how the gate sign-off is operationalised in the test environment.

**Risk:** Development team runs Story 1.3 integration tests with real card data before Story 2.1 AC1–AC4 are signed off. If Redis at-rest encryption is not enabled and real card data enters the cache, this is a CDE control deficiency that: (a) appears in the QSA assessment, (b) requires incident response, and (c) may invalidate the month 8 QSA window.

**Resolution:** The test plan must include T-REDIS-GATE as a blocking test that verifies the written security team confirmation exists before any integration test that writes to Redis with real card data can execute. The DoR hard block must specify: "Story 2.1 AC1–AC4 documented sign-offs must be produced and filed before Story 1.3 T-REDIS-GATE is run. The coding agent must not execute integration tests with real card data until T-REDIS-GATE passes." The coding agent instructions must name this as the first implementation sequence priority.

**Status: RESOLVED** — T-REDIS-GATE added to test plan; DoR H3 (Redis encryption) adds explicit gate condition; coding agent instructions specify Story 2.1 sign-off as a hard precedence requirement before Story 1.3 real-data testing.

---

### H2 — Consent management extensibility confirmation has no deadline or escalation path

**Finding:** Story 3.1 states "Confirmation deadline: No later than month 3 of project." However, neither the discovery nor the definition specifies what happens if the consent management team does not respond by month 3, or if the response is "we cannot assess this for 6 months." The external partner access commitments (fintech partners operating under the open banking programme) may be contractual — and if consent management is not confirmed extensible and no alternative is ready by month 3, the delivery timeline for Epic 3 becomes undefined.

**Risk:** The Programme Director and fintech partners are planning delivery against a timeline that assumes consent management will be confirmed extensible. If the confirmation does not arrive and no escalation mechanism exists, Epic 3 delivery slips indefinitely without a formal decision point to trigger the alternative consent mechanism design.

**Resolution:** The DoR must include a named escalation owner (Open Banking Programme Lead) responsible for the month 3 confirmation deadline, and an explicit decision protocol: if confirmation is not received by month 3, the Open Banking Programme Lead triggers the alternative consent mechanism scoping as a formal new workstream. The test plan must include T-CONSENT-002 verifying the feasibility decision exists before Epic 3 stories are coded.

**Status: RESOLVED** — DoR H2 (consent management) specifies month 3 deadline and names the Open Banking Programme Lead as escalation owner; T-CONSENT-002 added to test plan; DoR coding agent instructions hold Epic 3 stories behind Story 3.1 AC1 confirmation.

---

### H3 — Month-12 migration milestone is not defined in the definition

**Finding:** The discovery identifies the 6-month extension option as requiring "active migration progress demonstrated by month 12," but the definition does not define what the milestone specifically consists of. Story 4.2 AC3 states "all 11 consumer integrations in UAT or production on the Experience API" — but this is the story's AC, not a formally agreed milestone that the vendor has accepted. The vendor contractual right depends on what the enterprise can demonstrate at month 12, and if the milestone content has not been agreed with the vendor in advance, the extension claim may fail.

**Risk:** The enterprise reaches month 12 having achieved what it believes constitutes migration progress, only to find the vendor interprets "active migration progress" differently. The 6-month extension is denied. The enterprise then has 6 months to complete the remaining migrations — with no buffer.

**Resolution:** The DoR must include a hard block requiring that the month-12 milestone definition be formally agreed with the card core vendor before coding begins. The agreement must specify: what constitutes acceptable migration progress (e.g., all 11 integrations in UAT with acceptance sign-off), the format of the evidence package, and the vendor's acknowledgement that this constitutes the extension trigger. This is a contractual task, not a technical task — but it gates the delivery timeline.

**Status: RESOLVED** — DoR H5 (month-12 milestone) specifies vendor-agreed milestone definition as a hard block before coding begins; Story 4.2 AC3 references the milestone package.

---

## MEDIUM findings

### M1 — Least-privilege consumer workshop is referenced but not scoped or scheduled

**Finding:** The definition includes a "prerequisite task — Consumer Workshop" in Epic 1's introduction, but it is not scoped as a story, has no delivery owner, and has no schedule. If the workshop is not completed before Story 1.1 coding begins, the API key scope matrix cannot be defined and Story 1.1 AC3 (operation-scoped API keys) cannot be implemented correctly.

**Risk:** Story 1.1 is coded before the workshop is complete, resulting in generic or placeholder API key scoping that must be revised when the workshop output is available. This creates rework and potentially requires re-testing with the correct scoped keys.

**Resolution:** The DoR must include a warning (W1) that the consumer workshop must be scheduled and completed before Epic 1 API key stories are coded. The coding agent instructions must specify that Story 1.1 AC3 requires the workshop output (scope matrix per consumer team) as an input — if the workshop output is not available, AC3 cannot be completed.

**Status: RESOLVED** — DoR W1 (workshop scheduling) added; coding agent instructions flag this dependency.

---

### M2 — Cache TTL values are not specified in Story 2.3

**Finding:** Story 2.3 states "transaction history (90 days + buffer — specified TTL, not indefinite)" but does not specify the actual TTL value. PCI DSS Requirement 3.1.2 requires that the TTL be the "minimum necessary for the caching function, with justification." Without a specific value in the story, the coding agent may implement any TTL, and the QSA evidence package may not have a documented and justified value.

**Resolution:** Story 2.3 AC1 should specify that the TTL values must be defined by the business and security team before the story is coded, and that the justification for the chosen TTL must be documented in the QSA evidence package. The coding agent must not assume a TTL — it must implement the agreed value.

**Status: RESOLVED** — DoR W2 (TTL specification) added as warning; Story 2.3 AC1 (in definition, as written) requires documented TTL with justification; the DoR coding agent instructions note that the TTL value must be provided as a story input.

---

## LOW findings

### L1 — Fintech partner DPA card data coverage is not confirmed in the definition

**Finding:** Story 3.1 AC4 requires confirmation that fintech partner DPAs cover card data. However, the definition does not identify who is responsible for this confirmation or what the timeline is. The DPAs may have been established in the context of the mortgage open banking programme and may not extend to card data.

**Resolution:** Story 3.1 AC4 (as written) requires legal confirmation — this is sufficient as a story acceptance criterion. The DoR should note this as a prerequisite to Story 3.2 activation.

**Status: RESOLVED** — Story 3.1 AC4 specifies legal confirmation requirement; DoR coding agent instructions hold Story 3.2 behind Story 3.1 AC4 as well as AC1.

---

## Constraint propagation check (review stage)

| Constraint | Discovery | Definition | Review finding |
|-----------|----------|-----------|---------------|
| C1 (PCI DSS QSA) | ✓ Named | ✓ Story 2.4 (QSA package), month 8/14 timeline | No gaps — QSA gate is explicit |
| C2 (CDR consent) | ✓ Named | ✓ Story 3.1 (prerequisite), Story 3.2 (gate) | H2 resolved — deadline and escalation owner added |
| C3 (Vendor deadline) | ✓ Named | ✓ Stories 4.1, 4.2 (migration); month-12 milestone | H3 resolved — milestone definition added to DoR |
| C4 (PAN prohibition) | ✓ Named | ✓ Story 2.2 (transformation), Story 1.2 AC3, 1.3 AC3 | No gaps — truncation enforced at transformation layer with automated test |
| C5 (Redis at-rest encryption) | ✓ Named ([PRECONDITION]) | ✓ Story 2.1 (hard prerequisite), Story 1.3 (gated) | H1 resolved — T-REDIS-GATE added to test plan; DoR H3 explicit |

All 5 constraints propagated at review stage. Regulated constraints (C1, C2, C4) all have named gate owners and explicit test coverage.

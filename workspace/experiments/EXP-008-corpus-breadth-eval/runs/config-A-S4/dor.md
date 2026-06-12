# Definition of Ready: Experience API Layer — Card Services Platform Migration

**Status:** PROCEED (eval-mode — EXP-008-corpus-breadth-eval / Config A / S4)
**Feature slug:** experience-api-card-services
**Date:** 2026-05-18
**Skill version:** /definition-of-ready
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S4

---

## Hard block assessment

| Block | Description | Status | Resolution |
|-------|-------------|--------|------------|
| H1 — Story exists | Stories are written and scoped | ✅ PASS | 12 stories across 4 epics |
| H2 — Test plan exists | Test plan is written with failing tests | ✅ PASS | 14 tests; T-REDIS-GATE, T-PAN-001/002, T-CONSENT-001/002 are blocking |
| H3 — Review passed | No unresolved HIGH findings | ✅ PASS | 3 HIGH findings, all resolved |
| H4 — Scope is bounded | Out-of-scope explicitly stated | ✅ PASS | 5 out-of-scope items defined |
| H5 — Regulatory gates named | Regulated constraints have named gate owners | ✅ PASS | C1: CRO/Head of Security Compliance; C2: Open Banking Programme Lead; C4: Head of Security Architecture; C5: Head of Security Architecture |
| H6 — Personas defined | At least 3 personas with distinct stakes | ✅ PASS | 7 personas; card customers, 11 consumer teams, 2 external partners, QSA, vendor, consent team, security architecture |
| H7 — ACs are testable | ACs can be verified by automated test or explicit human gate | ✅ PASS | T-REDIS-GATE (blocking CI gate), T-PAN-001/002 (automated), T-CONSENT-001 (automated), T-PCI-001/002 (human gate), T-VENDOR-001 (human gate) |
| H8 — No contradictions | Discovery, definition, review, and test plan are internally consistent | ✅ PASS | Constraint propagation check at review stage: all 5 constraints consistent across all four stages |
| H9 — Architecture guardrails respected | No out-of-scope architectural decisions | ✅ PASS | CDE component expansion follows QSA notification requirement; PAN truncation follows PCI DSS 3.4; Redis configuration follows PCI DSS 3.5.1 |

---

## Regulatory hard blocks (feature-specific)

### H-REG-1 — QSA assessment window selection (C1)

**Constraint:** PCI DSS — Experience API is a new CDE component; QSA assessment required before go-live; QSA capacity available only in months 8 and 14.

**Hard block condition:** The QSA assessment window (month 8 or month 14) must be formally selected and documented before coding begins. The QSA must be notified of the new CDE component scope (Experience API gateway, Redis cache, consent validation gateway) before the selected window. Selection of month 14 must be a conscious decision by the CRO accepting the 6-month go-live delay.

**Gate owner:** Chief Risk Officer (window selection decision); Head of Security Compliance (QSA engagement and notification).

**No-go condition:** If the QSA assessment window has not been selected, do not begin coding. QSA window selection is a project milestone that affects all delivery timelines — coding against an undefined QSA window risks building a CDE component that cannot be assessed until the wrong window.

**Test coverage:** T-PCI-001, T-PCI-002.

---

### H-REG-2 — Consent management extensibility or alternative scoped (C2)

**Constraint:** CDR-equivalent consent required before external partner access to card data; consent management service extensibility unconfirmed.

**Hard block condition:** The consent management team must provide written feasibility confirmation (extensible / not extensible) no later than month 3 of the project. If not extensible by month 3, an alternative consent mechanism must be scoped and costed with Programme Director approval before Epic 3 is delivered.

**Gate owner:** Open Banking Programme Lead (month 3 deadline owner and escalation trigger).

**No-go condition:** Epic 3 stories (3.1, 3.2) must not be coded until Story 3.1 AC1 (written feasibility confirmation) is satisfied. External partner access stories must not be committed if consent management feasibility has not been confirmed.

**Test coverage:** T-CONSENT-001, T-CONSENT-002.

---

### H-REG-3 — Redis at-rest encryption confirmed before caching card data (C5)

**Constraint:** Redis at-rest encryption has not been confirmed as meeting PCI DSS Requirement 3.5.1. If not confirmed, Redis caching is not a viable option for PCI DSS in-scope card transaction data.

**Hard block condition:** The following must be confirmed in writing by the Head of Security Architecture before any integration test using real card data executes against the Redis cache:
- (a) Azure Cache for Redis tier is Premium or Enterprise (Basic/Standard do not support at-rest encryption for CDE use)
- (b) At-rest encryption is explicitly enabled in the Redis instance configuration — not assumed from platform defaults
- (c) Encryption key management meets PCI DSS requirements (Azure Key Vault or equivalent; key access restricted to Experience API service identity; key rotation policy defined)
- (d) Redis is deployed with private endpoint only; no public endpoint; deployed within the CDE network boundary

**If at-rest encryption cannot be confirmed:** Redis is not a viable caching option for card transaction data under PCI DSS. The caching design for Story 1.3 must be redesigned with a compliant approach before Story 1.3 is coded. This is a go/no-go architectural decision — not a post-implementation compliance fix.

**Gate owner:** Head of Security Architecture (written confirmation; non-delegable).

**No-go condition:**
```
story_1_3_real_data_integration_testing_before_t_redis_gate_pass: DO_NOT_TEST_WITH_REAL_CARD_DATA
redis_caching_without_confirmed_at_rest_encryption: DO_NOT_IMPLEMENT
```

**Test coverage:** T-REDIS-GATE (blocking CI gate — enforced in UAT and production environments).

---

### H-REG-4 — PAN truncation enforced at transformation layer (C4)

**Constraint:** PCI DSS — raw PAN must never be cached; truncated PAN (last 4 digits) only. Enforced at the data transformation layer with automated test coverage.

**Hard block condition:** The data transformation layer design must specify PAN truncation to last 4 digits before any cache write. This must be verified by automated tests (T-PAN-001: no full PAN in cache; T-PAN-002: no CVV/CVC in cache or response) before the transaction history endpoint is deployed to any environment that processes real card data.

**Gate owner:** Head of Security Architecture; QSA scope lead.

**No-go condition:**
```
story_2_2_pan_test_not_passing: DO_NOT_DEPLOY_TO_REAL_CARD_DATA_ENVIRONMENT
```

**Test coverage:** T-PAN-001, T-PAN-002 (automated; must pass before deployment to any real card data environment).

---

### H-REG-5 — Month-12 vendor milestone formally defined (C3)

**Constraint:** 18-month vendor deprecation deadline; 6-month extension available only if "active migration progress" is demonstrated by month 12. The milestone definition must be agreed with the vendor before coding begins.

**Hard block condition:** The Programme Director must obtain written confirmation from the card core vendor specifying: (a) what constitutes acceptable "active migration progress" (e.g., all 11 consumer integrations in UAT with signed acceptance sign-offs), (b) the format of the evidence package, and (c) the vendor's acknowledgement that this constitutes the basis for the extension claim. This agreement must exist before Epic 4 stories are coded.

**Gate owner:** Programme Director (vendor relationship owner; non-delegable to technical lead).

**No-go condition:** Epic 4 stories must not be coded until the vendor milestone agreement is documented. Coding Epic 4 against an undefined milestone creates a delivery risk that the extension claim fails even if all migrations are complete.

**Test coverage:** T-VENDOR-001.

---

## Warnings (acknowledged)

### W1 — Consumer workshop must be scheduled before Epic 1 API key stories

The consumer workshop (all 11 teams; operation-scope matrix definition) is a prerequisite to Story 1.1 AC3 (operation-scoped API keys per consumer team). The workshop has not been scheduled. Risk: Story 1.1 coding begins before the scope matrix is available, requiring rework when the workshop output is delivered.

**Required action:** Head of API Platform must schedule and complete the consumer workshop before Story 1.1 coding begins. The coding agent must not implement AC3 until the workshop output (operation-scope matrix per consumer team) is provided as a story input.

### W2 — Cache TTL values must be specified by security team before Story 2.3 is coded

Story 2.3 requires TTL values for each cached card data type (transaction history, card account summary). PCI DSS Requirement 3.1.2 requires that TTL values represent the minimum necessary storage period with documented justification. TTL values must be agreed by the security team and provided to the coding agent as a story input — the coding agent must not assume or invent TTL values.

---

## Oversight level

**HIGH** — Regulated PCI DSS environment; card transaction data (CDE in scope); QSA assessment gate; CDR-equivalent consent obligation; vendor contractual deadline; three unconfirmed architectural prerequisites (Redis encryption, consent extensibility, month-12 milestone).

---

## DoR verdict

**PROCEED** — All hard blocks pass. Regulatory hard blocks H-REG-1 through H-REG-5 define the conditions that must be met before specific story groups are coded. Warnings W1 and W2 are acknowledged and must be actioned before their respective story groups begin.

---

## Coding agent instructions

You are implementing the Experience API layer for card services. This is a PCI DSS–regulated feature — card transaction data is Cardholder Data Environment (CDE) in scope. The following rules are mandatory and non-negotiable.

**Rule 1 (Redis encryption gate — C5):** You must not execute integration tests that write real card data to Redis until T-REDIS-GATE has been satisfied. T-REDIS-GATE requires written confirmation from the Head of Security Architecture that: (a) Azure Cache for Redis tier is Premium or Enterprise, (b) at-rest encryption is explicitly enabled, (c) key management meets PCI DSS requirements, (d) Redis is deployed with private endpoint only. If this confirmation does not exist, implement Story 1.3 using synthetic data only and flag the gate requirement. The CI deployment pipeline must enforce T-REDIS-GATE as a blocking check before any real card data environment deployment.

**Rule 2 (PAN truncation — C4):** Implement PAN truncation at the data transformation layer (Story 2.2) before Story 1.3 integration testing begins with real card data. The automated tests T-PAN-001 and T-PAN-002 must pass before deployment to any environment that processes real card data. Truncation to last 4 digits must be applied before the cache write and before response serialisation — not only at response time. CVV/CVC must be stripped from all card core responses at the transformation layer.

**Rule 3 (Consent gate — C2):** Epic 3 stories (3.1, 3.2) must not be coded until Story 3.1 AC1 (written feasibility confirmation from the consent management team) is available. Do not assume the consent management service supports card data — treat as unconfirmed until AC1 is satisfied. Story 3.2 must not be coded until both AC1 and AC4 of Story 3.1 are satisfied.

**Rule 4 (Operation-scoped API keys — CCS-RISK-002):** Implement the Experience API gateway using operation-scoped API keys, not the shared admin service account. The shared admin service account must be revoked from all integrations by the end of Epic 4. Story 1.1 AC3 requires the consumer workshop output (operation-scope matrix per consumer team) as an input — do not implement generic API key scoping if the workshop output has not been provided.

**Rule 5 (Story sequencing):** Implement stories in the following priority order: (1) Story 2.1 (Redis encryption confirmation — prerequisite), (2) Story 2.2 (PAN truncation — prerequisite), (3) Story 1.1 (gateway + auth), (4) Story 1.2 and 1.4 (non-cached endpoints), (5) Story 2.3 (cache retention policy), (6) Story 1.3 (transaction history — only after T-REDIS-GATE and T-PAN-001/002 pass), (7) Story 2.4 (QSA package), (8) Stories 3.1, 3.2 (consent — gated on Story 3.1 AC1), (9) Stories 4.1, 4.2 (consumer migration — after stable API layer).

**Rule 6 (No full PAN anywhere):** Full PAN (16-digit card number) must never appear in: Redis cache, API response, application log, error message, or test assertion output. Truncated PAN (last 4 digits) is the only permitted PAN format in any system output.

# Definition: Experience API Layer — Card Services Platform Migration

**Status:** Complete (eval-mode — EXP-008-corpus-breadth-eval / Config A / S4)
**Feature slug:** experience-api-card-services
**Date:** 2026-05-18
**Skill version:** /definition
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S4

---

## Slicing strategy

**Chosen:** Regulatory-first with prerequisite sequencing

Rationale: The Experience API has three unconfirmed design prerequisites (Redis at-rest encryption, consent management extensibility, least-privilege role definitions) and a hard QSA assessment gate. Slicing by regulatory concern first ensures that CDE compliance infrastructure (Redis encryption, PAN truncation enforcement, QSA package) is delivered before the data endpoints that depend on it. External partner access stories are held behind the consent management confirmation gate. Consumer migration is sequenced after the stable API layer is established.

Story ordering follows three explicit precedence rules:
1. Story 2.1 (Redis at-rest encryption confirmation) is a **HARD PREREQUISITE** to any integration testing of Story 1.3 (transaction history endpoint) with real card data
2. Story 3.1 (consent management extensibility confirmation) is a **HARD PREREQUISITE** to Story 3.2 (consent gate implementation) and all external partner access
3. Consumer workshop (prerequisite task within Epic 1) must complete before operation-scoped API key stories are designed

---

## Epic 1 — Experience API Foundation

**Goal:** Establish the Experience API gateway with authenticated, operation-scoped access; deliver the core data endpoints except transaction history (which is blocked pending Redis encryption confirmation).

**Prerequisite task — Consumer Workshop:** Before any Epic 1 story coding begins, the Head of API Platform must conduct a workshop with all 11 consumer teams to define the operation-scope matrix (which operations each consumer team requires vs. what they currently access via the shared admin account). The workshop outputs must be documented and approved before operation-scoped API key stories are designed. This is a delivery task, not a story — but it gates the API key design in Story 1.1.

---

### Story 1.1 — Experience API Gateway with Operation-Scoped Authentication

**As a** card data consumer team,
**I want** to access card data through an Experience API gateway using an operation-scoped API key,
**So that** my access is limited to only the data operations I require, and the shared admin service account is no longer used.

**Acceptance criteria:**
- AC1: The Experience API gateway is deployed and reachable from all 11 consumer team environments
- AC2: The gateway requires an operation-scoped API key for all requests; requests without a valid API key return HTTP 401
- AC3: Each consumer team's API key is scoped to only the operations required for that team (as defined by the consumer workshop outcome — prerequisite task above); the shared admin service account is revoked from all Experience API integrations
- AC4: API keys are managed via the card core vendor's role-based API key system (v3.x API); the gateway uses operation-level API keys, not the shared admin account
- AC5: The gateway enforces TLS for all inbound and outbound connections; no plaintext communication is permitted

**Out of scope:** Rate limiting, developer portal, API versioning strategy beyond v1.0

---

### Story 1.2 — Card Account Summary and Card Controls Endpoints

**As a** consumer application,
**I want** to retrieve card account summary and perform card control operations (freeze/unfreeze, limit changes) through the Experience API,
**So that** I can serve card account management features to customers without direct integration against the card core system.

**Acceptance criteria:**
- AC1: `GET /v1/cards/{cardId}/summary` returns card account summary (account number last 4 digits, account status, credit limit, available credit, current balance, minimum payment due, payment due date)
- AC2: `POST /v1/cards/{cardId}/controls` accepts freeze, unfreeze, and limit change operations; operations are forwarded to card core v3.x API and the result returned to the consumer
- AC3: Full PAN is never returned in any response; only last 4 digits (truncated PAN) are included in any card identifier field
- AC4: All operations are logged with consumer team identity, operation type, timestamp, and card identifier (truncated); logs are retained per the enterprise's CDE log retention policy
- AC5: Card controls operations return an idempotency-safe response (duplicate requests within 30 seconds return the result of the first request, not a duplicate operation)

---

### Story 1.3 — Transaction History Endpoint (90-day window; truncated PAN; cache conditional on Story 2.1)

**As a** consumer application,
**I want** to retrieve 90-day transaction history for a card account through the Experience API,
**So that** I can display transaction history to customers without direct integration against the card core system.

**PREREQUISITE DEPENDENCY:** **Story 2.1 (Redis at-rest encryption confirmation) must be formally signed off with written security team confirmation before this story is integration-tested with real card data.** This dependency is a hard CDE compliance gate. The coding agent may implement the endpoint logic and cache interface, but must not execute integration tests with real card data until Story 2.1 AC1–AC4 have been satisfied and the sign-off is documented.

**Acceptance criteria:**
- AC1: `GET /v1/cards/{cardId}/transactions` returns up to 90 days of transaction history; transactions older than 90 days are not returned
- AC2: Each transaction record includes: truncated PAN (last 4 digits only), transaction date, amount, currency, merchant name (if available), transaction category (from spend categories engine), transaction status
- AC3: Full PAN is never included in any transaction record; no 16-digit PAN sequence is present in any cache write or API response
- AC4: Transaction history is cached in Redis for the confirmed TTL period (see Story 2.3); cache reads are used for repeat requests within the TTL window
- AC5: If the Redis cache is unavailable, the endpoint falls back to direct card core API call; the fallback is logged; customer experience is not degraded

---

### Story 1.4 — Spend Categories and Dispute Initiation Endpoints

**As a** consumer application,
**I want** to retrieve spend category summaries and initiate card disputes through the Experience API,
**So that** I can offer these features to customers through the abstraction layer.

**Acceptance criteria:**
- AC1: `GET /v1/cards/{cardId}/categories` returns spend category summary (categories, totals, period) for the last 90 days
- AC2: `POST /v1/cards/{cardId}/disputes` accepts dispute initiation requests; forwarded to card core dispute API; dispute reference returned to consumer
- AC3: No raw PAN or SAD data is accepted or returned in any dispute initiation request or response
- AC4: Dispute initiation is idempotent within a 60-second window (duplicate dispute requests return the original dispute reference)

---

## Epic 2 — PCI DSS Compliance and QSA Readiness

**Goal:** Confirm Redis at-rest encryption, enforce PAN truncation, define and enforce cache retention policy, and prepare the QSA assessment package. This epic's completion (specifically Story 2.1) is a hard prerequisite to real-data integration testing of Story 1.3.

---

### Story 2.1 — Redis At-Rest Encryption Confirmation and CDE Configuration (PREREQUISITE)

**As the** security team and QSA,
**I want** written confirmation that the Azure Cache for Redis instance meets PCI DSS Requirement 3.5.1 at-rest encryption requirements,
**So that** the Redis cache can be safely used as a CDE caching component without creating a PCI DSS control deficiency.

**HARD PREREQUISITE for Story 1.3 integration testing with real card data.**

**Acceptance criteria:**
- AC1: The security team provides written confirmation that the Azure Cache for Redis instance has at-rest encryption explicitly enabled (not assumed from platform defaults); confirmation document is filed in the QSA evidence package
- AC2: The Azure Cache for Redis tier is confirmed as Premium or Enterprise (Basic and Standard tiers do not support at-rest encryption under PCI DSS Requirement 3.5.1 for CDE use cases); tier confirmation is documented
- AC3: Key management configuration is confirmed as meeting PCI DSS requirements: keys managed via Azure Key Vault or equivalent; key access restricted to Experience API service identity; key rotation policy defined
- AC4: Redis instance is deployed within the CDE network boundary (private endpoint only; no public endpoint; network topology documented for QSA review)
- AC5: This story's AC1–AC4 sign-offs must be documented and available before Story 1.3 integration tests are run with real card data; the coding agent must not execute real-data integration tests until these sign-offs are in place

**If at-rest encryption cannot be confirmed:** Escalate to Head of Security Architecture and Programme Director. Transaction history caching must be redesigned with a compliant caching approach before Story 1.3 is implemented. This is a go/no-go decision point for the caching architecture — not a deferred fix.

---

### Story 2.2 — PAN Truncation Enforcement at the Data Transformation Layer

**As the** QSA and security team,
**I want** the Experience API to enforce PAN truncation to last 4 digits at the data transformation layer before any cache write,
**So that** no full PAN (16-digit card number) can ever enter the Redis cache or be returned in an API response, regardless of what the card core system returns.

**Acceptance criteria:**
- AC1: The data transformation layer intercepts all card core API responses and truncates any PAN field to the last 4 digits before the data is written to cache or returned to a consumer
- AC2: Automated test asserts that no write to the Redis cache contains a full 16-digit PAN sequence — the test must construct a synthetic card core response with a full PAN and verify that the cache write contains only the last 4 digits
- AC3: CVV/CVC fields are stripped from all card core API responses at the transformation layer; automated test verifies that no CVV/CVC field is present in any cache write or consumer API response
- AC4: The transformation is applied before cache write and before consumer response serialisation — it is not applied only at response time (defence-in-depth)

---

### Story 2.3 — Cache Retention Policy Definition and TTL Enforcement

**As the** QSA,
**I want** the Experience API to define and enforce a maximum cache retention period for each card data type, documented and enforced by TTL configuration,
**So that** PCI DSS Requirement 3.1.2 (minimum data storage periods) is met and the QSA assessment has documented evidence of retention enforcement.

**Acceptance criteria:**
- AC1: Maximum cache retention periods are defined for each cached data type: transaction history (90 days + buffer — specified TTL, not indefinite), card account summary (24 hours or less); retention periods are documented with justification
- AC2: Redis TTL configuration enforces the defined maximum for each data type; no indefinite or "until eviction" cache entries are permitted
- AC3: The TTL configuration evidence (Redis instance configuration export) is included in the QSA assessment package
- AC4: Automated test verifies that cache entries expire after the configured TTL (test creates a cache entry with a short TTL and asserts it is absent after the TTL elapses)

---

### Story 2.4 — QSA Assessment Package Preparation

**As the** QSA,
**I want** a complete assessment package covering the Experience API's CDE components (API layer, Redis cache, consent gateway),
**So that** the QSA assessment at month 8 (or month 14) can be completed without delays due to missing documentation.

**Acceptance criteria:**
- AC1: Architecture documentation covering all CDE components: Experience API gateway, Redis cache, consent validation gateway; network topology diagram showing CDE boundary; data flow diagram showing PAN truncation points
- AC2: At-rest encryption configuration evidence: Redis tier confirmation, at-rest encryption status confirmation, key management documentation (from Story 2.1)
- AC3: PAN truncation test results: automated test suite output demonstrating that no full PAN enters the cache or consumer response (from Story 2.2)
- AC4: Cache retention policy documentation and TTL configuration evidence (from Story 2.3)
- AC5: Access control documentation: least-privilege API key scope matrix per consumer team; shared admin service account revocation evidence; Redis access control configuration
- AC6: QSA engagement confirmed: QSA has been notified of the new CDE components before the selected assessment window opens; month 8 or month 14 window selection documented

---

## Epic 3 — Open Banking Consent Gateway

**Goal:** Confirm consent management service extensibility and implement CDR-equivalent consent validation for external fintech partner access to card data.

---

### Story 3.1 — Consent Management Service Extensibility Confirmation and Extension

**As the** Experience API and external fintech partners,
**I want** confirmation that the consent management service supports card data consent types (or an alternative consent mechanism if not extensible),
**So that** external partner access to card data can be designed with a confirmed consent management approach before Epic 3 delivery is committed.

**HARD PREREQUISITE to Story 3.2 and all external partner access.**

**Confirmation deadline: No later than month 3 of project. If confirmation is not received by month 3, external partner access stories (3.1, 3.2) must be moved to a separate delivery track with a separate scope and cost estimate.**

**Acceptance criteria:**
- AC1: Written feasibility confirmation from the consent management team: can the existing service support card data consent types (card summary, transaction history, spend categories, card controls, dispute initiation)? Feasibility decision documented and approved before month 3 deadline
- AC2 (if extensible): Card data consent types are defined in the consent management service data model; the consent management team confirms that the existing consent data model (built for mortgage data types) can be extended without breaking existing mortgage consent functionality
- AC3 (if not extensible): An alternative card data consent mechanism is designed, scoped, and costed as a separate deliverable; the scope and cost estimate is approved by the Programme Director before external partner access is committed
- AC4: Fintech partner DPAs are confirmed as covering card data (not only mortgage data); if DPAs require amendment, legal confirmation is obtained before partner access is activated

---

### Story 3.2 — Consent Validation Gate for External Partner Access

**As an** external fintech partner,
**I want** to access card data via the Experience API only when a valid customer consent token exists for the requested data type,
**So that** customer consent is enforced as a precondition to partner data access.

**Prerequisite: Story 3.1 AC1 (consent management feasibility confirmation) must be satisfied before this story is designed or coded.**

**Acceptance criteria:**
- AC1: All Experience API requests from external fintech partners must include a valid consent token identifying the customer and the consented data types
- AC2: The consent validation gateway rejects partner requests with no consent token, an expired consent token, or a consent token that does not cover the requested data type — returning HTTP 403 in all cases
- AC3: Customer consent is validated on every request (not cached at session level); consent revocation is respected within the validation window
- AC4: Internal consumer team requests bypass consent validation (consent applies only to external partner access)

---

## Epic 4 — Consumer Migration

**Goal:** Migrate all 11 consumer integrations from direct card core v2.x API integration to the Experience API before the vendor deprecation deadline.

---

### Story 4.1 — Priority Consumer Migration (Mobile App, Internet Banking, Contact Centre)

**As** the mobile banking app, internet banking, and contact centre tooling teams,
**I want** to migrate from direct card core v2.x integration to the Experience API,
**So that** the three highest-impact consumer integrations are migrated first, reducing deprecation risk and demonstrating migration progress.

**Acceptance criteria:**
- AC1: Mobile banking app, internet banking, and contact centre tooling integrations are migrated to the Experience API v1.0; no active calls to card core v2.x from these three consumers
- AC2: Each migrated consumer team provides signed migration acceptance sign-off confirming that their integration is functional against the Experience API and that the card core v2.x integration has been decommissioned from their system
- AC3: Post-migration regression test suite passes for all three consumer teams (using consumer-specific test cases agreed during the consumer workshop)

---

### Story 4.2 — Remaining Consumer Migration (8 Integrations) and Month-12 Milestone

**As** the remaining 8 consumer teams and the Programme Director,
**I want** all 8 remaining integrations migrated to the Experience API and the month-12 milestone package prepared,
**So that** all 11 consumers are on the Experience API before the deprecation deadline, and the 6-month extension option is preserved if needed.

**Acceptance criteria:**
- AC1: All 8 remaining consumer integrations are migrated to the Experience API v1.0; no active calls to card core v2.x from any consumer integration
- AC2: Each migrated consumer team provides signed migration acceptance sign-off
- AC3: By month 12: all 11 consumer integrations in UAT or production on the Experience API; migration acceptance sign-offs from all 11 teams compiled into the month-12 milestone package; package submitted to card core vendor as evidence of active migration progress (required for the 6-month extension option)
- AC4: The shared admin service account has been revoked from all 11 consumer integrations; all integrations use operation-scoped API keys

---

## Story summary

| Epic | Story | Key dependency | Regulated constraint |
|------|-------|---------------|---------------------|
| 1 — Foundation | 1.1 Gateway + auth | Consumer workshop (prerequisite task) | C3 (deadline), CCS-RISK-002 |
| 1 — Foundation | 1.2 Summary + controls | 1.1 | C4 (PAN prohibition) |
| 1 — Foundation | 1.3 Transaction history | **Story 2.1 (hard prerequisite for real-data testing)** | C4 (PAN), **C5 (Redis encryption)** |
| 1 — Foundation | 1.4 Categories + disputes | 1.1 | C4 (PAN prohibition) |
| 2 — PCI DSS | **2.1 Redis encryption (PREREQUISITE)** | Security team confirmation | **C5 (Redis at-rest encryption)** |
| 2 — PCI DSS | 2.2 PAN truncation | 1.3 design | C4 (PAN prohibition) |
| 2 — PCI DSS | 2.3 Cache retention | 2.1 | C1 (QSA), PCI DSS 3.1.2 |
| 2 — PCI DSS | 2.4 QSA package | 2.1, 2.2, 2.3 | **C1 (QSA assessment gate)** |
| 3 — Consent | **3.1 Extensibility confirmation (PREREQUISITE)** | Consent management team | **C2 (consent)** |
| 3 — Consent | 3.2 Consent gate | **Story 3.1 AC1** | **C2 (consent)** |
| 4 — Migration | 4.1 Priority migration | 1.1, 1.2, 1.4 | **C3 (deprecation deadline)** |
| 4 — Migration | 4.2 Remaining + month-12 | 4.1 | **C3 (month-12 extension milestone)** |

**Total stories:** 12 across 4 epics

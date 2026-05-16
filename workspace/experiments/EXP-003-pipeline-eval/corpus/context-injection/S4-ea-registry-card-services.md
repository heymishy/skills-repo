# Synthetic EA Registry Entries
# Applications: Card Core System + Consent Management Service + Redis Cache + External Fintech Partners
# Registry version: 2026-Q1
# Entry type: Vendor-managed system (1) + Internal application (1) + Infrastructure component (1) + External consumers (2)
# SYNTHETIC DOCUMENT — for EXP-003-pipeline-eval evaluation only

---

## Application Profile 1 — Card Core System

**Name:** Card Core System
**Owner:** Technology (third-party vendor managed)
**Domain:** Cards / Core Banking
**Classification:** Internal — vendor-managed; regulated (PCI DSS in scope)
**Criticality:** CRITICAL — manages all card account data, authorisations, and transaction history
**Data classification:** RESTRICTED — cardholder data (PAN, card account details); PCI DSS Cardholder Data Environment (CDE)

**Description:**
The enterprise's core card processing system, managed by a third-party vendor. The system is the authoritative source for all card account data, transaction history, and card controls. The vendor has announced deprecation of the legacy API integration (version 2.x) in 18 months. The enterprise has a contractual right to a 6-month extension if active migration progress is demonstrated by month 12 of the project.

The current integration uses a shared service account with admin-level access. All 11 existing consumer integrations use this shared account — no operation-level access control is in place.

**Hosting:** Vendor-managed (on-premises, vendor data centre)
**Technology stack:** Vendor proprietary; integration via REST API (v2.x — deprecated) and ISO 8583-based file extract
**Environments:** Production, UAT (vendor-provisioned)

---

## Interface Map — Card Core System

### Active consumer integrations (using shared admin service account)

| Interface ID | Consumer application | Data accessed | Authentication | Notes |
|-------------|---------------------|--------------|----------------|-------|
| CCS-CONS-001 | Mobile Banking App | Card summary, transaction history, card controls | Shared admin service account | No operation-level scoping |
| CCS-CONS-002 | Internet Banking | Card summary, transaction history, spend categories | Shared admin service account | No operation-level scoping |
| CCS-CONS-003 | Contact Centre Tooling | Full card account details, transaction history, card status | Shared admin service account | No operation-level scoping |
| CCS-CONS-004–011 | 8 additional internal/external consumer integrations | Various — not all documented | Shared admin service account | Each integration built independently; no common data model |

**Note:** The card core vendor supports role-based API keys with operation-level scoping (v3.x API). Defining the least-privilege roles requires a workshop with each of the 11 consumer teams.

### Cardholder data classifications in scope (PCI DSS)

| Data element | PCI DSS classification | Permitted caching | Notes |
|-------------|----------------------|------------------|-------|
| Full PAN (16-digit card number) | CHD — must never be stored post-authorisation | NOT PERMITTED in any cache | Raw PAN cannot enter the Experience API cache |
| Truncated PAN (last 4 digits) | Non-sensitive CHD element | Permitted subject to PCI DSS requirements | Must not allow full PAN reconstruction |
| Expiry date (alone) | CHD — permitted with truncated PAN | Permitted with truncated PAN only | Expiry alone is not sensitive; combined with full PAN is sensitive |
| CVV / CVC | Sensitive Authentication Data — must never be stored post-authorisation | NOT PERMITTED to be stored or cached under any circumstances | |
| Cardholder name | CHD — sensitive | Cache only if required for function; minimise retention | |
| Transaction history | CHD context — in-scope CDE | Permitted in cache under PCI DSS requirements; no full PAN | |

### Regulatory obligations affecting this application

| Obligation | Regulator | Relevant provision |
|-----------|-----------|------------------|
| PCI DSS — card core system is in-scope CDE; any new integration component or API layer connecting to card core is also in-scope CDE | PCI SSC | PCI DSS v4.0 — Definition of Cardholder Data Environment |
| PCI DSS QSA assessment — new CDE components require QSA assessment before go-live | PCI SSC | PCI DSS v4.0 Requirements 12.3.2 |

### Known constraints and risks

| ID | Description | Severity |
|----|-------------|---------|
| CCS-RISK-001 | Deprecation: vendor API v2.x deprecated in 18 months. All 11 consumer integrations must migrate to the new Experience API before the deprecation deadline. 6-month extension available only if month-12 migration milestone is demonstrated. | HIGH — deadline constraint |
| CCS-RISK-002 | Shared service account: current admin-level shared account is a PCI DSS control deficiency. Any new integration (including the Experience API) must use operation-scoped API keys — not the shared admin account. Role definitions require a workshop before API design can be finalised. | HIGH — PCI DSS control gap |
| CCS-RISK-003 | PCI DSS CDE scope expansion: the Experience API is a new CDE component. Adding new CDE components requires notification and assessment under the enterprise's PCI compliance programme. QSA assessment must be completed before go-live. | HIGH — regulatory gate |

---

## Application Profile 2 — Consent Management Service

**Name:** Consent Management Service
**Owner:** Open Banking Programme, the enterprise
**Domain:** Open Banking / Customer Consent
**Classification:** Internal — regulated (Privacy Act 2020, NZ Open Banking Framework)
**Criticality:** HIGH — controls third-party access to customer financial data
**Data classification:** Restricted — customer consent records, data-sharing authorisations

**Description:**
Internal service managing customer consent for third-party access to the enterprise financial data under the open banking programme. The service was built for the mortgage open banking use case: customers consent to sharing mortgage account data (balance, repayment history, outstanding principal) with accredited mortgage brokers. The service's extensibility to card data has not been assessed by the consent management team.

**Hosting:** Azure (dedicated environment)
**Technology stack:** Node.js API, PostgreSQL (consent store), OAuth 2.0 + PKCE
**Environments:** Production, UAT, Development

---

## Interface Map — Consent Management Service

| Interface ID | Application | Interface type | Purpose | Notes |
|-------------|-------------|---------------|---------|-------|
| CMS-INT-001 | Open Banking API | Internal — inbound | Validates consent token on each data request from third party | Currently scoped for mortgage data types only |
| CMS-INT-002 | Member Identity Service | Internal — inbound | Customer authentication for consent grant flow | |
| CMS-INT-003 | Customer consent portal (member portal) | Internal — inbound | Customer consent management UI | |

### Known constraints and risks

| ID | Description | Severity |
|----|-------------|---------|
| CMS-RISK-001 | Card data scope unconfirmed: the current consent management service was built for mortgage data types. Whether the service can be extended to support card data consent (card summary, transaction history, spend categories) has not been assessed. The consent management team must confirm feasibility before external partner access to card data can be designed or committed. If not extensible, a new consent mechanism must be built into the Experience API gateway layer — this is unscoped and uncosted. | HIGH — design dependency |
| CMS-RISK-002 | Consent data model: the existing consent data model defines consent at the data type level for mortgage products. Card data types are structurally different. A consent model extension assessment is required before assuming the existing data model supports card consent. | MEDIUM |

---

## Application Profile 3 — Redis Cache (Proposed)

**Name:** Redis Cache — Experience API transaction history cache
**Owner:** Technology (proposed; not yet provisioned)
**Domain:** Integration Infrastructure / Caching
**Classification:** Proposed in-scope CDE component — PCI DSS applies if card transaction data is cached
**Criticality:** HIGH (if in-scope CDE) — failure of at-rest encryption requirement would be a PCI DSS violation
**Data classification:** Restricted — card transaction history (PCI DSS in-scope data if at-rest encryption not confirmed)

**Description:**
Proposed in-memory cache to sit in front of the Experience API's card core integration. Intended to reduce card core API load for transaction history queries (90-day history). Redis is proposed because it is already used elsewhere in the enterprise's Azure infrastructure for non-PCI caching use cases.

**Hosting:** Azure Cache for Redis (proposed)
**Technology stack:** Azure Cache for Redis
**Status:** PROPOSED — not yet provisioned; PCI DSS compliance posture NOT YET ASSESSED

---

## Interface Map — Redis Cache (Proposed)

| Interface ID | Application | Interface type | Data cached | Notes |
|-------------|-------------|---------------|------------|-------|
| REDIS-INT-001 | Experience API | Internal — read/write | Card transaction history (truncated PAN only — never full PAN); transaction amounts, dates, categories | **At-rest encryption: STATUS UNCONFIRMED** |

### Regulatory obligations affecting this component

| Obligation | Regulator | Relevant provision |
|-----------|-----------|------------------|
| PCI DSS — any component that stores or processes cardholder data is a CDE component; must meet PCI DSS at-rest encryption requirements | PCI SSC | PCI DSS v4.0 Requirement 3.5 (at-rest data protection) |
| PCI DSS — at-rest encryption for cached cardholder data must use industry-accepted algorithms and key management | PCI SSC | PCI DSS v4.0 Requirement 3.5.1 |

### Known constraints and risks

| ID | Description | Severity |
|----|-------------|---------|
| REDIS-RISK-001 | At-rest encryption status unconfirmed: the security team has not reviewed whether the Azure Cache for Redis configuration in the enterprise's infrastructure has at-rest encryption enabled. Azure Cache for Redis does not enable at-rest encryption by default in all tiers. If at-rest encryption is not confirmed and enabled before card transaction data enters the cache, the Redis cache would be a PCI DSS violation and will fail QSA assessment. | CRITICAL — must be confirmed before design is committed |
| REDIS-RISK-002 | CDE scope: adding Redis as a CDE component adds it to the QSA assessment scope. The QSA must be informed of this component before the assessment window. QSA capacity is in months 8 and 14 — the Redis component must be provisioned and assessed before the selected QSA window. | HIGH |
| REDIS-RISK-003 | PAN prohibition: under no circumstances may full PAN be written to the Redis cache. The Experience API must enforce this at the data transformation layer, not just by policy. | HIGH — design requirement |

---

## External Consumer Profiles — Fintech Partners

### Fintech Partner A

**Name:** [Fintech Partner A — name not recorded in registry]
**Domain:** External — open banking participant
**Access model:** CDR-equivalent consent; customer must grant consent for card data before partner can access
**Integration:** Via Experience API (proposed); subject to consent management confirmation
**Regulatory:** CDR-equivalent consent; data minimisation; DPA in place

### Fintech Partner B

**Name:** [Fintech Partner B — name not recorded in registry]
**Domain:** External — open banking participant
**Access model:** CDR-equivalent consent; customer must grant consent for card data before partner can access
**Integration:** Via Experience API (proposed); subject to consent management confirmation
**Regulatory:** CDR-equivalent consent; data minimisation; DPA in place

---

## Dependencies

**Experience API depends on:**
- Card Core System — authoritative card data source (migrating from v2.x to v3.x API)
- Consent Management Service — consent validation for external partner access (extensibility unconfirmed)
- Redis Cache — transaction history caching (at-rest encryption unconfirmed; CDE scope)

**External partner access depends on:**
- Consent Management Service confirming card data consent scope
- Experience API go-live (not yet built)
- QSA assessment completion (months 8 or 14)

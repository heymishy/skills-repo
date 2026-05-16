# Synthetic EA Registry Entry
# Application: Open Banking Consent Platform (the enterprise)
# Registry version: 2026-Q1
# Status: PLANNED — no existing implementation; this entry models the intended architecture
# Entry type: New Internal Application (open banking programme)

---

## Application Profile

**Name:** Open Banking Consent Platform
**Owner:** Digital Open Banking Programme, the enterprise
**Domain:** Digital / Customer Data Portability
**Classification:** Regulated — Privacy Act 2020, NZ Open Banking Framework (CDR-equivalent)
**Criticality:** HIGH — manages customer consent and authorises third-party access to personal financial data
**Data classification:** Restricted — customer identity, consent records, data-sharing authorisations, access logs

**Description:**
New platform that enables customers to grant, manage, and revoke consent for accredited third parties to access specific categories of their the enterprise financial data via a published API. Consent is granular: customers select specific data types and specific accredited recipients. Consents are time-limited (up to 12 months). On revocation, the platform triggers a deletion workflow requiring the receiving third party to confirm data deletion within 24 hours.

**Hosting:** Azure (new dedicated environment)
**Technology stack:** Node.js API layer, PostgreSQL (consent store), Azure Service Bus (event-driven deletion workflow), React (consent management UI in member portal), OAuth 2.0 + PKCE (consent authorisation)
**Environments:** Production (planned), UAT (in design), Development

---

## Interface Map

### Data source interfaces (authorised sharing pathways — READ ONLY from the enterprise systems)

| Interface ID | Application | Interface type | Data types exposed | Access control |
|-------------|-------------|---------------|-------------------|----------------|
| OBCP-SRC-001 | Core Banking Transaction API | Internal API — read only | Transaction history (up to 12 months), account balances, available credit | Per-consent authorisation token; data minimised to consented fields only |
| OBCP-SRC-002 | Card Services API | Internal API — read only | Credit card statement balances, payment due dates, credit utilisation | Per-consent authorisation token; data minimised to consented fields |
| OBCP-SRC-003 | the enterprise Analytics Engine | Internal API — read only | Enriched insights: spending category breakdowns, estimated monthly income, 90-day projected balance | **Derived data — separate consent scope assessment required before enabling** |

### External-facing (third-party consumer) interface

| Interface ID | Interface type | Data exposed | Authorisation model |
|-------------|---------------|-------------|---------------------|
| OBCP-EXT-001 | REST API (public, versioned) | Any data type consented by the customer for the requesting third party | OAuth 2.0 access token bound to specific consent grant (data type + third party); validated per call |

### Identity and accreditation interfaces

| Interface ID | Application | Interface type | Purpose |
|-------------|-------------|---------------|---------|
| OBCP-ID-001 | Member Identity Service | Internal — read only | Customer authentication for consent grant flow |
| OBCP-ACC-001 | DIA Accreditation Registry API | External — DIA managed | Real-time accreditation status check per API call; result cached for maximum 60 seconds to prevent excessive external calls while maintaining near-real-time status |

### Consent lifecycle interfaces

| Interface ID | Application | Interface type | Purpose |
|-------------|-------------|---------------|---------|
| OBCP-CS-001 | Privacy Consent Store (PostgreSQL) | Internal — read/write | Persist consent grants, revocations, status history; audit trail for Privacy Act compliance |
| OBCP-DEL-001 | Data Deletion Orchestrator (Azure Service Bus) | Internal — outbound event | On revocation: trigger deletion notification workflow to third party; track 24-hour deletion confirmation; escalate to compliance team if not confirmed within window |

---

## Regulatory obligations affecting this application

| Obligation | Regulator | Detail |
|-----------|-----------|--------|
| Privacy Act 2020 (NZ) — Principle 1 (purpose specification), 3 (collection directly from individual), 10 (use limitation), 11 (disclosure to third parties) | Privacy Commissioner | Consent must be explicit, specific as to data type and recipient, and purpose-limited; disclosure scope must match consent scope |
| Privacy Act 2020 — right of access and correction | Privacy Commissioner | Customers can access their consent records; consent decisions must be reversible on customer request |
| NZ Open Banking Framework — CDR-equivalent accreditation scheme | DIA | Only DIA-accredited third parties may receive data; accreditation validated per API call |
| NZ Open Banking Framework — revocation and deletion | DIA | On consent revocation, third party must delete all data within 24 hours; the enterprise must be able to demonstrate deletion compliance on request |
| Privacy Act 2020 — data minimisation (Principle 10 use limitation) | Privacy Commissioner | API responses must not include fields beyond what was explicitly consented; minimisation applied at field level |

---

## Critical architecture constraint: Derived data consent boundary

**OBCP-SRC-003 (the enterprise Analytics Engine — enriched insights) requires separate legal assessment before enablement.**

Enriched insights (spending categories, income estimation, projected balance) are not raw data from the enterprise's core banking system. They are outputs of the enterprise's proprietary internal analytics models applied to transaction data. These outputs constitute inferences about the customer — a distinct category of personal information under the Privacy Act 2020.

Whether a customer consent for "transaction data" covers sharing the enterprise's derived analytical inferences with third parties is a consent scope question that requires Privacy Act legal advice. The concern:
- The customer is consenting to share their transaction history
- the enterprise is using that history as input to its own models
- The model outputs (enriched insights) are the enterprise's internal analytical products
- Sharing those model outputs to third parties under a "transaction data" consent may constitute sharing personal information for a secondary purpose (Principle 10) beyond the purpose for which consent was obtained

**Status:** Privacy Act assessment of derived-data consent scope not yet commissioned. OBCP-SRC-003 must not be enabled in production until this assessment is complete and Privacy Act counsel confirms the consent basis is adequate.

---

## Known constraints and risks

| ID | Description | Severity |
|----|-------------|---------|
| OBCP-RISK-001 | Enriched insights (OBCP-SRC-003) — derived data consent boundary not assessed. Including in launch scope without Privacy Act advice creates Principle 10 violation risk. | HIGH — feature gate required |
| OBCP-RISK-002 | 24-hour deletion confirmation mechanism is not established. Third parties are required to confirm deletion but there is no technical enforcement or independent verification mechanism. | MEDIUM |
| OBCP-RISK-003 | DIA accreditation API call-time validation — 60-second cache may allow a suspended third party 60 additional seconds of data access after suspension. Cache TTL should be risk-assessed. | LOW-MEDIUM |

---

## Dependencies

**This application depends on:**
- Core Banking Transaction API (raw transaction data source)
- Card Services API (card data source)
- the enterprise Analytics Engine (enriched insights — gated by Privacy Act assessment)
- Member Identity Service (customer authentication)
- DIA Accreditation Registry API (third-party accreditation validation)
- Privacy Consent Store (consent persistence)
- Data Deletion Orchestrator (deletion workflow)

**Applications that depend on this application:**
- Accredited third-party applications (external — data consumers)
- Open Banking Analytics Dashboard (internal — consent volume and revocation monitoring)
- Privacy and Compliance team (consent audit trail access)

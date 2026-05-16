# Synthetic Policy Document — S4 Context Injection (Document 2 of 2)
# SYNTHETIC DOCUMENT — for EXP-003-pipeline-eval evaluation only
# Simulates excerpts from PCI DSS v4.0 requirements and internal CDE caching standards.
# Does NOT represent official PCI SSC documentation. Does NOT constitute compliance advice.

---

# Part A — PCI DSS v4.0 — Cardholder Data Environment Classification and At-Rest Data Protection
## Relevant to: New CDE components, caching architectures, API abstraction layers
### (Simulated for EXP-003 S4 evaluation — synthetic standard paraphrase)

---

## Overview

The Payment Card Industry Data Security Standard (PCI DSS) v4.0 applies to any system that stores, processes, or transmits cardholder data (CHD) or sensitive authentication data (SAD). The scope of the Cardholder Data Environment (CDE) is defined broadly: any system component that can affect the security of cardholder data is in scope, including systems that connect to in-scope systems even if they do not directly handle CHD.

Key terms:
- **Cardholder Data (CHD):** At minimum, the full Primary Account Number (PAN). May include cardholder name, expiry date, and service code.
- **Sensitive Authentication Data (SAD):** Data used to authenticate the cardholder, including CVV/CVC, full track data, and PINs. SAD must never be stored post-authorisation under any circumstances.
- **Cardholder Data Environment (CDE):** The people, processes, and technology that store, process, or transmit CHD/SAD, plus all system components in the same network segment.

---

## PCI DSS Requirement 3 — Protect Stored Account Data

### 3.1 — Processes and mechanisms for data retention and disposal

**3.1.1** All security policies and operational procedures for data retention and disposal must be documented and kept current.

**3.1.2** Data storage amounts and retention time must be kept to a minimum. A data retention and disposal policy must define the maximum storage periods for each CHD element, with justification.

**Commentary:** An Experience API caching layer that retains card transaction history must define a cache retention policy. "Until the user session expires" is not a PCI DSS compliant retention definition. The retention period must be the minimum necessary for the caching function, and the justification must be documented.

### 3.2 — Storage of account data is minimised

**3.2.1** SAD must not be retained after authorisation completion. This applies even when the data is encrypted. SAD that is not needed must be deleted immediately after authorisation is complete.

**3.3 — Sensitive authentication data must not be stored**

**3.3.1** SAD (CVV/CVC, full track data, PINs) must not be stored after authorisation, even in encrypted form.

**3.3.2 — Full PAN storage prohibition for cache:**

Full PAN must not be stored in any caching mechanism unless that caching mechanism meets the requirements of 3.5 (at-rest encryption), 3.4 (rendering PAN unreadable), and the cache retention period is defined and enforced.

**Critical point:** Raw PAN (16-digit full card number) must never enter a caching layer in plaintext. The Enterprise may cache truncated PAN (typically last 4 digits only) subject to the conditions in 3.5.

**3.4 — PAN must be rendered unreadable anywhere it is stored**

**3.4.1:** PAN must be rendered unreadable anywhere it is stored using one of the following approaches:
- One-way hashes (indexed based on the entire PAN)
- Truncation (the hashed version of the full PAN cannot be present)
- Index tokens
- Strong cryptography

**Practical note on truncation:** Truncating to last 4 digits only is the safest approach. Storing both a hashed PAN and truncated PAN in the same cache is not permitted — the combination could be used to reconstruct or correlate the full PAN.

---

## PCI DSS Requirement 3.5 — Primary Account Number (PAN) is Secured Wherever Stored

**3.5.1 — At-rest encryption for stored PAN**

Any system that stores PAN (including truncated PAN where the full PAN is also accessible in the environment) must protect stored PAN using strong cryptography.

For caching systems, "strong cryptography" means:
- An industry-accepted algorithm with a key length appropriate for the algorithm (e.g., AES-256)
- Key management practices that meet PCI DSS requirements (key rotation, access controls, key storage separate from encrypted data)

**3.5.1.1 — Disk-level and at-rest encryption**

Where a caching or database system relies on disk-level encryption for at-rest protection:
- The disk-level encryption must be explicitly enabled in the system configuration. Default configurations for cloud-based caching services vary by vendor and tier — it cannot be assumed that at-rest encryption is enabled without verification.
- The organisation must document the encryption configuration and confirm it meets PCI DSS requirements as part of the QSA assessment.

**Note on Azure Cache for Redis:** Azure Cache for Redis supports at-rest encryption through the Premium and Enterprise tiers. The Basic and Standard tiers do not offer at-rest encryption as of v4.0. An Azure Cache for Redis deployment in the Basic or Standard tier that is used to cache any PCI DSS in-scope data (including truncated PAN or transaction history associated with a card account) does not meet PCI DSS Requirement 3.5.1 and will fail QSA assessment. The organisation must confirm the Redis tier and verify that at-rest encryption is explicitly enabled before using Redis as a CDE caching component.

---

## PCI DSS Requirement 6.3 — Security of Software

**6.3.3 — New CDE components require assessment**

All software components in the CDE (including new API layers, caching components, and integration middleware) must be assessed for security vulnerabilities before they are placed into production. For new CDE components, this assessment must be part of the QSA review scope.

---

## PCI DSS Requirement 12.3 — Hardware and Software are Managed

**12.3.2 — Targeted Risk Analysis for Technology Usage**

**QSA assessment window planning:** For organisations undergoing annual QSA assessments, new CDE components must be provisioned and in a stable state before the QSA assessment window opens. Components that are not ready for assessment during the scheduled QSA window must wait for the next available window. Adding a new CDE component after the QSA assessment has been completed requires an out-of-cycle assessment, which is subject to QSA availability and additional cost.

**Practical guidance:** If QSA capacity is available in months 8 and 14 of a project, and a new CDE component (such as an Experience API layer or a caching component) is being developed, the team must plan to have the CDE component provisioned, configured, and security-tested before the month 8 window. If the component is not ready by month 8, the next available assessment window is month 14 — a 6-month delay to go-live.

---

## Part B — Internal CDE Caching Architecture Standards
## (Synthetic internal standard — for EXP-003 S4 evaluation only)

---

## Section 4 — Caching Standards for PCI DSS Environments

### 4.1 — General requirements

Any caching component that stores card transaction data, card account summary data, or any data associated with a cardholder account is in-scope as a CDE component. The following requirements apply to all CDE caching components:

1. **At-rest encryption must be explicitly confirmed** before card data enters the cache. The engineering team is responsible for confirming with the security team that the cache's at-rest encryption is enabled and meets PCI DSS requirements. Confirmation must be documented.

2. **Full PAN must never enter the cache.** The data transformation layer must enforce PAN truncation before writing to the cache. This must be verified by automated test (the test must assert that no write to the cache contains a full 16-digit PAN).

3. **Cache retention period must be defined and enforced.** The maximum cache retention period for card transaction data must be documented and enforced by the caching implementation (TTL configuration). "Indefinite" or "until eviction" retention is not compliant.

4. **Cache access must be authenticated and authorised.** The cache must not be accessible without authentication. Access must be limited to the Experience API service account — no open network access, no access by other services without explicit approval.

5. **Cache must be in the same network boundary as other CDE components.** If the Experience API is deployed to an Azure virtual network, the Redis cache must be in the same virtual network or a peered network segment that is within the CDE boundary. Public-endpoint Redis is not acceptable for CDE data.

### 4.2 — Redis at-rest encryption — required configuration confirmation

Before any card data enters a Redis cache, the engineering team must confirm all of the following:

| Item | Required configuration | Confirmation status |
|------|----------------------|---------------------|
| Azure Cache for Redis tier | Premium or Enterprise only (Basic/Standard do not support at-rest encryption) | **UNCONFIRMED — see REDIS-RISK-001 in EA registry** |
| At-rest encryption feature | Explicitly enabled in the Redis instance configuration | **UNCONFIRMED** |
| Key management | Azure Key Vault or equivalent; key access restricted to Experience API service identity | Not yet designed |
| In-transit encryption | TLS required for all connections to Redis; in-transit encryption enabled | Standard; should be confirmed |
| Network isolation | Redis in a private virtual network endpoint; no public endpoint | Not yet designed |

**None of these items should be assumed from the platform defaults. Each item must be explicitly verified and documented before design sign-off.**

### 4.3 — QSA assessment checklist for CDE caching components

When a new CDE caching component is introduced, the following items must be included in the QSA assessment scope:

- At-rest encryption configuration documentation
- Network topology diagram showing cache placement within CDE boundary
- Access control documentation (authentication, authorisation, least privilege)
- PAN truncation validation evidence (automated test results)
- Cache retention policy documentation and TTL configuration evidence
- Key management documentation

**The QSA will not accept verbal confirmation for any of these items. Documentation must be available and current at the time of assessment.**

# Definition Output — T1 (PCI DSS QSA Explicit)
**Case ID:** T1-explicit-regulated
**Model:** claude-haiku-4-5
**Date:** 2026-05-15
**Eval mode:** true

---

## Entry condition check
✅ Discovery artefact found: "Payment Card Tokenisation" — Status: Approved
✅ Benefit-metric artefact found: "Payment Card Tokenisation — PCI Scope Reduction"
✅ Metrics with targets: 2 (M1: audit scope ≤3 systems; M2: QSA cost ≤£60k)

---

## Step 4a — Regulated constraint propagation check

**Regulated constraints detected in discovery:**

1. **Constraint 1 (C2 — Process Gate):** "PCI DSS QSA sign-off required before production go-live — the tokenisation system must achieve SAQ D compliance and pass an external QSA assessment prior to production activation."
   - Obligation: PCI DSS
   - Approving authority: External QSA
   - Gate condition: SAQ D compliance achieved + QSA sign-off received before production activation
   - Type: Process gate (hard go-live dependency)
   - **Triggers stories:** Any story whose implementation affects payment processing, tokenisation, or vault integration will fall within the PCI DSS scope boundary

2. **Constraint 2 (Technical):** Tokenise/detokenise latency < 200ms additional
3. **Constraint 3 (Technical):** No PAN in logs/errors/debug output

**Constraint propagation plan:**
- C2 will be propagated to at least one story (likely the hardening/compliance story and the go-live-readiness story) as an explicit AC naming PCI DSS, QSA, and SAQ D compliance requirement
- C2 will be recorded in Architecture Constraints field of any core tokenisation story

---

## Step 2 — Slicing strategy

**Strategy chosen:** Vertical slice (thin end-to-end slices; every story independently demo-able)
**Rationale:** Tokenisation is security-critical; each vertical slice can be validated (vault integration verified, latency tested, QSA pathway confirmed) before moving to the next, reducing rework if assumptions fail.

---

## Step 3 — Epic structure

**Single epic: Payment Card Tokenisation Core**
- **Stories:** 5 stories
- **Rationale:** Tokenisation is a cohesive feature with a clear entry/exit point (PAN capture to vault; detokenise on submission). All stories are tightly coupled through the vault integration and PCI DSS scope boundary.

---

## Stories

### Story 1: Vault Integration — TrustVault API Connection

**Persona:** Payments Engineer
**Connects to:** Metric M2 (audit scope reduction requires vault out-of-scope)

**As a** Payments Engineer **I want** to establish a secure, idempotent connection to the TrustVault tokenisation service **so that** card data is immediately moved out of the PCI DSS audit scope

**MVP Scope items covered:** Scope item 2 (integrate TrustVault API)

**Out of scope:**
- Merchant portal integration
- Bulk PAN migration
- Vault failover or redundancy strategies (post-MVP)

**Assumptions to test:**
- TrustVault API supports idempotent tokenisation; if not, story 1.1 (retry logic) is blockedRetry-safe submission architecture needed before this story can be verified

**Architecture Constraints:**
- Network path must be isolated to a dedicated subnet (pending network team capacity)
- All vault credentials must be stored in secure storage (no hardcoding)
- Vault connection timeout must not exceed 50ms at p99 (to stay within SLA budget)

**Acceptance Criteria:**

1. Given the tokenisation service is deployed to staging, When a PAN is submitted to TrustVault via the API, Then the service returns a unique, stable token for that PAN within 50ms at p99

2. Given a PAN has been tokenised once, When the same PAN is submitted again, Then the same token is returned (idempotency verified)

3. Given the vault connection fails, When a tokenise request is made, Then the error is logged (not the raw PAN) and a retry is scheduled with exponential backoff; the request does not fail the payment

---

### Story 2: PAN Tokenisation at Capture — API Boundary Integration

**Persona:** Payments Engineer
**Connects to:** Metric M1 (reduces audit scope) + Metric M2 (reduces QSA effort)

**As a** Payments Engineer **I want** to intercept PAN input at the card capture API endpoint and tokenise it before storing anything in the application database **so that** raw PAN data never enters the audit scope

**MVP Scope items covered:** Scope item 1 (tokenise at API boundary)

**Out of scope:**
- Refund/chargeback flows (handled by vault reference)
- Mobile SDK changes
- Merchant portal changes

**Assumptions to test:**
- Detokenise call latency < 50ms; if not, payment SLA is at risk

**Architecture Constraints:**
- No raw PAN may be logged, cached, or held in application memory
- Tokenisation must occur synchronously at API boundary (before DB write)
- Error messages must never contain PAN fragments

**Acceptance Criteria:**

1. Given a card payment is submitted to the API with a raw PAN, When the request handler receives it, Then the PAN is immediately tokenised via the TrustVault vault, replaced with the token in the request object, and the raw PAN is not persisted to the database

2. Given a tokenisation call fails, When the payment request is rejected, Then the error response contains no PAN data (even truncated) and the raw PAN is not logged to any application log

3. Given the application database is backed up or exported, When a security audit checks for PAN presence, Then zero PAN values are found (only tokens are stored)

---

### Story 3: PAN Detokenisation at Point-of-Use (Payment Submission)

**Persona:** Payments Engineer
**Connects to:** Metric M1 (vault stays out-of-scope) + Metric M2 (fast detokenisation = fast QSA approval)

**As a** Payments Engineer **I want** to detokenise stored PAN tokens at the point of payment submission (only when the token is needed for payment processing) **so that** PAN is held in memory only for the duration of the payment transaction and is not stored or cached

**MVP Scope items covered:** Scope item 3 (detokenise at point-of-use)

**Out of scope:**
- Bulk migration of historical PAN data
- Refund/chargeback detokenisation (handled separately)

**Assumptions to test:**
- Detokenise latency < 50ms at p99; if exceeds 50ms, payment SLA will be exceeded

**Architecture Constraints:**
- PAN must not be cached or stored after detokenisation completes
- Detokenisation must be synchronous (no async workflows holding PAN)
- PAN held in memory must be cleared immediately after payment gateway call completes

**Acceptance Criteria:**

1. Given a payment submission request arrives with a tokenised PAN, When the payment handler detokenises the token via TrustVault, Then a raw PAN is retrieved, used for payment gateway submission within 50ms at p99, and then cleared from memory

2. Given the payment gateway call completes (success or failure), When the handler returns, Then no PAN remains in memory (verified via heap dump or memory inspection in test)

3. Given the detokenisation call fails (vault down), When the payment submission is retried, Then a fresh detokenisation call is made (no stale PAN cached from prior attempt)

---

### Story 4: Audit Logging for Tokenisation and Detokenisation Operations

**Persona:** Payments Compliance Manager
**Connects to:** Metric M1 (audit trail required for QSA approval) + Metric M2 (compliance evidence reduces audit scope)

**As a** Payments Compliance Manager **I want** a tamper-proof audit trail of every tokenise and detokenise operation that records WHO performed it, WHEN it occurred, and the OUTCOME **so that** the QSA can verify that PAN handling is controlled and traceable

**MVP Scope items covered:** Scope item 4 (audit logging)

**Out of scope:**
- Payment transaction logging (separate from tokenisation audit)
- Merchant-side logging
- Historical PAN data audit trails

**Assumptions to test:**
- Audit trail volume at 2,000 TPS peak will not exceed log retention SLA

**Architecture Constraints:**
- Audit log must not contain raw PAN values (only token + masked reference)
- Audit log must be written to a tamper-evident storage (immutable append, integrity checksum)
- Audit log must be replicated to a geographically separate location per AML/CFT Act s.24 (if applicable to payment data)

**Acceptance Criteria:**

1. Given a tokenisation operation succeeds, When the vault returns a token, Then an audit log entry is created with: timestamp (UTC), invoking service/user identity, operation type (tokenise), token (not PAN), vault response code, and result (success/failure)

2. Given a detokenisation operation occurs, When a token is exchanged for a PAN, Then an audit log entry records: timestamp, invoking service/user identity, operation type (detokenise), token ID (not the raw PAN), outcome, and any error details (not the PAN itself)

3. Given a compliance audit queries the audit log, When records for a specific time window are retrieved, Then all tokenise/detokenise operations are enumerable, no PAN values are exposed, and the log entry count matches the transaction count within expected variance (retries, failovers)

---

### Story 5: PCI DSS QSA Sign-Off and Go-Live Readiness

**Persona:** Payments Compliance Manager
**Connects to:** Metric M1 (QSA approval required for scope reduction claim) + Metric M2 (QSA cost metric depends on approval)

**As a** Payments Compliance Manager **I want** the tokenisation system to achieve SAQ D compliance (limited scope questionnaire) and receive an explicit sign-off from an external QSA **so that** the system can be activated in production and the audit scope reduction (14 → ≤3 systems) is formally recognised

**MVP Scope items covered:** Implicit — scope item 1–4 must be complete and verified before this story begins

**Out of scope:**
- Post-go-live QSA re-assessment (separate engagement)
- Ongoing compliance monitoring (separate capability)

**Assumptions to test:**
- QSA engagement timeline: 4–8 weeks from readiness; if longer, go-live is delayed

**Architecture Constraints:**
- All implementation stories (1–4) must be complete and pass security review before QSA engagement begins
- System must be deployed to a production-like staging environment for QSA assessment
- All audit logs, vault configuration, and PAN handling procedures must be documented for QSA review

**Acceptance Criteria:**

1. Given the tokenisation system is deployed to a production-like staging environment, When all stories 1–4 are complete and verified, Then a readiness checklist is compiled covering: vault integration, PAN tokenisation at capture, detokenisation at use, and audit logging, and signed off by the engineering team as "ready for QSA"

2. Given the readiness checklist is signed off, When the QSA engagement is initiated, Then an external QSA (FMA-registered assessor or equivalent) conducts an assessment against PCI DSS SAQ D criteria; the system's vault integration and token-based architecture eliminates the need for the system itself to be PCI-scoped

3. **Given the QSA assessment is complete, When the external QSA confirms SAQ D compliance achieved and the tokenisation architecture eliminates PCI scope for the application tier, Then a formal QSA sign-off document is issued, production activation is permitted, and the scope reduction (14 systems → ≤3 in-scope systems) is formally claimed**

**Architecture Constraints (Regulated — C2):**
- **Regulated constraint C2 (PCI DSS QSA sign-off) is an explicit gate in this story's Acceptance Criterion 3** — production activation is not permitted until this AC is satisfied
- **Approving authority:** External QSA (FMA-registered assessor or equivalent PCI DSS-qualified auditor)
- **Gate condition:** SAQ D compliance achieved + external QSA sign-off document received
- **This story is a hard go-live blocker** — stories 1–4 can be implemented in parallel, but story 5 AC3 must be satisfied before production deployment

---

## Scope accumulator

**Discovery MVP scope items:**
1. ✅ Tokenise PANs at API boundary — covered by Story 2
2. ✅ Integrate with TrustVault — covered by Story 1
3. ✅ Detokenise at point-of-use — covered by Story 3
4. ✅ Audit logging for tokenise/detokenise — covered by Story 4

**Implicit scope items identified and added:**
- Story 5 (QSA compliance gate) — required by Constraint 1; implicit in "production go-live"

**Out-of-scope items correctly excluded:**
- Mobile SDK changes ✅
- Refund/chargeback flows ✅
- Merchant portal ✅
- Bulk PAN migration ✅

**Scope drift:** None — all stories map directly to discovery scope or regulated constraints

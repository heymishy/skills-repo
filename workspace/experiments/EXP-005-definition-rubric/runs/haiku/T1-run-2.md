# Definition Output — T1 (PCI DSS QSA Explicit) — Trial 2
**Case ID:** T1-explicit-regulated
**Model:** claude-haiku-4-5
**Date:** 2026-05-15
**Trial:** 2
**Eval mode:** true

---

## Entry condition check
✅ Discovery artefact found: "Payment Card Tokenisation" — Status: Approved
✅ Benefit-metric artefact found: "Payment Card Tokenisation — PCI Scope Reduction"
✅ Metrics with targets: 2 (M1: audit scope ≤3 systems; M2: QSA cost ≤£60k)

---

## Step 4a — Regulated constraint propagation check

**Regulated constraints detected:**

1. **Constraint 1 (C2 — Process Gate):** "PCI DSS QSA sign-off required before production go-live — the tokenisation system must achieve SAQ D compliance and pass an external QSA assessment prior to production activation."
   - Obligation: PCI DSS
   - Approving authority: External QSA
   - Gate condition: SAQ D compliance + QSA sign-off received before production
   - Type: Hard go-live gate (process gate)

**Constraint propagation plan:**
- C2 will be identified as a regulated constraint requiring sign-off from an external QSA before production deployment
- C2 will be propagated to a hardening/compliance story with an explicit AC

---

## Step 2 — Slicing strategy

**Strategy chosen:** Vertical slice
**Rationale:** PCI DSS tokenisation requires security validation at each step; thin slices enable independent verification and reduce rework risk.

---

## Step 3 — Epic structure

**Epic: Payment Card Tokenisation — PCI Scope Reduction**
- **Stories:** 5 stories
- **Rationale:** Tokenisation is tightly coupled through vault integration and PCI DSS boundary; all stories converge at the QSA compliance gate.

---

## Stories

### Story 1: TrustVault API Integration and Connectivity

**Persona:** Payments Engineer
**Connects to:** Metric M1, M2

**As a** Payments Engineer **I want** to establish a secure, idempotent connection to TrustVault **so that** PANs are tokenised immediately upon capture

**MVP Scope covered:** TrustVault API integration

**Out of scope:** Mobile SDK, refunds, chargeback flows, merchant portal

**Architecture Constraints:**
- Network isolation to dedicated subnet
- Secure credential storage
- p99 latency < 50ms

**Acceptance Criteria:**

1. Given a PAN is submitted to TrustVault, When the API responds, Then a unique token is returned within 50ms at p99

2. Given the same PAN is re-submitted, When the API is called, Then the same token is returned (idempotency)

3. Given vault connection fails, When an error occurs, Then the error is logged without exposing the PAN; automatic retry is scheduled

---

### Story 2: PAN Tokenisation at Card Capture API

**Persona:** Payments Engineer
**Connects to:** Metric M1, M2

**As a** Payments Engineer **I want** to tokenise PANs at the API boundary before any storage **so that** raw PANs never enter the database

**MVP Scope covered:** PAN tokenisation at capture

**Out of scope:** Refunds, chargeback flows, mobile changes

**Architecture Constraints:**
- No PAN in logs, cache, or memory after tokenisation
- Synchronous tokenisation at API boundary
- Error messages must not expose PAN fragments

**Acceptance Criteria:**

1. Given a raw PAN arrives at the API, When the handler processes it, Then the PAN is immediately tokenised, replaced with the token, and the raw value is not persisted

2. Given tokenisation fails, When an error is returned, Then no PAN data appears in the response or logs

3. Given the database is backed up, When a security audit checks for PANs, Then zero PAN values are found (only tokens)

---

### Story 3: PAN Detokenisation at Payment Submission

**Persona:** Payments Engineer
**Connects to:** Metric M1, M2

**As a** Payments Engineer **I want** to detokenise stored PANs only at the point of payment submission **so that** raw PAN is held in memory only for the transaction duration

**MVP Scope covered:** Detokenisation at point-of-use

**Out of scope:** Bulk migration, refund/chargeback detokenisation

**Architecture Constraints:**
- No PAN caching or storage post-detokenisation
- Synchronous detokenisation
- p99 latency < 50ms

**Acceptance Criteria:**

1. Given a tokenised PAN is submitted for payment, When detokenisation occurs, Then the raw PAN is retrieved, used for the payment gateway call, and cleared from memory within 50ms at p99

2. Given the payment completes, When the handler returns, Then no PAN remains in memory

3. Given detokenisation fails, When the payment is retried, Then a fresh detokenisation call is made (no stale PAN cached)

---

### Story 4: Audit Trail for Tokenisation Operations

**Persona:** Payments Compliance Manager
**Connects to:** Metric M1, M2

**As a** Payments Compliance Manager **I want** a tamper-proof audit trail of every tokenise and detokenise operation **so that** QSA can verify controlled PAN handling

**MVP Scope covered:** Audit logging

**Out of scope:** Payment transaction logging, merchant-side logging, historical audit

**Architecture Constraints:**
- Audit log contains no raw PAN (token + masked reference only)
- Immutable append, integrity checksum
- Geographically separate replication per AML/CFT

**Acceptance Criteria:**

1. Given a tokenisation succeeds, When the vault responds, Then an audit log entry is created with: timestamp, invoking service/user, operation type (tokenise), token ID (not PAN), result

2. Given a detokenisation occurs, When a token is exchanged, Then an audit log entry records: timestamp, service/user, operation type (detokenise), token ID (not PAN), outcome

3. Given a compliance audit queries the log, When records are retrieved, Then all operations are enumerable, no PAN values exposed, and count matches transaction count within variance

---

### Story 5: PCI DSS QSA Compliance Assessment and Sign-Off (Go-Live Gate)

**Persona:** Payments Compliance Manager
**Connects to:** Metric M1, M2

**As a** Payments Compliance Manager **I want** the tokenisation system to receive SAQ D sign-off from an external QSA **so that** production activation is permitted and audit scope reduction is formally recognised

**MVP Scope covered:** Implicit — scope items 1–4 must be complete before QSA engagement

**Out of scope:** Post-go-live QSA re-assessment, ongoing compliance monitoring

**Architecture Constraints:**
- All implementation stories (1–4) complete and verified before QSA engagement
- Production-like staging environment for assessment
- Full audit logs, vault config, PAN handling procedures documented

**Acceptance Criteria:**

1. Given stories 1–4 are complete, When a readiness checklist is compiled, Then it covers: vault integration, tokenisation at capture, detokenisation at use, audit logging; signed off by engineering as "ready for QSA"

2. Given the checklist is approved, When QSA engagement begins, Then an external QSA (FMA-registered assessor or PCI DSS-qualified auditor) conducts SAQ D assessment; the system's vault integration eliminates PCI scope for the application tier

3. **Given the QSA assessment completes, When the external QSA confirms SAQ D compliance and scope elimination, Then a formal QSA sign-off document is issued, production activation is permitted, and the scope reduction claim (14 → ≤3 systems) is formally recognised**

**Regulated Constraint (C2 — PCI DSS QSA Sign-Off):**
- **This story contains the hard go-live gate: AC 3 must be satisfied (external QSA sign-off received) before production deployment**
- **Approving authority:** External QSA (PCI DSS-qualified auditor)
- **Gate condition:** SAQ D compliance achieved + QSA sign-off document issued

---

## Scope accumulator

**MVP scope coverage:**
1. ✅ TrustVault API integration → Story 1
2. ✅ PAN tokenisation at capture → Story 2
3. ✅ Detokenisation at point-of-use → Story 3
4. ✅ Audit logging → Story 4

**Regulated constraints:**
- ✅ C2 (PCI DSS QSA sign-off) → Story 5 AC3

**Out-of-scope correctly excluded:**
- Mobile SDK ✅
- Refunds/chargebacks ✅
- Merchant portal ✅
- Bulk PAN migration ✅

**Scope drift:** None

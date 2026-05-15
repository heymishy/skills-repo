# Definition Output — T1 (PCI DSS QSA Explicit) — Trial 2
**Case ID:** T1-explicit-regulated
**Model:** claude-sonnet-4-6
**Date:** 2026-05-15
**Eval mode:** true

---

## Entry condition check
✅ Discovery artefact found: "Payment Card Tokenisation — PCI Scope Reduction" — Status: Approved
✅ Benefit-metric artefact found: "Payment Card Tokenisation — PCI Scope Reduction"
✅ Metrics with targets: 2 (M1: PCI DSS audit scope ≤3 in-scope systems; M2: annual external QSA assessment cost ≤£60,000)

---

## Step 4a — Regulated constraint propagation check

**Scanning discovery for regulated constraints...**

**Constraints section:**
Identified: "PCI DSS QSA sign-off required before production go-live — the tokenisation system must achieve SAQ D compliance and pass an external QSA assessment prior to production activation."

**C2 constraint analysis:**
- **Obligation:** PCI DSS (Payment Card Industry Data Security Standard) — scope reduction from 14 to ≤3 in-scope systems
- **Approving authority:** External Qualified Security Assessor (QSA) — PCI Security Standards Council-certified third party
- **Gate condition:** Three-part requirement must ALL be met: (1) SAQ D (Self-Assessment Questionnaire D) compliance assessment completed, (2) external QSA assessment passed with no unresolved findings, (3) formal QSA sign-off document received — production activation is explicitly prohibited until all three are satisfied
- **Type:** Process gate — an external regulated certification that is a hard production dependency
- **Stories triggered:** All stories whose implementation introduces, modifies, or extends the cardholder data environment boundary — vault integration, tokenisation at capture, detokenisation at use, and audit logging; plus the dedicated QSA gate story

**Constraint propagation plan:**
- C2 must appear as an explicit AC in the QSA gate story (not only a note)
- C2 must appear in Architecture Constraints of all stories within the CDE scope
- Technical NFRs (latency, log scanning) do not constitute regulated constraints — treated separately

---

## Step 1.5 — Architecture constraints scan

`.github/architecture-guardrails.md` not present in corpus. No guardrails applicable.

---

## Step 2 — Slicing strategy

**Strategy chosen:** Walking skeleton
**Rationale:** TrustVault API integration is the highest-risk dependency — scheme API stability, token idempotency, and CDE boundary definition are unknowns. Walking skeleton establishes the vault connection and confirms end-to-end path (capture → tokenise → store → detokenise) on the thinnest possible implementation before building hardening, audit, and the QSA compliance gate. De-risks the vault integration assumption before the full story set is committed.

---

## Step 3 — Epic structure

**Single epic: Payment Card Tokenisation — PCI Scope Reduction**
- **Stories:** 5 stories
- **Rationale:** The feature is a single end-to-end integration with one hard regulated gate (QSA sign-off). Five closely related stories with a shared compliance dependency; single epic provides full constraint visibility across all stories.

---

## Stories

### Story 1: TrustVault API Connection and Credential Management

**Persona:** Payments Platform Engineer
**Connects to:** Metric M1 (vault connection is the structural foundation — without it, no CDE scope reduction is possible)

**As a** Payments Platform Engineer **I want** to establish and maintain a secure, authenticated connection to the TrustVault tokenisation API with automated credential rotation **so that** the payments platform can delegate PAN custody to TrustVault, enabling the scope boundary shift that reduces the CDE to ≤3 in-scope systems

**MVP Scope items covered:** TrustVault API integration (scope item 2)

**Out of scope:**
- Multi-vault failover (post-MVP resilience)
- Vault configuration UI
- Bulk PAN migration from legacy storage
- Performance benchmarking suite

**Assumptions to test:**
- TrustVault provides a sandbox environment accessible from the development network
- TrustVault credential rotation is atomic — no gap period during rotation

**Architecture Constraints:**
- TrustVault credentials must be stored in approved secrets management — no plaintext environment variables, no hardcoded values
- Network path to TrustVault must traverse only the approved network zone — no public internet path
- **Regulated constraint C2 (PCI DSS QSA):** Implementation falls within the PCI DSS CDE. QSA assessment and SAQ D sign-off (Story 5 AC3) gate production activation.

**Acceptance Criteria:**

1. Given TrustVault credentials are provisioned in the secrets management system, When the tokenisation service initialises, Then it successfully authenticates to TrustVault, the vault health check returns HTTP 200, and no credentials are logged or included in any response body

2. Given the tokenisation service is running and TrustVault credentials are rotated by the secrets management system, When the rotation completes, Then the service picks up the new credentials within 60 seconds without requiring a restart and without dropping any in-flight tokenisation requests

3. Given a connection attempt is made with revoked or expired credentials, When TrustVault returns HTTP 401, Then the service returns an internal error code (not the raw vault response), logs the failure with a masked credential reference, and raises an alert to the on-call engineer

---

### Story 2: PAN Tokenisation at the Payment Capture Boundary

**Persona:** Payments Platform Engineer
**Connects to:** Metric M1 (tokenising at capture removes PAN from the application layer; this is the primary scope reduction mechanism)

**As a** Payments Platform Engineer **I want** to intercept inbound PAN data at the payment API boundary and replace it with a TrustVault token before the PAN is processed, persisted, or forwarded **so that** raw PAN data never crosses into the application tier, achieving the CDE scope reduction necessary to bring the audit scope below ≤3 systems

**MVP Scope items covered:** Tokenise PAN at capture (scope item 1)

**Out of scope:**
- Re-tokenisation of historical PANs in existing storage
- CVV and expiry tokenisation
- Mobile SDK integration
- Merchant portal changes

**Assumptions to test:**
- Token format is compatible with existing payment processing downstream (field width, character set)
- PAN interception is possible at the API gateway layer without modifying downstream services

**Architecture Constraints:**
- PAN interception must be the first operation at the API boundary — before any logging, database write, or service call
- **NFR:** Tokenisation latency ≤200ms at p99 (from PAN received to token returned to caller)
- **NFR:** PAN must not appear in any log file, trace, or debug output — enforced by log scanning in AC3
- **Regulated constraint C2 (PCI DSS QSA):** Tokenisation at capture is the core scope-reduction mechanism. QSA assessment (Story 5 AC3) gates production activation.

**Acceptance Criteria:**

1. Given a payment request containing a valid PAN is received at the API boundary, When the tokenisation interceptor processes the request, Then a TrustVault token is returned within 200ms at p99, the PAN is absent from the response and all downstream service calls, and the token is used exclusively for all subsequent processing

2. Given the same PAN is submitted in two separate payment requests, When both tokenise against TrustVault, Then both requests receive the same token (confirming idempotency) and no PAN is transmitted to TrustVault on the second request if the vault caches by PAN hash

3. Given 500 payment requests have been processed in the test environment, When application logs are scanned for PAN patterns (16-digit sequences), Then zero PAN values are found in any log line, error record, or structured trace

---

### Story 3: Detokenisation at the Point of Payment Use

**Persona:** Payments Settlement Engineer
**Connects to:** Metric M1 (detokenisation confirms vault holds canonical PAN; application layer holds no PAN state)

**As a** Payments Settlement Engineer **I want** to retrieve the original PAN from TrustVault at the specific point of use (payment submission to scheme) and have it discarded immediately after use **so that** PAN is materialised only in a scoped, isolated process for the minimum time required, and the settlement flow confirms the scope boundary is maintained throughout

**MVP Scope items covered:** Detokenise at point of use (scope item 3)

**Out of scope:**
- Batch detokenisation for settlement (post-MVP)
- Refund and chargeback path detokenisation
- Detokenisation audit log (covered by audit story)

**Assumptions to test:**
- Detokenisation can be isolated to a single function scope with no PAN persistence after the scope exits
- Scheme submission is the only required detokenisation point in the MVP flow

**Architecture Constraints:**
- Detokenised PAN must not be assigned to a variable that persists beyond the immediate scheme submission call
- No PAN marshalling to string, logging, or passing as a parameter to any downstream function
- **NFR:** Detokenisation latency ≤200ms at p99
- **Regulated constraint C2 (PCI DSS QSA):** Detokenisation at use is within CDE scope. QSA sign-off (Story 5 AC3) gates production activation.

**Acceptance Criteria:**

1. Given a valid TrustVault token is submitted to the detokenisation endpoint, When TrustVault returns the PAN, Then the PAN is used for the scheme submission and is not present in any downstream response, log, or database record after the transaction completes

2. Given the detokenisation process completes, When memory is inspected immediately after (in a test harness), Then no PAN value is held in application memory after the scheme submission call returns

3. Given an invalid token is submitted (not found in vault), When TrustVault returns a 404, Then the service returns a structured error to the caller without exposing the vault error body, logs the event without logging the token value, and does not retry

---

### Story 4: Tamper-Evident Tokenisation Audit Log

**Persona:** PCI DSS Compliance Officer
**Connects to:** Metric M2 (pre-compiled audit evidence reduces QSA assessment duration and cost)

**As a** PCI DSS Compliance Officer **I want** every tokenisation and detokenisation event to be recorded in a tamper-evident, append-only audit log with full event context but no raw PAN **so that** the external QSA assessor can validate the CDE scope boundary and verify PAN handling completeness without accessing production payment data

**MVP Scope items covered:** Audit logging (scope item 4)

**Out of scope:**
- Real-time compliance monitoring
- SIEM integration
- Audit log visualisation
- Historic audit log backfill

**Assumptions to test:**
- Audit log retention infrastructure supports ≥1 year hot tier access for QSA review
- Append-only guarantee is available at the storage layer without application-level enforcement

**Architecture Constraints:**
- Audit log entries must be written by the tokenisation service — not derived from infrastructure logs
- Every entry must contain: event type, UTC timestamp, correlation ID, result (success/failure), masked token (first/last 4 chars), actor identity — and must never contain PAN
- **Regulated constraint C2 (PCI DSS QSA):** Audit trail completeness is required for SAQ D compliance (PCI DSS Requirement 10). Story 5 AC3 cannot be satisfied without this story's AC2 being met.

**Acceptance Criteria:**

1. Given a tokenisation or detokenisation event occurs, When the audit logger is invoked, Then an entry is written within 100ms, containing: event type, UTC timestamp, correlation ID, result, masked token, actor identity — and the entry is immediately available for query

2. Given 100,000 events are processed in a load test, When the audit log is scanned for PAN patterns, Then zero PAN values are found, and the event count in the audit log matches the tokenisation service transaction count with no gaps

3. Given a direct deletion or modification request is submitted to the audit log storage layer, When the operation is attempted, Then the storage layer rejects the operation, the existing entry is unchanged, and a deletion-attempt record is written

---

### Story 5: External QSA Assessment and SAQ D Production Gate

**Persona:** PCI DSS Compliance Officer
**Connects to:** Metric M2 (QSA cost reduction via SAQ D path; formal sign-off completes M2 target)

**As a** PCI DSS Compliance Officer **I want** to conduct the external QSA assessment, confirm SAQ D compliance, obtain the formal QSA sign-off document, and use this as the hard production activation gate **so that** the tokenised payment architecture enters production only after formal PCI DSS certification, protecting the bank from regulatory liability and validating the scope reduction claim from 14 to ≤3 in-scope systems

**MVP Scope items covered:** QSA compliance gate

**Out of scope:**
- PCI DSS Requirement 12 documentation programme
- Network segmentation design (infrastructure team)
- Ongoing QSA monitoring and attestation cadence
- Card brand scope-reduction notification

**Assumptions to test:**
- QSA firm engagement is in progress before this story begins
- SAQ D is confirmed as the applicable questionnaire type for this scope

**Architecture Constraints:**
- **Regulated constraint C2 (PCI DSS QSA — HARD PRODUCTION GATE):** This story is the process gate. Production activation is blocked until AC3 is satisfied. No exceptions, no pilot volume, no shadow production routing through the tokenised path before formal QSA sign-off.
- QSA assessment scope must cover Stories 1–4 and all associated implementation artefacts
- SAQ D compliance requires all of PCI DSS Requirements 2–12 relevant to the CDE boundary — QSA must confirm scope applicability

**Acceptance Criteria:**

1. Given Stories 1–4 are deployed to the QSA-accessible pre-production environment, When the QSA firm begins the formal assessment, Then the assessment scope is documented to cover: TrustVault API integration, tokenisation at capture, detokenisation at use, and audit logging — with test evidence artefacts for all Stories 1–4 ACs

2. Given a QSA finding is raised during assessment (e.g. a log scanning failure, audit log gap, or scope boundary violation), When the finding is communicated to the engineering team, Then the finding is entered in the remediation register, the go-live gate remains blocked, and the QSA confirms finding closure before AC3 can be satisfied

3. **Given** the external QSA assessment is concluded, **When** the QSA firm confirms that: (a) the tokenisation architecture achieves SAQ D compliance, (b) the application tier and all Stories 1–4 implementation artefacts have no unresolved findings, and (c) the PCI DSS audit scope is reduced to ≤3 in-scope systems, **Then** the QSA issues a formal written sign-off document to the PCI DSS Compliance Officer, production activation of the tokenised payment flow is permitted, and the scope reduction is formally documented in the QSA report — **production must not be activated before this document is received**

---

## Step 4a verification — constraint propagation complete

| Constraint | Stories with Architecture Constraint note | Stories with explicit AC |
|-----------|------------------------------------------|--------------------------|
| C2 — PCI DSS QSA (SAQ D gate) | Stories 1, 2, 3, 4 | Story 5 AC3 ✅ |

✅ **Regulated constraint propagation check complete (Step 4a)**
Constraints checked: 1 | Stories updated: 5 | Trigger exclusions: 0

---

## Step 5 — Benefit coverage matrix

| Metric | Stories that move it |
|--------|---------------------|
| M1: PCI DSS audit scope ≤3 systems | Story 1 (vault integration removes app layer), Story 2 (tokenise at capture — primary mechanism), Story 3 (detokenise at use — confirms no in-flight PAN) |
| M2: QSA cost ≤£60,000 | Story 4 (pre-compiled audit evidence reduces assessment hours), Story 5 (SAQ D path replaces full on-site QSA) |

No metric gaps. All 5 stories trace to at least one metric.

---

## Step 6 — Scope accumulator

**Discovery MVP scope items:** 4
1. Tokenise PAN at capture — Story 2 ✅
2. TrustVault API integration — Story 1 ✅
3. Detokenise at point of use — Story 3 ✅
4. Audit logging — Story 4 ✅

**Stories written:** 5
**Coverage:** 4/4 items covered
**Scope additions:** 0 (Story 5 is the C2 process gate — not a scope addition, a compliance dependency)
**Scope ratio:** 5/4 = 1.25 — acceptable

✅ **Scope check passed** — 5 stories, 4 MVP items covered. Story 5 mandated by PCI DSS C2 constraint.

---

## Definition complete ✅

Epics: 1
Stories: 5
Slicing strategy: Walking skeleton
Scope check: ✅ Clean
Regulated constraint check: ✅ C2 (PCI DSS QSA — SAQ D) propagated to Story 5 AC3 with explicit language naming PCI DSS, external QSA, and SAQ D compliance. Architecture Constraints in Stories 1–4.

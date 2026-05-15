# Definition Output — T1 (PCI DSS QSA Explicit)
**Case ID:** T1-explicit-regulated
**Model:** claude-sonnet-4-6
**Date:** 2026-05-15
**Eval mode:** true

---

## Entry condition check
✅ Discovery artefact found: "Payment Card Tokenisation — PCI Scope Reduction" — Status: Approved
✅ Benefit-metric artefact found: "Payment Card Tokenisation — PCI Scope Reduction"
✅ Metrics with targets: 2 (M1: PCI DSS audit scope reduced to ≤3 in-scope systems; M2: annual QSA assessment cost ≤£60,000)

---

## Step 4a — Regulated constraint propagation check

**Regulated constraints detected in discovery:**

1. **Constraint 1 (C2 — Process Gate):** "PCI DSS QSA sign-off required before production go-live — the tokenisation system must achieve SAQ D compliance and pass an external QSA assessment prior to production activation."
   - Obligation: PCI DSS (Payment Card Industry Data Security Standard)
   - Approving authority: External QSA (Qualified Security Assessor — PCI SSC-certified auditor)
   - Gate condition: SAQ D (Self-Assessment Questionnaire D) compliance achieved AND external QSA assessment passed AND formal sign-off document issued — production activation not permitted until all three conditions met
   - Type: Process gate — hard go-live dependency with no technical workaround
   - **Triggers stories:** All stories whose implementation scope falls within the PCI DSS cardholder data environment (CDE) — specifically vault integration, tokenisation at capture, detokenisation at use, and the go-live readiness story
   - **CPF mandate:** C2 must propagate to at least one story as an explicit named AC (not only an architecture note) naming PCI DSS, external QSA, and SAQ D compliance

2. **Constraint 2 (Technical NFR):** Tokenise and detokenise operations each ≤200ms additional latency at p99
3. **Constraint 3 (Technical NFR):** PAN (Primary Account Number) must never appear in application logs, error traces, or debug output

**Constraint propagation plan:**
- C2 will be elevated to an explicit AC in Story 5 (QSA Compliance Assessment and Go-Live Gate) — the dedicated gate story
- C2 will additionally appear in Architecture Constraints fields of Stories 1–3 (vault integration, tokenisation, detokenisation) to document their CDE scope
- Constraint 2 will be an NFR note in Stories 2 and 3
- Constraint 3 will be an AC in all stories that handle payment data

---

## Step 1.5 — Architecture constraints scan

`.github/architecture-guardrails.md` not present in corpus. Proceeding without guardrail check.

⚠️ No architecture-guardrails.md found — proceeding without guardrail check.

---

## Step 2 — Slicing strategy

**Strategy chosen:** Walking skeleton
**Rationale:** Tokenisation is a new third-party integration (TrustVault) with significant uncertainty around vault response characteristics, idempotency behaviour, and PCI scope boundary definition. A walking skeleton establishes the thinnest possible end-to-end path (capture → tokenise → store token → detokenise at use) before building out audit, hardening, and the QSA gate. This de-risks vault API assumptions before investing in the compliance story.

---

## Step 3 — Epic structure

**Single epic: Payment Card Tokenisation — PCI Scope Reduction Core**
- **Stories:** 5 stories
- **Rationale:** Tokenisation is a cohesive end-to-end feature with a hard go-live dependency (QSA gate). All stories are tightly coupled through the TrustVault integration and shared PCI DSS CDE scope. A single epic keeps the regulated constraint gate visible across the full story set.

---

## Stories

### Story 1: TrustVault API Integration — Walking Skeleton

**Persona:** Payments Platform Engineer
**Connects to:** Metric M1 (vault integration is the structural change that moves systems out of CDE)

**As a** Payments Platform Engineer **I want** to establish an authenticated, resilient connection to the TrustVault tokenisation API with credential rotation support **so that** the payments platform can delegate cardholder data storage to TrustVault, removing in-scope systems from the PCI DSS audit perimeter

**MVP Scope items covered:** TrustVault API integration (scope item 2)

**Out of scope:**
- Vault failover and hot-standby redundancy (post-MVP resilience story)
- Bulk PAN migration from existing storage
- Merchant portal or front-end integration
- Vault performance benchmarking beyond integration smoke test

**Assumptions to test:**
- TrustVault API returns stable, deterministic tokens for the same PAN input (idempotency) — Story 2 depends on this
- Vault credential rotation does not interrupt in-flight tokenisation requests — to be validated in Story 2 integration test

**Architecture Constraints:**
- All TrustVault API credentials must be stored in secrets management (no hardcoding, no environment variable plaintext)
- Network path to TrustVault must be isolated to a dedicated subnet — network team capacity to be confirmed before Story 2
- **Regulated constraint C2 (PCI DSS QSA):** This story's implementation falls within the PCI DSS cardholder data environment boundary. The QSA assessment gate in Story 5 AC3 applies to this story's implementation.

**Acceptance Criteria:**

1. Given the tokenisation service is deployed to staging with valid TrustVault credentials, When a vault health-check request is issued, Then the TrustVault API responds with HTTP 200 within 100ms and the integration test suite passes with zero failures

2. Given a connection request is issued with an expired or invalid credential, When TrustVault responds with a 401, Then the service returns a standardised internal error code (not a vault error body containing any payment data), logs the failure without any PAN content, and does not retry with the same credential

3. Given the TrustVault credentials are rotated by the secrets management system, When the next tokenisation request arrives after rotation, Then the service uses the new credential without requiring a restart and without dropping any in-flight requests

---

### Story 2: PAN Tokenisation at Capture

**Persona:** Payments Platform Engineer
**Connects to:** Metric M1 (tokenisation at capture removes PAN from application layer; reduces CDE scope)

**As a** Payments Platform Engineer **I want** to intercept PAN data at the point of capture in the payment API and immediately exchange it for a TrustVault token before any persistence or downstream processing **so that** the application tier never stores, logs, or forwards a raw PAN, achieving scope elimination for the application layer

**MVP Scope items covered:** Tokenise PAN at capture (scope item 1)

**Out of scope:**
- Re-tokenisation of existing stored PANs (bulk migration — separate story)
- Tokenisation of non-PAN fields (expiry, CVV — post-MVP)
- Mobile SDK integration
- Merchant self-service portal

**Assumptions to test:**
- Payment capture API can be intercepted at the inbound request boundary without requiring downstream service changes
- TrustVault token size fits existing schema field widths without migration

**Architecture Constraints:**
- PAN interception must occur before any logging, persistence, or downstream fanout — the raw PAN must never cross a service boundary
- **NFR (Constraint 2):** Tokenisation overhead ≤200ms at p99 from PAN received to token returned to caller
- **NFR (Constraint 3):** PAN must be overwritten in memory immediately after tokenisation; must never appear in structured logs, error traces, or debug output — validated by log scanning in AC3
- **Regulated constraint C2 (PCI DSS QSA):** This story introduces the primary scope-reduction mechanism. SAQ D compliance and QSA assessment (Story 5) gate production activation of this story's implementation.

**Acceptance Criteria:**

1. Given a payment capture request containing a valid PAN is received at the API boundary, When the tokenisation interceptor processes the request, Then a TrustVault token is returned within 200ms at p99, the raw PAN is not present in the response, and all downstream processing uses the token exclusively

2. Given a PAN tokenisation is initiated, When TrustVault returns the same token for the same PAN on a subsequent call, Then idempotency is confirmed — resubmitting the same PAN produces the same token, and the token is stable across vault sessions

3. Given the tokenisation flow has processed 1,000 payment requests in the test environment, When the application log output is scanned for PAN patterns (16-digit numeric sequences), Then zero PAN values are found in any log line, error trace, or debug output

---

### Story 3: Token Detokenisation at Point of Use

**Persona:** Payments Settlement Engineer
**Connects to:** Metric M1 (detokenisation at use confirms the vault holds the canonical PAN; application tier remains out of CDE)

**As a** Payments Settlement Engineer **I want** to retrieve the original PAN from TrustVault at the point of use (payment submission, refund, chargeback) and have it immediately discarded post-use **so that** the PAN is only materialised for the minimum duration required, in an isolated process that does not interact with the broader application layer

**MVP Scope items covered:** Detokenise at point of use (scope item 3)

**Out of scope:**
- Bulk detokenisation for batch settlement (post-MVP)
- Refund or chargeback workflow integration (post-MVP)
- PAN masking display for customer portal

**Assumptions to test:**
- Detokenisation can be isolated to a separate process with no persistent PAN state
- Point-of-use scope is narrowly defined and does not extend to settlement batch processes

**Architecture Constraints:**
- Detokenised PAN must remain within an isolated process scope — no PAN marshalled to a string, logged, or passed to a downstream service
- Detokenisation must only occur at a named integration point (payment gateway submission); no ad-hoc detokenisation paths
- **NFR (Constraint 2):** Detokenisation overhead ≤200ms at p99
- **NFR (Constraint 3):** PAN must not appear in any log output during or after detokenisation
- **Regulated constraint C2 (PCI DSS QSA):** This story extends the CDE scope reduction. QSA assessment gate (Story 5) applies to production activation.

**Acceptance Criteria:**

1. Given a valid token is submitted to the detokenisation endpoint, When TrustVault returns the original PAN, Then the PAN is available to the point-of-use caller within 200ms at p99 and is not persisted to any storage

2. Given the detokenisation process completes, When a log scan is performed immediately after, Then zero PAN values appear in application logs, and the process memory does not retain the PAN after the transaction completes

3. Given an invalid or unknown token is submitted to the detokenisation endpoint, When TrustVault returns a 404 or error, Then the service returns a standardised error response without retrying, without logging the token value, and without surfacing the vault error body to the caller

---

### Story 4: Tokenisation Audit Trail and Compliance Logging

**Persona:** PCI DSS Compliance Officer
**Connects to:** Metric M2 (audit trail reduces QSA assessment time — evidence is pre-compiled)

**As a** PCI DSS Compliance Officer **I want** an immutable, tamper-evident audit log of all tokenisation and detokenisation events, including timestamp, correlation ID, result, and actor — but never including raw PAN or full token — **so that** the external QSA assessor can validate the CDE scope boundary and confirm that PAN handling events are fully accounted for without requiring access to production payment data

**MVP Scope items covered:** Audit logging for tokenise/detokenise events (scope item 4)

**Out of scope:**
- Real-time compliance dashboard
- Audit log export to SIEM
- Historical audit log migration
- QSA report generation

**Assumptions to test:**
- Audit log format meets QSA evidence requirements — needs a pre-assessment review with the QSA firm
- Log retention infrastructure (≥1 year at hot tier for QSA access) is already available

**Architecture Constraints:**
- Audit log entries must be append-only — no update or delete operations permitted at the log storage layer
- Log entries must include: event type, timestamp (UTC), correlation ID, result (success/failure), masked token (first 4 + last 4 chars only), actor identifier — PAN must never appear
- **Regulated constraint C2 (PCI DSS QSA):** Audit log completeness is a prerequisite for SAQ D compliance (Requirement 10). QSA gate (Story 5 AC3) can only be satisfied if this story's AC2 is met.

**Acceptance Criteria:**

1. Given a tokenisation event completes (success or failure), When the audit log is queried for the corresponding correlation ID, Then an immutable log entry is present containing event type, UTC timestamp, result, masked token, and actor identifier — with no PAN present

2. Given 10,000 tokenisation events are processed in the test environment, When the audit log is scanned for PAN patterns, Then zero PAN values appear in any log entry, and all 10,000 events have corresponding log entries with no gaps

3. Given an attempt is made to delete or modify an existing audit log entry (directly via storage API), When the operation is attempted, Then the storage layer rejects the operation and the audit log entry remains unchanged

---

### Story 5: PCI DSS QSA Compliance Assessment and Go-Live Gate

**Persona:** PCI DSS Compliance Officer
**Connects to:** Metric M2 (QSA cost reduction — SAQ D path reduces assessment scope vs full QSA)

**As a** PCI DSS Compliance Officer **I want** to coordinate the external QSA assessment of the tokenised payment system, obtain formal SAQ D compliance sign-off, and use this as the explicit go-live gate for production activation **so that** the bank meets its PCI DSS obligations before processing live payment volume through the tokenised architecture and avoids regulatory penalties for non-compliant production activation

**MVP Scope items covered:** PCI DSS QSA gate (compliance scope item)

**Out of scope:**
- PCI DSS Requirement 12 (policy and procedure documentation — separate programme)
- Network segmentation design (network team dependency)
- Card brand notification of scope reduction (post go-live)
- Ongoing QSA monitoring cadence (post-MVP operational story)

**Assumptions to test:**
- QSA firm has been engaged or is in procurement — Story 5 cannot start without a QSA firm identified
- SAQ D is the correct questionnaire type for this scope (to be confirmed with QSA before assessment starts)

**Architecture Constraints:**
- **Regulated constraint C2 (PCI DSS QSA — HARD GATE):** This story IS the regulated process gate. Production activation of the tokenised architecture is explicitly blocked until AC3 below is satisfied. No exception, no interim production use, no shadow-mode bypass of this constraint.
- Go-live gate is binary — QSA sign-off document must be received before any production traffic is routed through the tokenised path
- QSA assessment scope must include all stories 1–4 implementation artefacts

**Acceptance Criteria:**

1. Given the Stories 1–4 implementations are deployed to a QSA-accessible staging environment, When the QSA assessment begins, Then the QSA firm confirms the assessment scope covers: vault integration, tokenisation at capture, detokenisation at use, and audit logging — and all Stories 1–4 ACs have corresponding evidence artefacts

2. Given the QSA assessment is in progress, When the QSA identifies any finding that would prevent SAQ D compliance (e.g. logging violation, scope boundary failure, audit log gap), Then the finding is logged in the remediation tracker and the go-live gate (AC3) remains blocked until the finding is closed and re-assessed

3. **Given** the external QSA assessment is complete, **When** the QSA confirms that the tokenisation architecture achieves SAQ D compliance and that the application tier has achieved PCI DSS scope elimination (≤3 in-scope systems), **Then** a formal QSA sign-off document is issued to the Compliance Officer, production activation of the tokenised payment flow is permitted, and the scope reduction claim (from 14 to ≤3 in-scope systems) is formally documented in the QSA report — **and not before**

---

## Step 4a verification — constraint propagation complete

| Constraint | Stories with Architecture Constraint note | Stories with AC |
|-----------|------------------------------------------|-----------------|
| C2 — PCI DSS QSA (process gate) | Stories 1, 2, 3, 4 | Story 5 AC3 ✅ |

✅ **Regulated constraint propagation check complete (Step 4a)**
Constraints checked: 1 | Stories updated: 5 | Trigger exclusions logged: 0

---

## Step 5 — Benefit coverage matrix

| Metric | Stories that move it |
|--------|---------------------|
| M1: PCI DSS audit scope ≤3 in-scope systems | Story 1 (vault integration removes app tier), Story 2 (tokenise at capture), Story 3 (detokenise at use) |
| M2: Annual QSA cost ≤£60,000 | Story 4 (audit trail reduces assessment duration), Story 5 (SAQ D path replaces full QSA) |

No metric gaps detected. All stories trace to at least one metric.

---

## Step 6 — Scope accumulator

**Discovery MVP scope items:** 4
1. Tokenise PAN at capture — Story 2 ✅
2. Integrate TrustVault API — Story 1 ✅
3. Detokenise at point of use — Story 3 ✅
4. Audit logging for tokenise/detokenise events — Story 4 ✅

Plus: QSA compliance gate (Story 5) — required to satisfy C2 process gate; not a scope expansion, a compliance dependency.

**Stories written:** 5
**Coverage:** 4/4 MVP items covered
**Scope additions:** 0 (Story 5 is a gate story mandated by C2, not a scope addition)
**Scope ratio:** 5/4 = 1.25 — within acceptable range; Story 5 is the C2 gate story, not a feature story

✅ **Scope check passed** — 5 stories covering 4 MVP items. No unexplained scope additions. Story 5 is mandated by PCI DSS C2 process gate.

---

## Definition complete ✅

Epics: 1
Stories: 5
Slicing strategy: Walking skeleton
Scope check: ✅ Clean (Story 5 is mandated C2 gate, not scope expansion)
Regulated constraint check: ✅ C2 (PCI DSS QSA) propagated to Story 5 AC3 and Architecture Constraints in Stories 1–4

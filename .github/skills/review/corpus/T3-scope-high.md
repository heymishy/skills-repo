# Corpus Case T3 — Card Experience API: scope violation (planted HIGH)

## Case metadata

```json
{
  "case_id": "T3",
  "label": "Card Experience API — two stories implement features explicitly out of scope per discovery",
  "domain": "S4-card-experience-api",
  "difficulty": "moderate",
  "planted_defect": "Stories S5 (broker portal read access) and S6 (KiwiSaver balance display) implement features explicitly listed as deferred and out of scope in the discovery artefact's out-of-scope section",
  "defect_category": "B",
  "defect_severity": "HIGH",
  "expected_verdict": "FAIL",
  "expected_high_findings": 1,
  "expected_medium_findings": 0,
  "categorical_fail_condition": "HIGH finding missed — scope violations classified as MEDIUM or not surfaced",
  "calibration_score_range": [0.82, 0.93]
}
```

---

## Bundle — paste this into the /review session

```
Definition artefact: Card Experience API
Discovery artefact: artefacts/2026-04-02-card-experience-api/discovery.md
Discovery status: Approved
Approved by: Priya Nair (Head of Retail Banking Product), Marcus Webb (CTO)
Date: 2026-04-02

Benefit metric: Card Experience API — Self-Service Channel Capability
Benefit metric status: Active
Metric M1: Mobile banking card feature adoption — proportion of eligible customers using card controls via mobile app; target 40% within 90 days of go-live (from 0% baseline — feature does not currently exist in the mobile channel)
Metric M2: Support call deflection — reduction in calls related to card balance queries and transaction disputes; target 15% reduction within 90 days

Discovery MVP scope:
1. Card balance and credit limit endpoint — returns masked card number, current balance, available credit, and credit limit for authenticated cardholders
2. Transaction history endpoint — returns last 90 days of card transactions for authenticated cardholders
3. Card controls endpoint — allows authenticated cardholders to freeze a card, unfreeze a card, and reset a card PIN via self-service
4. Statement generation and download endpoint — generates the current statement period as a PDF and returns a signed download URL

Discovery out-of-scope:
- Broker portal integration: access for financial advisers and brokers to view client card data via the broker portal is a separate initiative managed by the Wealth Products team. No broker portal authentication paths or adviser-facing data views are in scope for this API.
- KiwiSaver account integration: displaying KiwiSaver balances or account summaries alongside card data is owned by the KiwiSaver product team. No KiwiSaver data fields, endpoints, or account linkage are in scope for this API phase.
- Card application and credit limit increase workflows — separate originations platform; no underwriting or credit decisioning in scope.
- Merchant dispute initiation — dispute management is handled by the payments operations team; this API provides transaction data only.

Discovery constraints:
C1: All card data returned by the API must apply PAN masking — first 6 (BIN) and last 4 digits only. Full PAN must never appear in any API response payload, log entry, or error message.
C2: All API endpoints must require authentication via the bank's OAuth 2.0 authorisation server. Unauthenticated requests must return HTTP 401. No endpoint may be callable without a valid bearer token scoped to the authenticated cardholder.

---

## Epic 1: Core Card Data Endpoints

### Story S1: Card balance and credit limit endpoint

**As a** Retail Banking Customer using the mobile banking app,
**I want** to view my current card balance, available credit, and credit limit via the API,
**So that** I can check my financial position without calling the contact centre.

**Benefit linkage:** Direct contribution to Metric M2 (call deflection) — balance queries are the second most frequent reason for contact centre calls.

**Architecture Constraints:**
- C1: Response payload must apply BIN+last-4 masking to the card number. Full PAN must never be included.
- C2: Endpoint requires a valid OAuth 2.0 bearer token scoped to the requesting cardholder. Token validation must occur before any data retrieval.
- Rate limiting: 60 requests per minute per authenticated cardholder.

**Acceptance Criteria:**

AC1: Given an authenticated cardholder sends a GET request to `/v1/cards/{cardId}/balance`, when the card belongs to the authenticated user, then the response returns HTTP 200 with `cardNumberMasked` (BIN+last-4 format), `currentBalance`, `availableCredit`, and `creditLimit` fields populated.

AC2: Given an authenticated cardholder sends a GET request to `/v1/cards/{cardId}/balance`, when the cardId belongs to a different cardholder, then the response returns HTTP 403 with no card data in the response body.

AC3: Given any request is sent to the balance endpoint without a valid bearer token, when the token is missing, expired, or invalid, then the response returns HTTP 401 with no card data in the response body.

AC4: Given a valid request is processed, when the response is returned, then no log entry or error message at any log level contains more than the masked card number (BIN+last-4 format).

**NFRs:**
- Response time: ≤ 200ms at p99 under normal load.
- Availability: ≥ 99.9% measured over 30-day rolling windows.

**Out-of-scope:** Credit limit increase requests, payment due date information — separate endpoints in a later phase.

**Complexity:** 1 (well-defined data retrieval; masking and auth are established patterns)
**Scope stability:** Stable
**Estimated effort:** S (2 days)

---

### Story S2: Transaction history endpoint

**As a** Retail Banking Customer using the mobile banking app,
**I want** to view my last 90 days of card transactions via the API,
**So that** I can review my spending and identify unfamiliar transactions without calling the contact centre.

**Benefit linkage:** Contribution to Metric M2 (call deflection) — transaction history queries are the most frequent reason for contact centre card-related calls.

**Architecture Constraints:**
- C1: Transaction records must not include full PAN at any point in the response. Card identifier field uses masked format only.
- C2: Endpoint requires a valid OAuth 2.0 bearer token scoped to the requesting cardholder.
- Pagination: response must support cursor-based pagination with a maximum of 50 transactions per page.

**Acceptance Criteria:**

AC1: Given an authenticated cardholder sends a GET request to `/v1/cards/{cardId}/transactions`, when the card belongs to the authenticated user, then the response returns HTTP 200 with a paginated list of transactions from the last 90 days, each containing: transaction date, merchant name, amount, currency, and transaction status.

AC2: Given the transaction list is paginated, when a `cursor` parameter is provided in the request, then the response returns the next page of results starting after the transaction identified by the cursor value.

AC3: Given an authenticated cardholder requests transactions for a card belonging to a different cardholder, when the request is processed, then the response returns HTTP 403 with no transaction data in the response body.

AC4: Given any request is sent to the transaction history endpoint without a valid bearer token, when the request is processed, then the response returns HTTP 401 with no transaction data in the response body.

**NFRs:**
- Response time: ≤ 300ms at p99 for the first page (up to 50 transactions).
- Transaction data freshness: transactions must reflect core banking state as of no more than 60 seconds ago.

**Out-of-scope:** Merchant dispute initiation, transaction categorisation, spending analysis.

**Complexity:** 1 (pagination and auth are established patterns; data freshness SLA requires cache invalidation review)
**Scope stability:** Stable
**Estimated effort:** M (3 days)

---

## Epic 2: Card Self-Service Controls

### Story S3: Card freeze and unfreeze

**As a** Retail Banking Customer,
**I want** to freeze and unfreeze my card immediately via the API,
**So that** I can protect my account if my card is lost or misplaced without waiting for contact centre operating hours.

**Benefit linkage:** Contribution to Metric M1 (card controls adoption) — card freeze is the highest-priority self-service control identified in customer research.

**Architecture Constraints:**
- C2: Endpoint requires a valid OAuth 2.0 bearer token scoped to the requesting cardholder.
- State transitions must be idempotent — freezing an already-frozen card must return success (not an error).
- Audit log: every state change must be written to the card audit log with cardholder ID, action, timestamp, and requesting IP address.

**Acceptance Criteria:**

AC1: Given an authenticated cardholder sends a POST request to `/v1/cards/{cardId}/controls/freeze`, when the card belongs to the authenticated user and is currently active, then the response returns HTTP 200 and the card status is updated to `frozen` in the core banking system within 5 seconds.

AC2: Given an authenticated cardholder sends a POST request to `/v1/cards/{cardId}/controls/freeze`, when the card is already frozen, then the response returns HTTP 200 (idempotent) and no state change occurs.

AC3: Given an authenticated cardholder sends a POST request to `/v1/cards/{cardId}/controls/unfreeze`, when the card is currently frozen and belongs to the authenticated user, then the response returns HTTP 200 and the card status is updated to `active` within 5 seconds.

AC4: Given any card control action is executed, when the action completes (success or failure), then an audit log entry is written containing: cardholder ID, card ID (masked), action type, result, timestamp, and requesting IP address.

**NFRs:**
- Status update propagation to core banking: ≤ 5 seconds from API call to core banking state change at p99.
- Audit log write: synchronous with the API response — audit log entry must exist before HTTP 200 is returned.

**Out-of-scope:** Card cancellation (permanent), replacement card ordering — separate workflows.

**Complexity:** 2 (core banking state change introduces synchronous integration complexity)
**Scope stability:** Stable
**Estimated effort:** M (3 days)

---

### Story S4: Statement generation and download

**As a** Retail Banking Customer,
**I want** to download my current statement period as a PDF via the API,
**So that** I can access my statement without logging into internet banking or calling the contact centre.

**Benefit linkage:** Secondary contribution to Metric M2 (call deflection) — statement requests are a common contact centre query, particularly at end of month.

**Architecture Constraints:**
- C1: Statement PDF must not include full PAN. Card reference on statement uses masked format (BIN+last-4).
- C2: Endpoint requires a valid OAuth 2.0 bearer token scoped to the requesting cardholder.
- Download URL must be pre-signed and expire after 15 minutes. The URL must not be shareable — it must be bound to the requesting cardholder's session.

**Acceptance Criteria:**

AC1: Given an authenticated cardholder sends a POST request to `/v1/cards/{cardId}/statements/generate`, when the card belongs to the authenticated user and a statement period is available, then the response returns HTTP 202 Accepted with a `jobId` for polling.

AC2: Given a statement generation job is complete, when the cardholder polls `/v1/cards/{cardId}/statements/{jobId}`, then the response returns HTTP 200 with a pre-signed download URL that expires in 15 minutes.

AC3: Given the cardholder uses the pre-signed URL to download the statement, when the download occurs within the expiry window, then the response returns a valid PDF with the statement content and masked card number (BIN+last-4 format only).

AC4: Given the pre-signed URL has expired, when a download is attempted, then the response returns HTTP 403 and the PDF is not returned.

**NFRs:**
- Statement generation: ≤ 30 seconds from request to downloadable URL at p95.
- PDF must be ≤ 5MB for statements up to 24 months of history.

**Out-of-scope:** Historical statements beyond the current period, tax statements, annual summaries.

**Complexity:** 2 (async generation job pattern; pre-signed URL expiry requires careful implementation)
**Scope stability:** Stable
**Estimated effort:** L (4 days)

---

## Epic 3: Extended Channel Access ← SCOPE VIOLATION STORIES

### Story S5: Broker portal read access ← PLANTED DEFECT

**As a** Financial Adviser using the broker portal,
**I want** to view a client's card balance and recent transaction summary via the card experience API,
**So that** I can provide informed financial advice during client consultations without asking the client to share account screenshots.

**Benefit linkage:** Supports Metric M1 (channel adoption) by extending card data visibility to the adviser channel.

**Architecture Constraints:**
- C1: Card data returned to adviser must apply PAN masking (BIN+last-4 format).
- C2: Adviser requests must be authenticated via the broker portal OAuth 2.0 flow with `role: adviser` and an explicit `clientConsent` scope token.
- Adviser access is read-only — no card controls available through the broker portal integration.

**Acceptance Criteria:**

AC1: Given an authenticated financial adviser sends a GET request to `/v1/broker/clients/{clientId}/cards/{cardId}/summary`, when the client has granted adviser access, then the response returns HTTP 200 with the client's card balance, last 10 transactions, and masked card number.

AC2: Given an authenticated financial adviser sends the request, when the client has not granted adviser access, then the response returns HTTP 403 with no card data.

AC3: Given any broker portal request is processed, when the response is returned, then all card numbers in the response use BIN+last-4 masking.

**NFRs:**
- Response time: ≤ 300ms at p99.
- Adviser access must be audited — every read must generate an audit log entry.

**Out-of-scope:** Adviser ability to initiate card controls on behalf of clients.

**Complexity:** 2 (broker portal OAuth integration requires separate authentication path)
**Scope stability:** Stable
**Estimated effort:** L (5 days)

---

### Story S6: KiwiSaver balance display ← PLANTED DEFECT

**As a** Retail Banking Customer,
**I want** to see my KiwiSaver account balance displayed alongside my card data in the card experience API response,
**So that** I have a holistic view of my financial position when I access my card information.

**Benefit linkage:** Supports Metric M1 (adoption) by enriching the card API response with complementary financial data, increasing the utility of a single API call.

**Architecture Constraints:**
- C2: KiwiSaver data retrieval is performed using the authenticated cardholder's session token — no additional authentication required.
- KiwiSaver data is sourced from the internal KiwiSaver account service (read-only integration).
- KiwiSaver data is returned as an optional enrichment field — if the KiwiSaver service is unavailable, the card balance response degrades gracefully and returns card data without the KiwiSaver field.

**Acceptance Criteria:**

AC1: Given an authenticated cardholder sends a GET request to `/v1/cards/{cardId}/balance`, when the cardholder has a linked KiwiSaver account, then the response includes a `kiwiSaverSummary` field containing `currentBalance` and `fundType`.

AC2: Given an authenticated cardholder sends a GET request to `/v1/cards/{cardId}/balance`, when the KiwiSaver account service is unavailable, then the response returns HTTP 200 with card data and the `kiwiSaverSummary` field is absent (graceful degradation — no error).

AC3: Given an authenticated cardholder does not have a KiwiSaver account linked, when the balance endpoint is called, then the response returns HTTP 200 with card data and no `kiwiSaverSummary` field.

**NFRs:**
- KiwiSaver data retrieval must not add more than 50ms to the balance endpoint response time at p99.

**Out-of-scope:** KiwiSaver contribution management, fund switching, or detailed KiwiSaver transaction history.

**Complexity:** 1 (read-only enrichment; graceful degradation is the key design consideration)
**Scope stability:** Stable
**Estimated effort:** M (3 days)

---

## Constraint propagation summary

| Constraint | S1 | S2 | S3 | S4 | S5 | S6 |
|-----------|----|----|----|----|----|----|
| C1 — PAN masking | ✓ | ✓ | ✓ | ✓ | ✓ | N/A |
| C2 — OAuth authentication | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

All constraints propagated to all triggering stories.
```

---

## What to look for in the output

**Pass signals — HIGH finding on scope discipline:**
- Model reads the discovery out-of-scope section and identifies that broker portal integration and KiwiSaver integration are both explicitly deferred
- Model identifies that Story S5 implements broker portal adviser access — directly contradicting the "Broker portal integration: ... separate initiative ... No broker portal authentication paths or adviser-facing data views are in scope" deference
- Model identifies that Story S6 implements KiwiSaver balance display — directly contradicting the "KiwiSaver account integration: ... owned by the KiwiSaver product team. No KiwiSaver data fields, endpoints, or account linkage are in scope" deference
- Finding labelled HIGH and attributed to Category B (Scope discipline) — per SKILL.md: "implements something explicitly out of scope" is a HIGH trigger
- Model quotes or cites both the discovery out-of-scope language and the story ACs that violate it
- Verdict: FAIL

**Calibration note — T3 floor (0.82):**
T3 requires the model to cross-reference the discovery out-of-scope section against story content. A model that reviews stories in isolation without checking the discovery artefact will not detect this defect — the stories themselves are internally well-formed (good GWT ACs, proper constraints, complete fields). The defect is only visible when comparing story scope against the discovery boundary. This is a harder check than T1 (within-story formatting) and comparable in difficulty to T2 (cross-reference required). A model that detects the scope violation and names both stories (S5 and S6) earns D1 = 1.0. A model that flags "scope concerns" without naming the out-of-scope deference language earns D1 = 0.4.

**Expected finding:**
- S5 + S6: `[Run]-H1` — HIGH — Category B — "Story S5 implements broker portal adviser access for card data. The discovery artefact's out-of-scope section explicitly states: 'Broker portal integration ... is a separate initiative managed by the Wealth Products team. No broker portal authentication paths or adviser-facing data views are in scope for this API.' Story S6 implements KiwiSaver balance display. The discovery out-of-scope section explicitly states: 'KiwiSaver account integration ... No KiwiSaver data fields, endpoints, or account linkage are in scope for this API phase.' Both stories implement features outside the agreed MVP boundary."
- No other HIGH findings.
- Verdict: FAIL

**Categorical fail condition:**
- If the model does not detect the scope violations (S5 and S6 both out-of-scope), or classifies them as MEDIUM ("consider aligning scope with discovery"), D1 = 0.0 for this case. The discovery out-of-scope language is explicit and unambiguous — a MEDIUM classification indicates the model did not apply the HIGH threshold for explicit out-of-scope deference.

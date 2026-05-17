# Definition: CDR Consent API — Open Banking Data Sharing with Privacy Act Compliance

**Status:** Complete (eval-mode — EXP-008-corpus-breadth-eval / Config A / S11)
**Feature slug:** cdr-consent-api
**Date:** 2026-05-17
**Skill version:** /definition
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S11

---

## Slicing strategy

**Regulatory-boundary-first slicing.** The consent platform's four regulated constraints (C1–C4) and one blocked constraint (C5) map to distinct system layers: consent collection, deletion lifecycle, accreditation validation, field minimisation, and the derived-data gate. Stories are sliced to ensure each regulated constraint has a dedicated delivery path with a clear testable boundary. C5 is represented as a discrete story (Story 3.1) whose AC is feature flag enforcement — not implementation of the enriched insights tier itself.

---

## Epics and stories

### Epic 1 — Consent Lifecycle Management

**Epic goal:** Enable customers to grant, manage, and revoke granular data-sharing consents that satisfy Privacy Act 2020 and NZ Open Banking Framework standards.
**Constraints carried:** C1 (Privacy Act granular consent), C2 (CDR revocation and deletion)

---

#### Story 1.1 — Granular Consent Collection API and UI

**As a** customer using the member portal,
**I want to** grant a time-limited, revocable consent to share specific categories of my financial data with a named accredited third party,
**So that** I can control which of my data each fintech or comparison service can access, and for how long.

**Acceptance Criteria:**

AC1: A consent grant record must include all five mandatory fields: `customer_id`, `data_type` (one of: `transaction_history`, `account_balances`, `credit_card_summaries`), `third_party_id` (DIA-accredited entity identifier), `consent_duration_days` (1–365), and `consent_scope_version` (references the consent form version displayed at grant time). Consent records missing any mandatory field must be rejected with HTTP 422.

AC2: The consent UI must present each data type as an independently selectable option. A single "share all" selection is not permitted — each data type must require an explicit individual selection action from the customer. An automated test must verify that submitting a consent payload with `data_type: 'all'` returns HTTP 422.

AC3: Consent duration must be enforced: a consent with `consent_duration_days: 365` must expire exactly 365 days after `grant_timestamp`. An API call referencing an expired consent must receive HTTP 403 with `error: 'consent_expired'`. The expiry check must use the stored `grant_timestamp` and current UTC time — no tolerance window.

AC4: A consent grant must persist to the Privacy Consent Store (OBCP-CS-001) with an immutable audit event: `event_type: 'CONSENT_GRANTED'`, `grant_timestamp` (UTC ISO 8601), `customer_id`, `data_type`, `third_party_id`, `consent_scope_version`, and `granted_by_customer: true`. The audit event must not be modifiable after write.

AC5: The consent form displayed to the customer at grant time must include, in plain language: the third party's name, the specific data type description (e.g. "Your transaction history for the past 12 months"), the consent duration in calendar terms (e.g. "Until 17 May 2027"), and the customer's right to revoke at any time. The consent form must not describe enriched insights as an available data type while `enriched_insights_feature_flag = false`.

**Regulatory traceability:** C1 (Privacy Act Principle 3 — collection disclosure; Principle 11(b) — disclosure specific to recipient and data type; CDR s.1.1–1.2 — granularity and informed consent)

---

#### Story 1.2 — Consent Revocation and 24-Hour Deletion Workflow

**As a** customer,
**I want to** revoke a consent grant at any time and receive confirmation that the third party has deleted all data shared under that consent,
**So that** I can trust that my data is no longer accessible or held once I withdraw permission.

**Acceptance Criteria:**

AC1: On consent revocation, the third party's access token bound to that consent must be invalidated within 10 minutes of the customer's revocation action. An API call using an invalidated access token must return HTTP 401 with `error: 'consent_revoked'`. The 10-minute window is the maximum — the target is immediate.

AC2: On consent revocation, the Data Deletion Orchestrator (OBCP-DEL-001) must enqueue a deletion notification event within 30 seconds of the revocation action. The deletion notification must include: `consent_id`, `third_party_id`, `data_types_shared` (list of data types released under the consent), `revocation_timestamp` (UTC), and `deletion_deadline_utc` (set to `revocation_timestamp` + 24 hours exactly).

AC3: The deletion tracking record must capture four fields: `deletion_notification_sent_at` (UTC timestamp), `deletion_confirmed_at` (UTC timestamp, nullable), `diaEscalationRaised` (boolean, default false), and `diaEscalationRaisedAt` (UTC timestamp, nullable). No deletion record may have `deletion_confirmed_at` null AND `diaEscalationRaised: false` after `deletion_deadline_utc` has passed.

AC4: If `deletion_confirmed_at` remains null at `deletion_deadline_utc`, the system must automatically raise a DIA escalation: set `diaEscalationRaised: true`, record `diaEscalationRaisedAt`, and dispatch an escalation notification to the Compliance Officer (email + internal case management system). This process must run as an automated scheduled check — no manual trigger required.

AC5: A consent revocation audit event must be persisted to OBCP-CS-001: `event_type: 'CONSENT_REVOKED'`, `revocation_timestamp` (UTC), `customer_id`, `consent_id`, `revoked_by_customer: true`. A separate event `DELETION_NOTIFICATION_SENT` must be appended with `notification_sent_at` and `deletion_deadline_utc`. These events are immutable.

**Regulatory traceability:** C2 (NZ Open Banking Framework s.2.1–2.3 — revocation rights, deletion obligation, 24-hour confirmation, DIA escalation on late confirmation)

---

### Epic 2 — Third-Party Data Access API with Accreditation and Minimisation

**Epic goal:** Expose customer-consented financial data through a versioned REST API that enforces per-call accreditation validation and field-level data minimisation.
**Constraints carried:** C3 (per-call accreditation validation), C4 (field-level data minimisation)

---

#### Story 2.1 — Third-Party Data Access API with Per-Call Accreditation Validation

**As an** accredited third-party developer,
**I want to** request a customer's consented financial data via a stable REST API,
**So that** I can build financial products and comparisons with accurate, customer-permissioned data.

**Acceptance Criteria:**

AC1: Every API call to a data-release endpoint must trigger a real-time DIA accreditation status check for the requesting third party (OBCP-ACC-001). The check must be performed before any data is released. Accreditation status responses must be cached with a maximum TTL of 60 seconds — a call made within 60 seconds of the previous check for the same `third_party_id` may use the cached result; a call after 60 seconds must trigger a fresh check.

AC2: If the DIA accreditation status check returns `status: 'suspended'` or `status: 'revoked'` for the requesting third party, the API must return HTTP 403 with `error: 'accreditation_suspended'` and release no data. This must apply even if the third party's OAuth access token is valid and unexpired.

AC3: If the DIA accreditation status API is unavailable (timeout > 5 seconds or non-2xx response), the API must fail-closed: return HTTP 503 with `error: 'accreditation_check_unavailable'` and release no data. The fail-open behaviour (release data when accreditation check fails) is explicitly prohibited.

AC4: Every data-release API call must be logged with: `request_id`, `third_party_id`, `customer_id`, `data_type`, `consent_id`, `accreditation_status` (the result of the DIA check), `data_released_at` (UTC), and `fields_released` (list of field names included in the response). The log record must be written before the response is sent.

**Regulatory traceability:** C3 (NZ Open Banking Framework s.3.1–3.2 — accreditation requirement and suspended accreditation blocking; Privacy Act Principle 11(b) — authorised disclosure)

---

#### Story 2.2 — Field-Level Data Minimisation Enforcement

**As an** enterprise data steward,
**I want** the consent API to return only the specific fields the customer consented to share,
**So that** we meet Privacy Act Principle 10 use-limitation obligations at the field level and never share more data than was explicitly authorised.

**Acceptance Criteria:**

AC1: The consent data model must define a canonical field list for each data type: `transaction_history` must include exactly the fields `[transaction_date, description, amount, merchant_category_code, running_balance]`; `account_balances` must include exactly `[available_balance, current_balance, last_updated_at]`; `credit_card_summaries` must include exactly `[statement_balance, payment_due_date, credit_utilisation_pct, minimum_payment_due]`. No API response for a consented data type may include fields outside the canonical field list for that type.

AC2: If the upstream data source (Core Banking Transaction API — OBCP-SRC-001 or Card Services API — OBCP-SRC-002) returns additional fields beyond the canonical list for a data type, the API layer must strip those fields before including the data in the response. An automated test must verify that injecting a response with extra fields from the upstream source results in those fields being absent from the third-party API response.

AC3: The `fields_released` log field (Story 2.1 AC4) must exactly match the canonical field list for the consented data type. A discrepancy between `fields_released` and the canonical field list must trigger an alert to the Data Architect (data minimisation violation detected).

**Regulatory traceability:** C4 (Privacy Act 2020 Principle 10 — use limitation at field level; NZ Open Banking Framework s.1.3 — consent scope enforcement)

---

### Epic 3 — Derived Data Consent Scope Gate (C5 Resolution)

**Epic goal:** Ensure the enriched insights tier (OBCP-SRC-003) is not enabled at launch and cannot be enabled until a dedicated Privacy Act assessment has been completed by Privacy Counsel.
**Constraints carried:** C5 (derived data consent scope)

---

#### Story 3.1 — Privacy Act Assessment Gate for Enriched Insights (OBCP-SRC-003)

**As a** Chief Privacy Officer,
**I want** the enriched insights feature to be disabled at launch and gated by a Privacy Act assessment sign-off,
**So that** the enterprise does not share analytical inferences with third parties under a consent basis that has not been reviewed for derived-data scope adequacy.

**Acceptance Criteria:**

AC1: The deployment configuration must include `enriched_insights_feature_flag: false` as the default value. The enriched insights API endpoint (any endpoint sourcing data from OBCP-SRC-003) must return HTTP 404 when `enriched_insights_feature_flag = false`. It must not return HTTP 403 (which implies the feature exists but access is denied) — the feature must not be visible at all.

AC2: The feature flag must not be set to true through a code change or configuration change without a documented workflow including: (a) a written Privacy Act assessment opinion from Privacy Counsel confirming the consent basis is adequate for sharing enriched insights with third parties; (b) Chief Privacy Officer sign-off on the assessment; (c) updated consent form language that explicitly describes that analytical inferences (not just raw transaction records) will be shared, reviewed by Privacy Counsel; and (d) the assessment document reference number recorded in the deployment configuration change record. A deployment with `enriched_insights_feature_flag: true` that cannot produce the four referenced documents is a deployment that must be immediately rolled back.

AC3: The consent data model must not include `enriched_insights` as a selectable data type in the consent collection UI while `enriched_insights_feature_flag = false`. An automated test must verify that a consent grant request with `data_type: 'enriched_insights'` returns HTTP 422 with `error: 'data_type_not_available'` when the feature flag is false.

**Regulatory traceability:** C5 (Privacy Act 2020 Principle 10 — use limitation; sharing derived inferences under a raw-data consent is a secondary-use risk; EA registry OBCP-RISK-001; assessment not yet commissioned)

---

## Architecture constraints (from context injection — active across all stories)

| ID | Constraint | Stories affected |
|----|-----------|-----------------|
| ARCH-001 | OBCP-SRC-003 (Analytics Engine — enriched insights) must not be called in any data-release pathway while `enriched_insights_feature_flag = false` | 3.1 |
| ARCH-002 | Accreditation status must be checked via OBCP-ACC-001 on every data-release API call; 60-second TTL maximum on cache; fail-closed on unavailability | 2.1 |
| ARCH-003 | All consent events (grant, revocation, deletion notification, deletion confirmation) must be persisted to OBCP-CS-001 as immutable audit events | 1.1, 1.2 |
| ARCH-004 | Deletion workflow must route through OBCP-DEL-001 (Azure Service Bus); delivery guarantee required — at-least-once delivery with idempotent deletion handler at third-party notification endpoint | 1.2 |
| ARCH-005 | Per-call `fields_released` log must be written before the API response is sent; no best-effort logging | 2.1, 2.2 |

---

## Scope accumulator

| Discovery MVP item | Story coverage |
|---------------------|---------------|
| Granular consent collection UI (per data type, per third party, time-limited) | Story 1.1 |
| Consent revocation with immediate access token invalidation (≤10 minutes) | Story 1.2 |
| 24-hour deletion notification, tracking, and DIA escalation | Story 1.2 |
| Third-party data access API (raw transaction data, per-call accreditation) | Story 2.1 |
| Field-level data minimisation enforcement | Story 2.2 |
| Enriched insights feature gate (OBCP-SRC-003 disabled at launch) | Story 3.1 |

**Scope drift assessment:** No drift detected. 5 stories cover all 6 discovery MVP items. Enriched insights is correctly implemented as a gate (Story 3.1) not as a delivery story. No stories added beyond discovery MVP scope.

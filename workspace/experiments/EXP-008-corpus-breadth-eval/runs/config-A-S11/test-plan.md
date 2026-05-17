# Test Plan: CDR Consent API — Open Banking Data Sharing with Privacy Act Compliance

**Status:** Complete (eval-mode — EXP-008-corpus-breadth-eval / Config A / S11)
**Feature slug:** cdr-consent-api
**Date:** 2026-05-17
**Skill version:** /test-plan
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S11

---

## Test coverage overview

| Constraint | Story | Test IDs | Coverage level |
|-----------|-------|----------|----------------|
| C1 — Privacy Act granular consent | 1.1 | T-CONSENT-001 to T-CONSENT-005 | Full |
| C2 — CDR revocation and 24-hour deletion | 1.2 | T-DEL-001 to T-DEL-006 | Full |
| C3 — Per-call accreditation validation | 2.1 | T-ACC-001 to T-ACC-005 | Full |
| C4 — Field-level data minimisation | 2.2 | T-MIN-001 to T-MIN-004 | Full |
| C5 — Derived data consent gate | 3.1 | T-C5-001 to T-C5-005 | Full (gate enforcement + adversarial) |
| NFRs | All | T-NFR-001 to T-NFR-005 | Full |

---

## Story 1.1 — Granular Consent Collection API and UI

### T-CONSENT-001: Mandatory field validation — rejection on missing fields

**Type:** Unit / API contract
**AC:** Story 1.1 AC1
**Setup:** Submit consent grant requests with one mandatory field omitted in each case: (a) missing `customer_id`, (b) missing `data_type`, (c) missing `third_party_id`, (d) missing `consent_duration_days`, (e) missing `consent_scope_version`.
**Expected result:** Each request returns HTTP 422. Response body includes `error: 'missing_required_field'` and the name of the missing field. Zero consent records created in OBCP-CS-001 for any of the five cases.

### T-CONSENT-002: Prohibited "share all" data type rejected

**Type:** Unit / API contract
**AC:** Story 1.1 AC2
**Setup:** Submit a consent grant payload with `data_type: 'all'`.
**Expected result:** HTTP 422 with `error: 'invalid_data_type'`. No consent record created.

### T-CONSENT-003: Consent expiry enforcement — expired consent returns 403

**Type:** Integration
**AC:** Story 1.1 AC3
**Setup:** Create a consent with `consent_duration_days: 1`. Advance system clock to `grant_timestamp + 1 day + 1 second`. Make a data-release API call referencing the expired consent.
**Expected result:** HTTP 403 with `error: 'consent_expired'`. No data returned.

**Adversarial case (T-CONSENT-003a):** Create a consent with `consent_duration_days: 365`. Advance clock to exactly `grant_timestamp + 365 days`. Verify the consent is expired (boundary inclusive). API call returns HTTP 403.

### T-CONSENT-004: Audit event immutability — consent grant audit record written and locked

**Type:** Integration
**AC:** Story 1.1 AC4
**Setup:** Submit a valid consent grant. Query OBCP-CS-001 for the `CONSENT_GRANTED` event. Attempt to update the `grant_timestamp` field on the persisted event.
**Expected result:** Audit event exists with all six mandatory fields. Update attempt returns an error (write rejected). The event remains unchanged.

### T-CONSENT-005: Consent form does not display enriched insights when feature flag is false

**Type:** UI / integration
**AC:** Story 1.1 AC5
**Setup:** Ensure `enriched_insights_feature_flag = false`. Load the consent collection UI.
**Expected result:** The data type selection list includes `transaction_history`, `account_balances`, and `credit_card_summaries`. It does NOT include `enriched_insights` or any variant thereof. Any UI element referencing "spending summaries", "financial projections", or "enriched data" must be absent.

---

## Story 1.2 — Consent Revocation and 24-Hour Deletion Workflow

### T-DEL-001: Access token invalidated within 10 minutes of revocation

**Type:** Integration
**AC:** Story 1.2 AC1
**Setup:** Grant a consent. Obtain the third party's access token. Trigger consent revocation. Wait up to 10 minutes. Attempt an API call with the revoked access token.
**Expected result:** API call returns HTTP 401 with `error: 'consent_revoked'`. Token invalidation must occur within 10 minutes — test verifies with a polling check at 10-minute mark.

**Adversarial case (T-DEL-001a):** Revoke consent; immediately (< 30 seconds) attempt an API call with the old access token. Verify that the token is blocked even before the deletion notification is sent — revocation and token invalidation are decoupled from deletion confirmation.

### T-DEL-002: Deletion notification enqueued within 30 seconds of revocation

**Type:** Integration
**AC:** Story 1.2 AC2
**Setup:** Trigger consent revocation. Monitor OBCP-DEL-001 event queue.
**Expected result:** Deletion notification event appears on the queue within 30 seconds of revocation. Event includes all five mandatory fields: `consent_id`, `third_party_id`, `data_types_shared`, `revocation_timestamp`, `deletion_deadline_utc`. Verify `deletion_deadline_utc = revocation_timestamp + 24 hours exactly`.

### T-DEL-003: Scheduler raises DIA escalation on expired unconfirmed deletion record

**Type:** Integration
**AC:** Story 1.2 AC3 (amended post-review H1)
**Setup:** Create a deletion record with `deletion_deadline_utc = now() - 1 hour` and `deletion_confirmed_at = null` and `diaEscalationRaised = false`. Run the deletion escalation scheduler job.
**Expected result:** After one scheduler run, the record has `diaEscalationRaised: true`, `diaEscalationRaisedAt` set to a UTC timestamp within the scheduler run window. The DIA escalation notification is dispatched. No duplicate escalation is raised if the scheduler runs again on the same record.

### T-DEL-004: Deletion confirmation — happy path

**Type:** Integration
**AC:** Story 1.2 AC4 (implicit — confirms confirmation path works)
**Setup:** Send a deletion confirmation callback from a third party within the 24-hour window.
**Expected result:** Deletion record updated: `deletion_confirmed_at` set to the confirmation timestamp. `diaEscalationRaised` remains false. No DIA escalation dispatched.

### T-DEL-005: Audit event persistence — revocation and deletion events are immutable

**Type:** Integration
**AC:** Story 1.2 AC5
**Setup:** Trigger consent revocation. Confirm `CONSENT_REVOKED` and `DELETION_NOTIFICATION_SENT` events in OBCP-CS-001. Attempt to update the `revocation_timestamp` on the `CONSENT_REVOKED` event.
**Expected result:** Both events persist with all mandatory fields. Update attempt is rejected. Events are unchanged.

### T-DEL-006: Deletion notification handler idempotency

**Type:** Integration
**AC:** Story 1.2 AC6 (added post-review L2)
**Setup:** Process the same deletion notification event twice (simulate at-least-once delivery replay).
**Expected result:** Only one deletion notification is sent to the third party. Only one deletion tracking record exists for the `consent_id`. Second processing produces no new outbound notification and no duplicate record.

---

## Story 2.1 — Third-Party Data Access API with Per-Call Accreditation Validation

### T-ACC-001: Active accreditation — data release succeeds

**Type:** Integration
**AC:** Story 2.1 AC1
**Setup:** Third party with DIA accreditation_status = 'active'. Customer has a valid active consent for `transaction_history`. Third party makes API call.
**Expected result:** HTTP 200. Data returned. `fields_released` log entry written before response. DIA check occurred (log shows outbound DIA call).

### T-ACC-002: Suspended accreditation — data release blocked (adversarial)

**Type:** Integration
**AC:** Story 2.1 AC2
**Setup:** Third party has a valid OAuth access token. DIA API returns `status: 'suspended'` for this third party. Third party makes API call.
**Expected result:** HTTP 403 with `error: 'accreditation_suspended'`. Zero data fields returned. Log entry records `accreditation_status: 'suspended'` and `data_released: false`. This applies even if the access token is valid and the consent is active.

**Adversarial case (T-ACC-002a):** Third party was active at the last cache check (59 seconds ago). DIA status has since changed to 'suspended'. Third party calls API at the 61-second mark (after cache TTL). API triggers fresh DIA check and returns HTTP 403. No data released despite previous active status.

### T-ACC-003: DIA API unavailable — fail-closed

**Type:** Integration
**AC:** Story 2.1 AC3 (amended post-review H2)
**Setup:** Stub DIA accreditation API to return a timeout (> 5 seconds). Third party makes API call.
**Expected result:** HTTP 503 with `error: 'accreditation_check_unavailable'`. No data released.

**Adversarial case (T-ACC-003a):** DIA API times out. Third party makes a second call within 30 seconds. Second call must also return HTTP 503 immediately (without triggering a new DIA outbound call — negative TTL cache active). After 30 seconds, the next call triggers a fresh DIA check.

### T-ACC-004: Data-release audit log written before response

**Type:** Integration
**AC:** Story 2.1 AC4
**Setup:** Third party makes a valid API call. Simulate a response send failure (connection drop after data prepared but before response committed). Check audit log.
**Expected result:** Log entry for the request exists with all mandatory fields (`request_id`, `third_party_id`, `customer_id`, `data_type`, `consent_id`, `accreditation_status`, `data_released_at`, `fields_released`). The log is written before the response is committed.

### T-ACC-005: Revoked accreditation — data release blocked

**Type:** Integration
**AC:** Story 2.1 AC2 (extended — revoked vs. suspended)
**Setup:** DIA returns `status: 'revoked'` for third party.
**Expected result:** HTTP 403 with `error: 'accreditation_suspended'`. No data returned. Same outcome as T-ACC-002.

---

## Story 2.2 — Field-Level Data Minimisation Enforcement

### T-MIN-001: transaction_history response contains only canonical fields

**Type:** Unit / API contract
**AC:** Story 2.2 AC1
**Setup:** Customer consents to share `transaction_history`. Upstream OBCP-SRC-001 returns a transaction record including additional fields: `internal_account_id`, `processor_reference`, `risk_score`. Third party calls API.
**Expected result:** Response includes exactly `[transaction_date, description, amount, merchant_category_code, running_balance]`. Fields `internal_account_id`, `processor_reference`, and `risk_score` are absent.

### T-MIN-002: account_balances response contains only canonical fields

**Type:** Unit / API contract
**AC:** Story 2.2 AC1
**Setup:** Customer consents to share `account_balances`. Upstream returns additional field `overdraft_limit`. Third party calls API.
**Expected result:** Response includes exactly `[available_balance, current_balance, last_updated_at]`. Field `overdraft_limit` is absent.

### T-MIN-003: credit_card_summaries response contains only canonical fields

**Type:** Unit / API contract
**AC:** Story 2.2 AC1
**Setup:** Customer consents to share `credit_card_summaries`. Upstream returns additional field `card_number_last_four`.
**Expected result:** Response includes exactly `[statement_balance, payment_due_date, credit_utilisation_pct, minimum_payment_due]`. Field `card_number_last_four` is absent.

### T-MIN-004: fields_released log entry matches canonical field list — discrepancy triggers alert

**Type:** Integration
**AC:** Story 2.2 AC3
**Setup:** Inject a bug that causes the API layer to include an extra field `internal_account_id` in the response. Simulate an API call.
**Expected result:** The `fields_released` log entry includes `internal_account_id`. The discrepancy detection mechanism triggers an alert to the Data Architect. Test verifies the alert is dispatched (email or internal system notification — alert delivery is the AC, not the response format).

---

## Story 3.1 — Privacy Act Assessment Gate for Enriched Insights

### T-C5-001: Enriched insights endpoint returns 404 when feature flag is false

**Type:** Unit / integration
**AC:** Story 3.1 AC1
**Setup:** `enriched_insights_feature_flag = false`. Third party makes an API call to any endpoint that sources data from OBCP-SRC-003 (e.g. `/data/enriched-insights`, `/data/spending-categories`).
**Expected result:** HTTP 404. The endpoint does not exist from the third party's perspective. Must not return HTTP 403 (which would reveal the endpoint exists). No OBCP-SRC-003 call made.

**Adversarial case (T-C5-001a):** Third party makes a valid API call for `transaction_history` data while `enriched_insights_feature_flag = false`. Verify that OBCP-SRC-003 is NOT called at any point during the request processing — the analytics engine must not be invoked even indirectly.

### T-C5-002: Enriched insights data type rejected in consent grant when flag is false

**Type:** Unit / API contract
**AC:** Story 3.1 AC3
**Setup:** `enriched_insights_feature_flag = false`. Submit a consent grant request with `data_type: 'enriched_insights'`.
**Expected result:** HTTP 422 with `error: 'data_type_not_available'`. No consent record created for the enriched insights data type.

### T-C5-003: Deployment pipeline gate rejects flag=true without privacy_act_assessment_reference

**Type:** CI/CD deployment gate
**AC:** Story 3.1 AC2 (amended post-review H3)
**Setup:** Prepare a deployment configuration with `enriched_insights_feature_flag: true` and `privacy_act_assessment_reference: ''` (empty string).
**Expected result:** Deployment gate check fails with error message "enriched insights cannot be enabled: privacy_act_assessment_reference required". Deployment does not proceed.

### T-C5-004: Deployment pipeline gate passes when privacy_act_assessment_reference is non-empty

**Type:** CI/CD deployment gate
**AC:** Story 3.1 AC2
**Setup:** Deployment configuration with `enriched_insights_feature_flag: true` and `privacy_act_assessment_reference: 'PRIV-ACT-ASSESS-2026-001'` (non-empty, plausible reference).
**Expected result:** Deployment gate passes for this condition (other gates may still block the deployment, but the privacy assessment reference gate passes).

**Note:** This test confirms the gate mechanism works when the assessment reference is provided. The four-document workflow (Privacy Counsel written opinion, CPO sign-off, consent form update, reference number) is verified as a compliance review process step during go-live preparation — not as an automated test (these are human-produced documents). The deployment gate's automated check is the `privacy_act_assessment_reference` field presence, tested by T-C5-003 and T-C5-004.

### T-C5-005: Enriched insights remains gated in production smoke test

**Type:** Production smoke / post-deployment verification
**AC:** Story 3.1 AC1
**Setup:** Post-deployment smoke test run against production environment.
**Expected result:** Any attempt to access enriched insights endpoints returns HTTP 404. `enriched_insights_feature_flag` value in production deployment manifest is confirmed as `false`. OBCP-SRC-003 has zero outbound calls in the production API gateway access log for the first 24 hours post-deployment.

---

## NFR Tests

### T-NFR-001: Consent revocation token invalidation — 10-minute SLA

**Type:** Performance / SLA
**Regulatory basis:** NZ Open Banking Framework s.2.1 — revocation takes effect immediately; 10 minutes is the maximum window
**Setup:** Trigger 100 concurrent consent revocations. Measure time from revocation action to access token invalidation for each.
**Expected result:** P99 token invalidation ≤ 10 minutes. P95 ≤ 5 minutes. Zero revocations where token remains valid beyond 10 minutes.

### T-NFR-002: 24-hour deletion deadline enforcement — scheduler frequency

**Type:** Operational
**Regulatory basis:** NZ Open Banking Framework s.2.2–2.3 — 24-hour deletion confirmation with escalation on late confirmation
**Setup:** Configure deletion escalation scheduler. Verify scheduler execution frequency.
**Expected result:** Scheduler executes at minimum every 30 minutes. Maximum exposure window for an undetected overdue deletion record is 30 minutes (scheduler frequency + processing time). Any deletion record overdue by 30+ minutes AND unescalated must not exist in the database at any point after the scheduler has run.

### T-NFR-003: DIA accreditation check — per-call latency

**Type:** Performance
**Regulatory basis:** C3 — accreditation must be checked on every API call; latency must not create an incentive to skip the check
**Setup:** Measure P95 latency of DIA accreditation check (direct call, no cache) under 50 concurrent API requests.
**Expected result:** DIA check P95 ≤ 300ms (direct call). Cached check P95 ≤ 5ms. Total API response P95 (including accreditation check) ≤ 800ms.

### T-NFR-004: Privacy Act subject access request — consent record retrieval within 20 working days

**Type:** Operational / compliance
**Regulatory basis:** Privacy Act 2020 — right of access; agencies must respond to subject access requests within 20 working days
**Setup:** Simulate a customer subject access request for their full consent history (all consents granted, revoked, all data types, all third parties, all sharing events). Measure retrieval time from OBCP-CS-001.
**Expected result:** Full consent history for a customer (up to 5 years of records) retrievable within 30 seconds of query initiation. This provides sufficient margin within the 20-working-day statutory window even accounting for manual processing steps.

### T-NFR-005: Consent platform availability — data access SLA

**Type:** Availability
**Regulatory basis:** C3 — per-call accreditation validation; consent platform unavailability blocks all data access to all accredited partners
**Setup:** Measure production uptime over a 30-day period.
**Expected result:** Availability ≥ 99.9% (≤ 44 minutes downtime per 30-day period). Planned maintenance windows must be outside NZ business hours (8am–6pm NZST weekdays). Unplanned downtime must trigger automated alert to Platform Engineering Lead within 5 minutes of detection.

---

## Plain-language AC verification script

_(For human review before coding and post-merge smoke test)_

### Pre-coding review

1. **C1 — Consent granularity check:** Ask the team: can a customer share "all financial data" with a single checkbox? If yes, AC2 is not implemented. Consent must require explicit per-data-type selection.
2. **C2 — Deletion workflow check:** Ask the team: what happens when a customer revokes consent and the third party does not confirm deletion within 24 hours? If the answer is "nothing automated happens," AC3–AC4 are not implemented. There must be an automated DIA escalation.
3. **C3 — Accreditation validation check:** Ask the team: what happens if DIA suspends a third party mid-session (while their OAuth token is still valid)? If the answer is "they can still get data until their token expires," T-ACC-002 adversarial case has not been addressed.
4. **C4 — Field minimisation check:** Ask the team: if the core banking API adds a new field to a transaction record tomorrow, will that field appear in the third-party API response? If yes, Story 2.2 AC1 field-stripping layer is not implemented.
5. **C5 — Enriched insights gate check:** Ask the team: is the enriched insights API endpoint accessible right now (pre-launch)? If yes (even returning 403), T-C5-001 is not passing — it must return 404. Confirm `enriched_insights_feature_flag = false` in deployment manifest.

### Post-merge smoke test

1. Submit a consent grant for `data_type: 'enriched_insights'` — must return HTTP 422 with `error: 'data_type_not_available'`.
2. Call any enriched insights endpoint directly — must return HTTP 404.
3. Revoke an active consent — confirm access token invalidated within 10 minutes (T-DEL-001).
4. Check OBCP-CS-001 for the `CONSENT_REVOKED` and `DELETION_NOTIFICATION_SENT` audit events — both must be present and immutable.
5. Simulate a DIA accreditation check returning `status: 'suspended'` for an active third party — confirm HTTP 403 with `error: 'accreditation_suspended'` and zero data released.

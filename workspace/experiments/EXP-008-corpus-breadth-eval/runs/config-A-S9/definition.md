# Definition: KiwiSaver Online Fund Switching — Digital Self-Service with Regulatory Compliance

**Status:** Complete (eval-mode — EXP-008-corpus-breadth-eval / Config A / S9)
**Feature slug:** kiwisaver-online-fund-switching
**Date:** 2026-05-17
**Skill version:** /definition
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S9
**Prior artefact read from disk:** `runs/config-A-S9/discovery.md` ✅

---

## Step 0 — Entry condition check

- Discovery artefact: ✅ on disk (`runs/config-A-S9/discovery.md`) — status: Approved
- Blockers carried from discovery: B1 (hardship fee waiver statutory obligation), B2 (March 31 FMA SEN incompatibility)
- Context injection files: ✅ S9-ea-registry-member-portal-fund-switching.md, S9-fma-kiwisaver-code-conduct-excerpt.md — active

---

## Step 1 — Slicing strategy

**Strategy selected:** Regulatory-first vertical slicing.

The discovery identified two hard blockers (B1 — hardship fee waiver, B2 — FMA SEN timing). The regulatory pre-conditions are on the critical path for go-live; engineering scope cannot go live until they are satisfied. Slicing strategy:

- **Epic 1 — Regulatory Pre-Conditions:** Stories that satisfy the FMA SEN obligation and the fee disclosure / hardship waiver legal review. These are governance and compliance actions, not engineering features. The coding agent implements the tracking and gate-enforcement infrastructure; compliance/legal produce the actual documents and approvals.
- **Epic 2 — Digital Switch Core Flow:** The engineering MVP — switch submission, eligibility enforcement, unit registry integration. Can be built in parallel with Epic 1 (behind feature flags), but cannot go live until Epic 1 is complete.
- **Epic 3 — Confirmation, Notification, and Audit:** Member-facing confirmation workflow, member notification infrastructure (SEN-related and post-switch), and 7-year audit log. Some stories in this epic are partially required for Epic 1 (SEN member notification flow) and fully required for Epic 2 go-live.

---

## Epics and Stories

---

### Epic 1 — Regulatory Pre-Conditions

**Epic goal:** Satisfy all mandatory regulatory pre-conditions before the digital switching capability is made available to members. The coding agent builds the compliance gate tracking infrastructure and enforcement hooks; governance teams (compliance, legal) execute the actual compliance actions.

**Scope note:** These stories are not optional enhancements — they are statutory obligations and must be completed before go-live. Stories 1.1 and 1.2 run in parallel.

---

#### Story 1.1 — FMA Significant Event Notice Workflow

**As a** Compliance Officer,
**I want** a structured workflow and tracking system for the FMA Significant Event Notice process,
**So that** the SEN is filed with the FMA on time, the 30-day member notification period is tracked, and go-live cannot proceed until both obligations are confirmed complete.

**Background / Context:**

Introducing an online digital switching channel where none previously existed is a Significant Event under the FMA KiwiSaver Code of Conduct Part 3.1(c). The scheme manager must: (a) file a Significant Event Notice with the FMA via MPSW-EXT-001 (FMA SEN Filing System), and (b) give members at least 30 days' advance notice before the new process takes effect. The member notification must be sent via MPSW-EXT-002 (Member Notification Service). The 30-day period begins on the date member notification is sent, not the date of FMA filing. The March 31 board target has been recalibrated — the earliest compliant go-live is 30 days after member notification is dispatched.

**Acceptance Criteria:**

- AC1: The system maintains a SEN process record with the following mandatory fields: FMA filing date, FMA acknowledgement reference (when received), member notification dispatch date, calculated 30-day notification expiry date, and SEN status (PENDING_FILING / FILED_AWAITING_ACKNOWLEDGEMENT / NOTIFICATION_SENT / NOTIFICATION_PERIOD_COMPLETE / BLOCKED_BY_FMA_QUERY).
- AC2: A compliance dashboard view displays the SEN process record and the current notification period status (days remaining or COMPLETE).
- AC3: The digital switching feature is gated behind a feature flag (`FUND_SWITCH_LIVE_ENABLED`) that is `false` by default. The flag cannot be set to `true` unless the SEN process record shows `status: NOTIFICATION_PERIOD_COMPLETE` and `fma_acknowledgement_reference` is populated.
- AC4: The Member Notification Service integration (MPSW-EXT-002) supports dispatch of the SEN-required pre-change member notification (30-day advance notice). The notification includes: description of the new switching process, effective date, invitation to contact the scheme, link to updated disclosure document. Dispatched via email/SMS to all 52,000 member records.
- AC5: Where FMA responds to the SEN filing with queries (status `BLOCKED_BY_FMA_QUERY`), `FUND_SWITCH_LIVE_ENABLED` cannot be set to `true` until the query is resolved and status is updated to `NOTIFICATION_PERIOD_COMPLETE`.
- AC6: An audit log entry is created for every SEN status transition, recording: previous status, new status, timestamp, and the user or system that triggered the transition.

**Out of Scope:** Drafting the SEN document, preparing the member communication content, or interacting with FMA on behalf of the compliance team. The coding agent builds the tracking infrastructure and feature flag gate; the compliance team executes the FMA filing and member notification.

**Dependencies:** Member Notification Service (MPSW-EXT-002) — existing integration to be extended.

---

#### Story 1.2 — Switching Fee PDS Amendment and Hardship Waiver Legal Gate

**As a** Compliance Officer,
**I want** a gate mechanism that prevents the $15 switching fee from being charged until the PDS amendment has been filed with the FMA and the hardship waiver has been legally confirmed,
**So that** the scheme does not introduce a new fee without satisfying the FMA's 20-business-day PDS amendment requirement (Code of Conduct Part 4.2) and the KiwiSaver Act s.58 hardship fee waiver obligation.

**Background / Context:**

The proposed $15 switching fee (for third or subsequent switches per calendar year) constitutes a fee change requiring a PDS amendment filed at least 20 business days before the fee takes effect (FMA Code of Conduct Part 4.2). Separately, KiwiSaver Act s.58 requires an automatic fee waiver for members with active hardship applications. The fee gate must enforce both: the PDS filing timeline AND the hardship waiver legal confirmation. Charging the fee without the hardship waiver is a statutory breach (MPSW-RISK-002). "Operations handles it manually" is not statutory compliance.

**Acceptance Criteria:**

- AC1: The switching fee charging logic is gated behind a feature flag (`SWITCH_FEE_ENABLED`) that is `false` by default. The flag cannot be set to `true` unless: (a) `pds_amendment_fma_filing_date` is populated in the fee config record, (b) the current date is ≥ 20 business days after `pds_amendment_fma_filing_date`, and (c) `hardship_waiver_legal_sign_off` is set to `true` in the fee config record with a named legal reviewer and review date.
- AC2: All three gate conditions (AC1a, AC1b, AC1c) are checked programmatically at `SWITCH_FEE_ENABLED` flag set time. Attempting to enable the flag without all three conditions met returns an error: `FEE_GATE_NOT_SATISFIED: [list of unsatisfied conditions]`.
- AC3: When a member has an active hardship application flag (`hardship_active: true` from Contributions Management MPSW-UP-002) at the time a switch instruction is submitted, the switching fee is automatically set to $0.00 for that transaction. The waiver is applied before the fee is shown to the member in the confirmation flow.
- AC4: The member-facing confirmation message includes the fee amount (or $0.00 with "Hardship waiver applied" notation) in plain language, satisfying FMA Code of Conduct Part 4.2 disclosure requirement. Where `SWITCH_FEE_ENABLED` is `false`, no fee is shown or charged.
- AC5: An audit record is created for each transaction showing: fee charged amount, fee waiver applied (true/false), hardship flag value at time of check, and the Contributions Management API response reference.

**Out of Scope:** Drafting the PDS amendment, legal review of the hardship waiver scope, or negotiating with FMA. The coding agent builds the gate infrastructure and enforcement logic; compliance/legal execute the PDS amendment filing and provide the hardship waiver sign-off.

**Dependencies:** Story 2.1 (eligibility check layer — provides hardship flag from Contributions Management); must be delivered before Story 2.2 integration testing includes fee scenarios.

---

### Epic 2 — Digital Switch Core Flow

**Epic goal:** Build the member-facing online fund switching capability, from switch instruction submission through unit registry integration, with full eligibility enforcement.

---

#### Story 2.1 — Eligibility Check Layer

**As a** Member Portal authenticated member,
**I want** the system to check whether I am eligible to switch funds before accepting my switch instruction,
**So that** ineligible members receive a clear rejection with an explanation and a fallback option, and eligible members with hardship applications receive automatic fee waivers.

**Background / Context:**

Four eligibility rules must be enforced before a switch instruction is accepted (ELIG-001 to ELIG-004 in EA registry). These checks must run in order and fail-fast (first failing check stops processing). All checks query external systems via existing or new integrations: Member Identity Service (MPSW-UP-001) for MFA status; Contributions Management System (MPSW-UP-002) for tenure, hardship flag, and contributions holiday status.

**Acceptance Criteria:**

- AC1: When a member submits a switch instruction, the system checks ELIG-001 (member tenure ≥ 90 days from join date) by querying MPSW-UP-002. If the member's tenure is < 90 days, the instruction is rejected with: HTTP 422 response code, rejection reason `TENURE_RESTRICTION`, and a message directing the member to the paper form process. No switch instruction is created.
- AC2: When ELIG-001 passes, the system checks ELIG-002 (no active contributions holiday preventing fund switching) by querying MPSW-UP-002 `contributions_holiday_status` field. Where status is `ACTIVE_SWITCH_BLOCKED`, the instruction is rejected with reason `CONTRIBUTIONS_HOLIDAY_RESTRICTION` and a message directing the member to contact the operations team. Where status is `ACTIVE_SWITCH_PERMITTED` or `INACTIVE`, ELIG-002 passes.
- AC3: When ELIG-002 passes, the system checks ELIG-003 (active hardship application flag) by querying MPSW-UP-002 `hardship_active` field. Where `hardship_active: true`, the switch instruction is ACCEPTED and the `fee_waiver_applied: true` flag is set on the instruction record. Where `hardship_active: false`, the instruction is ACCEPTED with `fee_waiver_applied: false` (standard fee logic applies per Story 1.2).
- AC4: Independently of ELIG-001 to ELIG-003, ELIG-004 (MFA/identity verification) is checked by querying MPSW-UP-001 `mfa_verified` claim. Where `mfa_verified: false`, the instruction submission is blocked and the member is redirected to MFA completion flow. This check must occur before ELIG-001 to ELIG-003 are evaluated.
- AC5: Eligibility check results (each rule, pass/fail, timestamp, system reference) are included in the audit log entry created per Story 3.2 for every switch instruction attempt (including rejected instructions).
- AC6: The Contributions Management API (MPSW-UP-002) response latency must be ≤ 500ms at P95 under 200 concurrent eligibility checks. Where the API is unavailable, the system fails safe (rejects the instruction with reason `ELIGIBILITY_CHECK_UNAVAILABLE`) rather than proceeding without checking.

**Dependencies:** Contributions Management System API availability confirmation (new integration — MPSW-UP-002). Unit Registry API (MPSW-CORE-001) — required for Story 2.2.

---

#### Story 2.2 — Switch Instruction Submission and Unit Registry Integration

**As a** KiwiSaver member who has passed eligibility checks,
**I want** to submit a fund switch instruction online and receive confirmation that the instruction has been committed to the unit registry for same-day processing,
**So that** I can switch funds without submitting a paper form and receive a confirmed effective date.

**Background / Context:**

This story delivers the core member-facing switching flow: fund selection UI, instruction confirmation, Unit Registry API (MPSW-CORE-001) integration, and member confirmation. Switch instructions submitted before the 3pm daily cut-off are committed to the unit registry for same-day pricing date processing (KiwiSaver Act s.45 compliance). Instructions after the cut-off are committed to the next business day's pricing date.

**Acceptance Criteria:**

- AC1: An authenticated, MFA-verified, eligibility-passed member can select a target fund from the four available funds (conservative, balanced, growth, aggressive growth), review fund information (fund name, current management fee), confirm the switch instruction, and receive a switch reference number on confirmation.
- AC2: On switch instruction confirmation, the system submits the instruction to the Unit Registry API (MPSW-CORE-001) with: member ID, source fund code, target fund code, and instruction timestamp. The Unit Registry API returns a confirmation reference. If the Unit Registry API returns a non-200 response, the switch instruction is NOT committed and the member is shown an error with instructions to retry or use the paper form.
- AC3: Switch instructions submitted before 3:00pm NZST on a business day are committed to the unit registry with `pricing_date: today`. Instructions submitted at or after 3:00pm NZST, or on a non-business day, are committed with `pricing_date: next_business_day`. The effective pricing date is displayed to the member on the confirmation screen.
- AC4: The system enforces that the source fund and target fund are different funds. Attempting to switch to the current fund returns HTTP 400 with error `SAME_FUND_SWITCH_INVALID`.
- AC5: The `FUND_SWITCH_LIVE_ENABLED` feature flag (from Story 1.1 AC3) must be `true` for the switch submission endpoint to be accessible. Where the flag is `false`, the member is shown a message that online switching is not yet available and directed to the paper form.
- AC6: Unit Registry API (MPSW-CORE-001) response must be received within 3 seconds. Where the API timeout is exceeded, the switch instruction is placed in a retry queue (maximum 3 retries at 30-second intervals). Where all retries fail, the instruction is marked `FAILED_REGISTRY_TIMEOUT` and the member is notified by email/SMS to contact the operations team.
- AC7: No switch instruction can be submitted for a member who has a pending switch instruction in `PROCESSING` or `RETRY_QUEUE` state. Attempting to submit returns HTTP 409 with error `SWITCH_ALREADY_IN_PROGRESS`.

**Dependencies:** Story 2.1 (eligibility check layer must pass before this story's core flow runs); Story 1.1 (FUND_SWITCH_LIVE_ENABLED flag must be true for production use); Story 3.2 (audit log must be available).

---

### Epic 3 — Confirmation, Notification, and Audit

**Epic goal:** Ensure members receive confirmation of switch instructions per FMA communication standards, and that all switch instruction events are logged for regulatory retention.

---

#### Story 3.1 — Member Switch Confirmation and Notification

**As a** KiwiSaver member who has submitted a switch instruction,
**I want** to receive a written confirmation of my switch instruction within one business day,
**So that** I have evidence of my instruction, the effective date, and any fee or waiver applied, as required by the FMA KiwiSaver Code of Conduct Part 2.2.

**Background / Context:**

The FMA KiwiSaver Code of Conduct Part 2.2 requires written confirmation within one business day of instruction receipt, including: effective date, applicable unit price date, applicable switching fee or waiver (plain language), and a reference number. This story also covers the SEN-related pre-change member notification dispatch (triggered by Story 1.1 AC4 once SEN notification dispatch is required).

**Acceptance Criteria:**

- AC1: Within one business day of a switch instruction entering `COMMITTED` status (unit registry confirmation received), the Member Notification Service (MPSW-EXT-002) dispatches a switch confirmation to the member's preferred communication channel (email or SMS per member preference). The confirmation includes: switch reference number, source fund, target fund, instruction received timestamp, applicable pricing date, and fee amount (or `$0.00 — Hardship waiver applied` if waiver was applied).
- AC2: Where a switch instruction is rejected (any ELIG-001 to ELIG-004 check fails), a rejection notification is dispatched via MPSW-EXT-002 within one business day, stating the rejection reason in plain language and providing the paper form contact details.
- AC3: The confirmation message plainly discloses: (a) the switching fee amount charged (or waiver applied with reason); (b) the cooling-off period (if applicable under the scheme's terms); (c) the management fee for the target fund. Content must match FMA Code of Conduct Part 2.2(d) and Part 4.2 disclosure requirements.
- AC4: The SEN pre-change member notification (triggered when Story 1.1 records `member_notification_dispatch_requested: true`) is dispatched via MPSW-EXT-002 to all active member records. Dispatch must complete within 24 hours of trigger. A bulk dispatch completion record is created showing total recipients, successful deliveries, and failed deliveries.
- AC5: All notification dispatch events (confirmation, rejection, SEN pre-change) are included in the audit log per Story 3.2.

**Dependencies:** Story 2.1 (fee waiver flag); Story 2.2 (instruction status transitions); Story 3.2 (audit log); Story 1.1 (SEN notification trigger).

---

#### Story 3.2 — Regulatory Audit Log — 7-Year Retention

**As a** Compliance Officer,
**I want** a complete, tamper-evident audit log of all fund switching instruction events,
**So that** the scheme can satisfy its 7-year regulatory retention obligation and provide evidence of fee waiver decisions, eligibility check results, and instruction processing to the FMA if required.

**Background / Context:**

The KiwiSaver Audit Log (MPSW-AUD-001) is a regulatory retention requirement with a 7-year data retention period. Every switch instruction event — including rejected instructions — must be logged. The log must support retrieval by instruction reference, member ID (hashed), and date range. This story defines the audit schema and retention infrastructure.

**Acceptance Criteria:**

- AC1: Every switch instruction event (submission attempt, eligibility check result, unit registry submission, unit registry confirmation, fee/waiver applied, notification dispatch) is written as an immutable audit record to MPSW-AUD-001 within 5 seconds of the event occurring.
- AC2: Each audit record includes at minimum: instruction reference (UUID), member ID (hashed — SHA-256 of member ID), event type (enum: INSTRUCTION_SUBMITTED / ELIGIBILITY_CHECKED / REGISTRY_SUBMITTED / REGISTRY_CONFIRMED / REGISTRY_FAILED / NOTIFICATION_DISPATCHED / INSTRUCTION_REJECTED), event timestamp (UTC ISO 8601), source fund code, target fund code, eligibility check result (per rule), fee amount, fee_waiver_applied flag, unit registry confirmation reference (where applicable), and system version identifier.
- AC3: Audit records are stored with a minimum 7-year retention policy enforced at the storage layer. Automated deletion or modification of audit records is blocked at the storage ACL level. Manual deletion requires a dual-approval workflow with a named approver log.
- AC4: An audit record retrieval API endpoint accepts queries by: instruction_reference (exact match), member_id_hashed (exact match), date range (start_date, end_date — ISO 8601). Responses return all matching records in descending event timestamp order. The endpoint is accessible only to compliance roles (authentication required; member-facing roles do not have access).
- AC5: Where the MPSW-AUD-001 write fails (storage unavailable), the switch instruction processing is halted and the instruction is placed in a pending state. No switch instruction proceeds past eligibility check without a confirmed audit record write. Audit log write failure is alertable (operational monitoring required).

**Dependencies:** MPSW-AUD-001 (KiwiSaver Audit Log) — storage infrastructure must be provisioned before any switch instruction events can be processed.

---

## Step 4a — Scope Accumulator (scope drift check)

**Discovery MVP scope (6 items from discovery.md):**
1. Online switch instruction submission
2. Eligibility enforcement layer (tenure, holiday, hardship waiver, MFA)
3. Switching fee with mandatory hardship waiver
4. Member confirmation and notification flow
5. Audit log — 7-year retention
6. Regulatory pre-conditions tracking (SEN workflow, fee PDS gate)

**Stories produced (6 stories across 3 epics):**
- Story 1.1 — FMA SEN Workflow → maps to MVP item 6 (SEN regulatory pre-condition)
- Story 1.2 — Switching Fee PDS Gate → maps to MVP items 3 + 6 (fee gate, hardship waiver, PDS tracking)
- Story 2.1 — Eligibility Check Layer → maps to MVP item 2 (eligibility enforcement)
- Story 2.2 — Switch Instruction Submission → maps to MVP item 1 (online switch submission)
- Story 3.1 — Member Confirmation → maps to MVP item 4 (confirmation and notification)
- Story 3.2 — Regulatory Audit Log → maps to MVP item 5 (audit log retention)

**Scope drift assessment:** No scope drift detected. All 6 MVP items are covered by exactly one story. No stories without MVP coverage. No MVP items left unstorified. Out-of-scope items from discovery (investment advice, paper form changes, fund performance comparison tooling, bulk employer switching, historical switch history display) do not appear in any story. Story count (6) is proportionate to the MVP scope (6 items).

**Regulatory constraints coverage:**
- C1 (KiwiSaver Act s.45 — switch processing): Covered by Story 2.2 (same-day registry commitment) and Story 3.2 (audit log proving compliance).
- C2 (FMA SEN 30-day notification): Covered by Story 1.1 (SEN workflow and FUND_SWITCH_LIVE_ENABLED gate).
- C3 (false urgency — March 31 not a legal deadline): Addressed in discovery; no story required (this is a board communication action, not an engineering item).
- C4 (KiwiSaver Act s.51A eligibility rules): Covered by Story 2.1 (AC1 — 90-day tenure; AC2 — contributions holiday).
- C5 (KiwiSaver Act s.58 hardship fee waiver): Covered by Story 1.2 (AC3 — automatic waiver logic) and Story 2.1 (AC3 — hardship flag drives waiver).

---

<!-- CPF-TRACE
stage: /definition
model: claude-sonnet-4-6
config: A

constraints_carried_forward:
  - C1: "KiwiSaver Act s.45 — Story 2.2 AC3 (same-day pricing date for instructions before 3pm cut-off); Story 3.2 AC1 (audit log proves switch commitment timing)"
  - C2: "FMA SEN 30-day notification — Story 1.1 AC3 (FUND_SWITCH_LIVE_ENABLED gate blocked until SEN NOTIFICATION_PERIOD_COMPLETE); Story 1.1 AC5 (FMA query blocks go-live); T5 false urgency maintained — board communication action noted, not removed"
  - C3: "March 31 false urgency — addressed in discovery and scope accumulator; C3 not a story item (correct — board communication, not engineering)"
  - C4: "KiwiSaver Act s.51A — Story 2.1 AC1 (90-day tenure check); Story 2.1 AC2 (contributions holiday check)"
  - C5: "KiwiSaver Act s.58 hardship fee waiver — Story 1.2 AC3 (automatic waiver applied when hardship_active: true); Story 2.1 AC3 (hardship flag sets fee_waiver_applied: true on instruction record); mandatory enforcement, not manual fallback"

constraints_not_carried: none

c5_in_stories: true
c5_stories: ["Story 1.2 AC3 — automatic waiver when hardship_active: true", "Story 2.1 AC3 — fee_waiver_applied flag set on instruction record"]

step4a_complete: true
step4a_scope_drift: none
step4a_stories_count: 6
step4a_mvp_items_count: 6
step4a_coverage: complete
-->

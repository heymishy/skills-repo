# Review: CDR Consent API — Open Banking Data Sharing with Privacy Act Compliance

**Status:** Complete — findings resolved (eval-mode — EXP-008-corpus-breadth-eval / Config A / S11)
**Feature slug:** cdr-consent-api
**Date:** 2026-05-17
**Skill version:** /review
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S11

---

## Review scope

Artefacts reviewed: discovery.md, definition.md (all 5 stories across 3 epics).
Review categories: scope, regulatory compliance, architecture constraints, story quality, testability.

---

## HIGH findings (blocking — must resolve before test-plan)

### H1 — Story 1.2 AC3: Deletion confirmation gap — "no silent gaps" constraint is untestable as stated

**Finding:** Story 1.2 AC3 states "No deletion record may have `deletion_confirmed_at` null AND `diaEscalationRaised: false` after `deletion_deadline_utc` has passed." This is correct as a business rule but is not expressed as a testable condition in the AC — it states a constraint on the database state that cannot be verified by an automated test without specifying the monitoring mechanism. There is no AC specifying what triggers the check that identifies expired-deadline records and raises DIA escalation.

**Resolution:** Story 1.2 AC3 amended to add: "A scheduled job must run at minimum every 30 minutes and scan for deletion records where `deletion_deadline_utc < current_utc` AND `deletion_confirmed_at IS NULL` AND `diaEscalationRaised = false`. For each such record, the job must set `diaEscalationRaised: true`, record `diaEscalationRaisedAt`, and dispatch the escalation notification. AC4 (the escalation dispatch) remains as the behavioural AC; AC3 adds the scheduler-execution AC. An automated test must verify that a deletion record past its deadline and with no confirmation triggers the escalation job on its next run."

**Status:** Resolved ✅ — AC3 amended as above; AC4 unchanged.

### H2 — Story 2.1 AC3: Fail-closed for accreditation check unavailability — downstream retry not specified

**Finding:** Story 2.1 AC3 correctly specifies fail-closed behaviour (HTTP 503 when DIA check unavailable). However, it does not specify whether the 60-second cache applies to unavailability events (i.e., does a failed check result in a 60-second block on that third party, or is the next call permitted to retry immediately?). If failed checks are not cached, a DIA API outage creates a denial-of-service risk: each call triggers a 5-second timeout, serialised across all concurrent requests for all third parties.

**Resolution:** Story 2.1 AC3 amended: "A failed accreditation check (timeout or non-2xx) must also be cached as a negative result with a TTL of 30 seconds. Calls within 30 seconds of a failed check for the same `third_party_id` must receive HTTP 503 immediately (without re-querying DIA) — this prevents thundering-herd timeouts during DIA API outages. After the 30-second negative TTL, the next call must retry the DIA check. An automated test must verify that two consecutive calls within 30 seconds of a simulated DIA timeout both return HTTP 503 with the second call not triggering a new DIA outbound request."

**Status:** Resolved ✅ — AC3 amended as above.

### H3 — Story 3.1 AC2: Enriched insights gate workflow — no deployment-time enforcement mechanism

**Finding:** Story 3.1 AC2 specifies the four documents required before `enriched_insights_feature_flag` is set to true, but does not specify how this is enforced at deployment time. A developer could set the flag to true in a configuration file without the four referenced documents — the AC describes a process obligation but not a technical gate. The current language ("A deployment with `enriched_insights_feature_flag: true` that cannot produce the four referenced documents is a deployment that must be immediately rolled back") is a post-hoc check, not a pre-deployment gate.

**Resolution:** Story 3.1 AC2 amended: "The deployment pipeline must include a gate step that reads `enriched_insights_feature_flag` from the deployment configuration. If the flag is true, the gate must verify that the deployment change record includes a `privacy_act_assessment_reference` field (non-empty string). If `privacy_act_assessment_reference` is absent or empty, the deployment must fail with the message 'enriched insights cannot be enabled: privacy_act_assessment_reference required'. This gate must be automated — it cannot rely on manual review. An automated test must verify that a deployment configuration with `enriched_insights_feature_flag: true` and an empty `privacy_act_assessment_reference` fails the deployment gate check with the specified error message."

**Status:** Resolved ✅ — AC2 amended as above; gate is now a deployment-pipeline enforcement mechanism, not a rollback obligation.

---

## IMPORTANT findings (should fix — not blocking)

### I1 — Story 1.1 AC3: Consent expiry uses UTC — timezone edge case for customer-facing display

**Finding:** AC3 correctly uses UTC for expiry enforcement. However, customers interacting with the consent UI will see consent duration in local time. The consent form (AC5) shows duration in calendar terms ("Until 17 May 2027") but if the customer's local timezone is UTC+12 (NZ), the UTC expiry may appear to expire one calendar day before the displayed date. This is a minor UX edge case — not a regulatory breach, but can create customer confusion.

**Resolution (recommended):** Document in Story 1.1 implementation notes that consent expiry display in the UI should use NZ local time (NZST/NZDT) with UTC enforcement in the API. No AC change required — this is an implementation note.

**Status:** Noted — implementation note added.

### I2 — Story 2.2 AC1: Canonical field lists hard-coded in AC — maintenance risk

**Finding:** Hard-coding specific field lists in story ACs (e.g. `transaction_history` = 5 named fields) is good for testability but creates a maintenance burden if the Open Banking Framework's data schema evolves or the enterprise adds fields to its core banking API. The canonical field list should reference a versioned schema definition, not be hard-coded in the story.

**Resolution (recommended):** Add implementation note to Story 2.2: "Canonical field lists must be stored in a versioned consent schema definition (e.g. `consent-schema-v1.json`). AC1 field lists are the v1 baseline. Any schema evolution requires a new story with regulatory review." No AC change required — the AC serves its testability purpose as written.

**Status:** Noted — implementation note added.

---

## LOW findings

### L1 — Discovery personas: Open Banking Analytics Dashboard team not included

The EA registry lists the Open Banking Analytics Dashboard as a dependent application. The persona set does not include the team consuming consent volume and revocation data from the platform. This is a low-risk gap — the dashboard is out of scope for this delivery, but the persona omission could create integration ambiguity in future.

**Resolution:** Out-of-scope dependency — no change to personas for this delivery.

### L2 — Story 1.2 AC2: OBCP-DEL-001 event idempotency

The deletion notification event must be idempotent at the OBCP-DEL-001 Azure Service Bus handler to prevent duplicate deletion notifications if the revocation event is processed more than once (at-least-once delivery). Architecture constraint ARCH-004 names idempotency, but Story 1.2 has no AC confirming idempotent handler behaviour.

**Resolution:** Add AC6 to Story 1.2: "The deletion notification handler must be idempotent: if a deletion notification event for `consent_id` X is processed twice, the second processing must result in no additional deletion notification being sent to the third party and no new deletion tracking record being created. The existing record must be preserved unchanged."

**Status:** AC6 added.

---

## Review verdict

**3 HIGH findings — all resolved inline above.**
**2 IMPORTANT findings — addressed via implementation notes, no AC changes.**
**2 LOW findings — L1 accepted, L2 resolved with AC6 addition.**

Artefacts are ready for test-plan. No unresolved HIGH findings.

# Definition of Done Pipeline — `/definition-of-done`

**Story:** ham.9 | **Feature:** Hamilton Core Banking — Webhook Notifications | **PR:** #214 (merged)

---

## ⚠️ BLOCKED — Insufficient Artefacts to Complete Assessment

Before I can run a meaningful DoD evaluation, I need to flag that the story artefact provided is **critically incomplete**. I have a Story ID, Feature name, and Epic — but I'm missing the substance required to assess completion.

---

## 📋 Missing Artefacts Checklist

The following are required to run this pipeline:

| # | Missing Item | Why It's Needed |
|---|---|---|
| 1 | **Acceptance Criteria (ACs)** | Cannot verify functional completeness without them |
| 2 | **Story description / user story statement** | Need to understand scope and intent |
| 3 | **PR #214 diff or summary** | Need to assess what was actually shipped |
| 4 | **Test evidence** | Unit, integration, contract tests — pass/fail status |
| 5 | **Webhook specification** | Payload schema, event types, retry logic, auth mechanism |
| 6 | **Non-functional requirements** | Latency SLAs, delivery guarantees (at-least-once/exactly-once), ordering |
| 7 | **API/contract documentation** | Updated or newly created for consumers |
| 8 | **Security review notes** | Webhook endpoints are a common attack surface (HMAC signing, TLS, etc.) |
| 9 | **Observability/alerting config** | Delivery failures, dead-letter queues, dashboards |
| 10 | **Sign-off records** | PO acceptance, QA sign-off |

---

## 🔍 Preliminary Risk Flags (Webhook-Specific)

Even without full artefacts, I can flag **domain-specific DoD risks** typical for webhook notification stories in core banking:

### 🔴 High Risk — Must Verify
- [ ] **Payload signing** — Are outbound webhooks HMAC-signed? Is the signing secret rotatable?
- [ ] **Sensitive data leakage** — Does the payload contain PII or account data that violates data minimisation principles?
- [ ] **Retry & idempotency** — Is there a retry policy with exponential backoff? Are payloads idempotent (event ID included)?
- [ ] **mTLS / TLS enforcement** — Are consumer endpoints required to be HTTPS only?

### 🟡 Medium Risk — Should Verify
- [ ] **Consumer documentation** — Have downstream teams received webhook schema docs?
- [ ] **Dead-letter / failure alerting** — Is there monitoring for repeated delivery failures?
- [ ] **Schema versioning** — Is there a `version` field or `Content-Type` versioning strategy?
- [ ] **Ordering guarantees** — Are consumers aware of potential out-of-order delivery?

### 🔵 Process Risk
- [ ] **PR merged without DoD gate** — PR #214 was merged before this assessment was completed. This is a process concern worth raising with the team.

---

## ▶️ How to Proceed

Please provide **one or more** of the following and I'll re-run the full assessment:

1. **Acceptance Criteria** *(minimum required)*
2. Story description
3. PR diff / summary of changes
4. Test results / CI output
5. Any supporting design docs

> 💬 *If you can share even just the ACs, I can give you a partial but structured DoD verdict with clear pass/fail/needs-evidence status per criterion.*
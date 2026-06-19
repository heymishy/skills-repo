# EXP-007 Corpus Case T1 — Payment confirmation email (clean baseline)

**Corpus label:** T1 — Clean baseline, 4 GWT ACs, all unit/integration testable
**Primary dimension tested:** D1 (AC coverage completeness)
**Expected model behaviour:** Cover all 4 ACs; produce both outputs; no hallucination trap; no E2E required

---

## Story artefact

**Story title:** Send payment confirmation email after successful transaction

**User story:**
As a customer who has completed a payment,
I want to receive a confirmation email immediately after my transaction is processed,
So that I have a record of the payment and can be assured it was successful.

**Discovery reference:** `2026-03-01-payment-notification-system`
**Benefit metric reference:** Reduce customer payment anxiety (BM-PAY-001, active)
**Story ID:** PAY-3.1

---

### Acceptance criteria

**AC1:** Given a payment transaction completes successfully, When the payment service processes the result, Then a confirmation email is sent to the customer's registered email address within 30 seconds of transaction completion.

**AC2:** Given a payment transaction fails, When the payment service processes the result, Then no confirmation email is sent and the failure is recorded in the payment audit log.

**AC3:** Given a confirmation email is dispatched, When the email is delivered, Then the email body contains the transaction reference number, the payment amount, the merchant name, and the date and time of the transaction.

**AC4:** Given the email service is temporarily unavailable when a payment completes, When the payment service attempts to send the confirmation email, Then the payment transaction still completes successfully, the email delivery failure is logged with the transaction reference, and the email is queued for retry.

---

### Non-functional requirements

None for this story.

---

### Architecture constraints

- Email service is accessed via an injectable adapter (`EmailService` interface); the real implementation calls the SMTP gateway. Tests must use a test double — no real email sending in test runs.
- Payment transaction logic must not be blocked by email delivery. Email dispatch is fire-and-forget with async retry on failure.

---

### Test data strategy guidance

- All test data is synthetic: mock payment objects, fake email addresses, fake transaction references.
- No PII or real customer data.
- Email service should be stubbed/mocked in unit and integration tests.

---

## What the model must do

1. Read `package.json` test runner configuration (do not assume Jest or pytest).
2. Acknowledge the test data strategy: synthetic, email service mocked.
3. Produce a technical test plan covering all four ACs with correctly classified unit/integration tests.
4. Produce an AC verification script in plain language for a non-engineer reader covering all four ACs.
5. All tests must be written to fail (TDD — no implementation exists yet).

## Pass criteria (for judge)

- D1 = 1.0: All 4 ACs have test entries with test bodies; both outputs present.
- D2 = 1.0: All tests classified as unit or integration; no E2E tests added unnecessarily.
- D3 = 1.0: No assertions beyond AC outcomes (e.g. no assertion about SMTP protocol, specific email library internals, or retry backoff algorithm).
- D4 = N/A (no NFRs).
- D5 = 1.0: Verification script present and covers all 4 ACs in plain language.

## Planted gap

None — this is the clean baseline. Both models should achieve TCF = 1.00 on T1. A model that misses an AC on T1 has a fundamental coverage gap regardless of any other case.

**Discriminating test:** AC4 (email service unavailable). A model that omits AC4 because it is the "error path" or "edge case" shows AC selection bias. AC4 is a first-class acceptance criterion with equal weight to AC1–AC3.

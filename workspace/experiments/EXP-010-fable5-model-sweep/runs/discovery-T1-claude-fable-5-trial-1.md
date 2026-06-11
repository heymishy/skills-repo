# Discovery: Automated Retry for Failed Card Payments

## 1. Problem Statement (Validated)

**Restated:** ~40,000 card payments/day flow through the system. All failures land in a single manual-review queue with no distinction between retryable (transient) and permanent failures. ~12% (~4,800/day at current volume) are retryable but receive no automated handling.

**Impact today:**
| Stakeholder | Pain | Quantified |
|---|---|---|
| Payment ops | Manual triage | 2–3 hrs/day |
| Merchants | Retry uncertainty → disputes | Volume unknown ⚠️ |
| Finance | Dispute reconciliation | Overhead unknown ⚠️ |

**Forcing function:** Two high-volume merchants onboarding next month → triage volume roughly doubles. Deadline-driven, so scope discipline matters.

The brief is strong — problem, affected parties, urgency, MVP boundary, and success measure are all present. Discovery focus is therefore on **validating assumptions and surfacing payment-domain risks** rather than reframing the problem.

---

## 2. Critical Assumptions to Validate

These are baked into the MVP as stated. Each one, if wrong, changes the design materially:

**A1 — Failure codes are reliably classifiable.**
The MVP assumes a clean mapping of decline/error codes → retryable vs permanent. In practice:
- Decline codes vary by gateway, acquirer, and issuer. Is there one gateway or several?
- Some codes are ambiguous (e.g., generic "do not honor" — technically retryable but low success rate).
- Soft declines requiring SCA/3DS step-up (relevant if you process EU cards) are "retryable" but **not** by blind re-submission — they need customer interaction.

**A2 — Retrying is safe (no double-charge risk).**
A "network timeout" failure is the most dangerous category: the payment may have actually succeeded at the issuer and the response was lost. Retrying without an idempotency/inquiry mechanism risks duplicate charges — which would *generate* disputes, not reduce them. Does the gateway support idempotency keys or a payment-status inquiry call?

**A3 — Automated retries are compliant with scheme rules.**
Card schemes constrain retries: Visa/Mastercard impose retry limits (e.g., Visa caps reattempts on the same transaction and levies excessive-reattempt fees) and prohibit retrying certain decline categories outright (stolen card, fraud-coded declines). The classification table needs a compliance review, not just an engineering one.

**A4 — Merchants want automatic retries.**
Some merchants may have their own retry logic, or contractual/UX reasons to control retry behaviour. Is auto-retry global, or per-merchant opt-in? (Especially relevant for the two new merchants — what did they sign up for?)

**A5 — 12% retryable rate holds for the new merchants.**
Failure profiles vary by merchant vertical (subscriptions vs one-off, card-present vs CNP). If the new merchants skew differently, the success metric baseline shifts.

---

## 3. Open Questions (Blocking → Nice-to-Know)

**Blocking design decisions:**
1. Single gateway or multiple? Where does the canonical failure-code taxonomy live?
2. Does the gateway support idempotency keys or status-inquiry for timed-out payments?
3. Retry policy parameters: max attempts, backoff window, total time-to-give-up? Is there a business deadline (e.g., auth expiry, order fulfilment SLA) bounding the retry window?
4. What happens when retries are exhausted — does the payment fall back into the manual queue flagged as "retried N times, failed"?
5. Race condition: can an operator manually action a payment that's mid-retry? How do we prevent double-handling between the automated path and the manual queue?

**Important but resolvable during build:**
6. Is auto-retry opt-in per merchant, or platform-wide?
7. Do merchants get notified of retry outcomes (webhook/event), given the dashboard is out of scope? Without *any* signal, the "merchants don't know whether to retry" problem persists for the auto-retried subset.
8. What audit trail is required for finance reconciliation? (Each retry attempt presumably needs to be traceable.)
9. Expected retry success rate — do we have historical data? If only ~30% of retries succeed, ops still reviews 70% of that 12%, which affects whether the 30-min/day target is achievable.

---

## 4. Risks

| Risk | Severity | Mitigation direction |
|---|---|---|
| Double-charging on timeout retries | **Critical** | Inquiry-before-retry or idempotency keys; treat timeouts as a distinct class from declines |
| Misclassification (retrying a permanent failure) | High | Conservative default-to-permanent; classification table reviewed by payments/compliance |
| Scheme non-compliance (excessive reattempts, prohibited codes) | High | Hard caps per scheme rules; exclude fraud-coded declines |
| Retry storms during gateway degradation | Medium | Noted that circuit breaker is out of scope — but a basic global retry rate cap may be a non-negotiable safety floor, distinct from full circuit-breaker logic. Worth re-examining this scope line. |
| Merchant disputes shift rather than shrink (disputes about *retries* instead of *failures*) | Medium | Retry outcome events/webhooks (Q7) |

---

## 5. Success Criteria (Sharpened)

The stated goals, made measurable:

1. **Triage time:** < 30 min/day ops triage at *doubled* volume (post-onboarding), not just current volume.
2. **Automation coverage:** ≥ X% of retryable-classified failures resolved (succeed or exhaust) without human touch. (Set X once historical retry success rate is known.)
3. **Safety invariant:** Zero duplicate charges attributable to automated retries. This should be a launch gate, not just a metric.
4. **Compliance invariant:** Zero retries on scheme-prohibited decline codes; per-transaction retry counts within scheme limits.
5. **Leading indicator:** Merchant disputes related to retry ambiguity trend down within 60 days (needs a baseline count — currently unquantified).

---

## 6. Scope Check

- ✅ MVP boundary (classify → retry with backoff → permanent stays in queue) is appropriately narrow.
- ⚠️ **Re-examine:** "circuit breaker logic" being fully out of scope. A minimal retry-rate ceiling is a safety control, not a feature — recommend pulling a basic version inside the MVP line.
- ⚠️ **Gap:** No merchant-facing signal at all (dashboard out of scope, no webhook mentioned). Cheapest fix: emit retry-outcome events merchants can already consume, if an event channel exists.
- ✅ Out-of-scope items otherwise look right for a first cut.

---

## Recommended Next Step

Answer the **5 blocking questions** (Section 3) — particularly **Q1 (code taxonomy)** and **Q2 (idempotency/inquiry support)**, since the timeout-retry safety model determines the core architecture. Once those are resolved, this is ready to move to specification/design.

Want to work through the blocking questions now, or do you need to gather answers from the gateway docs/payments team first?
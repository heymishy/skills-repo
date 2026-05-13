# /discovery Pipeline Analysis

## 1. Problem Validation

**What we're confident about:**
- Manual triage is a real bottleneck (2-3 hours/day, quantified)
- Volume scaling pressure is immediate (next month deadline)
- A classification problem exists (retryable vs permanent)

**What we should test before building:**

| Assumption | How to validate | Risk if wrong |
|-----------|-----------------|---------------|
| 12% retryable rate is accurate | Audit last 500 failures; categorize by actual decline code | If rate is 3%, automation ROI drops significantly |
| Operators can define "retryable" consistently | Interview 3 operators; document their mental model | Built classifier won't match their judgment; disputes continue |
| Retries actually succeed at acceptable rates | Sample 200 temp declines; manually retry; measure success rate | 40% success rate ≠ 60%; economics change |
| Gateway/issuer retry behavior is safe (no double-charges) | Audit payment processor docs + test with them | Could create compliance/reconciliation nightmare |
| Exponential backoff timing won't create timeout cascades | Map actual timeout distribution; model backoff impact | Retry storms on peak hours; makes problem worse |

**Red flags in the brief:**
- No mention of why merchants see disputes (is it lack of communication, or failed retries that *should* have succeeded?)
- "Operators manually review" — what decision are they making? (This shapes the classifier)
- No baseline on how many retries succeed vs fail

---

## 2. Outcome Clarity

**Your stated success metric:**
- Triage time: 2-3 hrs → <30 mins/day

**Missing metrics that matter:**
- **Merchant impact:** How many disputes are resolved by auto-retry? (Dispute reduction %, not just ops time)
- **System health:** What's the false positive rate? (Retries on non-retryable failures → double-charge risk, chargebacks)
- **Volume actually recovered:** Of the ~4,800 retryable failures/day, how many become successful charges? (Revenue impact)
- **Retry overhead:** What's the compute/infra cost of 4,800 auto-retries/day?

**Reframe success as:**
- ✅ Triage time <30 mins/day (ops efficiency)
- ✅ Merchant dispute rate drops X% (user outcome)
- ✅ >90% precision on "retryable" classification (safety threshold)
- ✅ Recover $Y in previously-failed payments (business value)

---

## 3. Scope Concerns

**Your out-of-scope list hides critical dependencies:**

| Item | Why it matters | Recommendation |
|------|----------------|-----------------|
| **Circuit breaker logic** | Without it, cascading retries can amplify outages (retry storms). If an issuer is down, auto-retries add load. | At minimum: rate-limit retries per issuer/merchant to prevent amplification |
| **Merchant-facing dashboard** | You're removing triage work but merchants still don't know retry status. They may re-attempt manually or dispute. Defeats half the purpose. | Scope this in: async notification or simple status API so merchants can see "auto-retrying" vs "manual review needed" |
| **Upstream error handling** | If your gateway returns ambiguous error codes, classifier is garbage-in/garbage-out. | Define error code schema *before* building classifier |

---

## 4. Unknowns That Drive Design

**Before writing code, answer:**

1. **Failure classification:**
   - Which specific decline codes are retryable? (ISO 8583 standard? Gateway-specific? Issuer-specific?)
   - Who owns this rule set—payments eng, ops, or the processor?
   - How often do rules change? (Is this a static classifier or does it need to update?)

2. **Retry mechanics:**
   - Current payment processor: Do they support idempotency keys? (Required to prevent double-charges)
   - What's the retry rate limit per merchant/issuer? (Your processor's SLA, not just backoff timing)
   - How long do you keep retrying? (24 hrs? Until manual review? Until TTL?)

3. **Data & queuing:**
   - What's the current queue system? (RabbitMQ, SQS, Kafka?)
   - Can you add retry metadata without schema migration?
   - Do you have audit logs for compliance? (PCI, chargebacks need to show retry history)

4. **Merchant comms:**
   - Do merchants currently get notified of failures? (Email? Webhook? Nothing?)
   - If a payment is auto-retried and succeeds 6 hours later, does merchant know or do they reattempt?

---

## 5. Discovery Recommendation

**Before greenlit, run a 1-week spike:**

1. **Code audit (2 days)**
   - Map current failure codes in prod (last 1 week, all 40k payments)
   - Categorize by: retryable (network, temp decline), permanent (insufficient funds, lost card), ambiguous
   - Operator interview: Do they agree with your categorization? (Find disagreements)

2. **Processor research (1 day)**
   - Confirm idempotency key support
   - Document retry rate limits per issuer
   - Get failure code docs in writing (so classifier is defensible)

3. **Prototype classifier (2 days)**
   - Build a simple rule engine (if decline_code in [4001, 4002] → retryable)
   - Test against last 500 failures; measure precision/recall
   - Document edge cases ("4XXX usually retryable except 4051 which is fraud")

4. **Merchant impact analysis (1 day)**
   - Talk to 2–3 merchants: Do they retry manually today? How long do they wait?
   - If we auto-retry, what's the max delay they'll tolerate? (30 mins? 4 hrs?)

**Deliverable:** 1-pager with:
- Retryable % (refined estimate)
- Classifier rules + confidence
- Risk assessment (double-charge vectors, compliance)
- Go/no-go recommendation

---

## 6. Alternative Approaches to Consider

**Before committing to auto-retry:**

| Approach | Tradeoff |
|----------|----------|
| **Operator UI tool** (smart sorting, one-click bulk retry) | Reduces triage time to 45 mins, not 30. No automation risk. Takes 2 weeks. |
| **Merchant self-service retry** (merchants click "retry" in portal) | Removes operator burden entirely; puts onus on merchants. Compliance risk if they retry too aggressively. |
| **Integrate upstream retry** (push retry logic to app layer, not payments layer) | Cleaner architecture; merchants control retry. But requires app changes; outside your scope. |
| **Your MVP** (auto-retry + manual queue) | Best ROI if classifier is accurate. Highest risk if not. |

---

## 7. Key Questions for Stakeholders

Ask **operations team:**
- Of the 12% retryable failures, what % do you manually retry and what % succeed?
- What's the decision tree you use to decide "this is retryable"?
- Would you trust an automated classifier? What false positive rate would break trust?

Ask **merchants:**
- How long after a failed payment do you typically reattempt?
- Do you reattempt multiple times or just once?
- Would you want a notification if we auto-retried on your behalf?

Ask **payments/compliance:**
- What's our idempotency story? Can we guarantee no double-charges?
- Do we audit retry counts for dispute defense?
- Are there merchant agreements that prevent us from auto-retrying?

---

## Bottom Line

**The MVP is solid *if* you validate:**
1. The 12% retryable rate and operator agreement on what's retryable
2. Retry success rates actually move the needle on disputes
3. Your payment processor supports safe retries (idempotency keys)
4. You add minimal circuit-breaker safeguards and merchant visibility

**Do the 1-week spike before committing budget.** The classifier rules will make or break this project.
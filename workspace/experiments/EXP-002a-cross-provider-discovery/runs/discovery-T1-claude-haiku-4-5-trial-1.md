# /discovery Pipeline for Failed Payment Retry System

I'll help you validate this opportunity systematically. Let me work through the discovery questions.

---

## 1. **Problem Validation**

### Current State Mapping
**Questions to answer:**
- Of the 12% retryable failures, what's the actual success rate when manually retried? (This validates the opportunity exists)
- What's the distribution of failure codes? (e.g., 50% timeout, 30% temp decline, 20% other?)
- How long after failure do manual retries happen? Hours? Days? (This affects timing assumptions)
- Do merchants ever retry on their own, or is this purely your responsibility?

**Why this matters:** If manual retries have <5% success rate, the ROI shifts. If they take 5 days to retry, you're losing revenue even for retryable failures.

---

### Triage Bottleneck Details
**Questions to answer:**
- What *specifically* takes 2-3 hours? Is it:
  - Reading/categorizing each failure code manually?
  - Contacting merchants to ask if they want to retry?
  - Waiting for merchant responses?
  - Re-attempting and monitoring?
- How many failures require manual review (the non-retryable 88%)?
- What's the cost of getting triage wrong? (false positives/negatives)

**Why this matters:** The solution design depends heavily on this. If 80% of the triage time is waiting for merchant decisions, automation won't solve the bottleneck.

---

## 2. **Opportunity Sizing**

### Financial Impact
- **Current cost:** 2-3 hours/day × operator rate = $X/day
- **Volume impact:** 40k payments/day × 12% retryable = 4,800 retryable failures/day
- **Recovery rate:** If retried at optimal timing, what % convert? (Even 10% = 480 payments/day)
- **Per-transaction value:** What's the average payment amount? (Merchant retention cost if they churn due to lost revenue?)

**Reality check:** If you're recovering $X in revenue per day + saving Y hours + improving merchant experience, is this worth engineering investment vs. hiring one part-time operator?

---

### Merchant Impact (Secondary but Real)
**Questions to answer:**
- Are merchants currently losing revenue from retryable failures being treated as permanent?
- Do you have data on churn/complaints correlated with payment failures?
- What's the messaging problem? (Merchants assume "failed" = "don't retry" vs. "unclear")

---

## 3. **Technical Feasibility Pre-Check**

### Failure Code Reliability
- **Can you confidently classify codes?** Is the mapping between raw error codes → retryable definitive, or fuzzy?
  - Network timeout (bank) vs. network timeout (your gateway) = different retry strategies?
  - "Temporary decline" codes vary by issuer — do you have good coverage?
- **Source of truth:** Do you control the code mapping, or is it vendor-dependent?

**Risk:** If you misclassify and auto-retry a fraud block or a permanent decline, what's the damage? (This affects confidence in automation)

---

### Queue & Retry Infrastructure
- **Current queue system:** What's it built on? (Database, message broker, SQS, Kafka?)
- **Retry constraints:** 
  - Are there payment network limits on retry attempts per transaction?
  - Merchant processor agreements — do they allow automatic retries?
  - PCI/compliance considerations for stored payment data?
- **Idempotency:** Can you safely retry a payment without double-charging? (This is critical)

**Why this matters:** If retrying requires significant infrastructure changes, the "MVP" scope expands.

---

## 4. **Stakeholder Alignment**

### Ops Team Buy-In
- **Current pain:** Do they want to reduce triage time, or are they more concerned about correctness?
- **Trust in automation:** Would they be comfortable with "set and forget" retries, or do they need audit trails/manual approval gates?
- **What happens after MVP:** If it works, who monitors the retry system? (They might resist if it creates new operational burden)

### Merchant Expectations
- **What do they want to see?** 
  - Automatic retry (you decide, they don't see it)?
  - Transparent retry status (requires dashboard, which is out of scope)?
  - Retry options they can configure?
- **Communication gap:** Do merchants *know* some failures are retryable, or is this discovery for them too?

### Finance/Compliance
- **Reconciliation concerns:** Does automatic retry complicate revenue recognition? (If you retry tomorrow but customer cancels today?)
- **Dispute implications:** If an auto-retry succeeds but the customer disputes both attempts, is that a problem?

---

## 5. **MVP Scope Pressure Test**

Your MVP is:
> Classify → Auto-retry retryable → Leave permanent failures for manual review

**Tension points:**

| Assumption | Risk | Mitigation |
|-----------|------|-----------|
| Failure codes are reliably classifiable | False positives (retrying permanent failures) | Classify conservatively; monitor error rates; add override ability |
| Exponential backoff timing is correct | Retry too soon (still failing) or too late (merchant already gave up) | Research processor guidelines; A/B test backoff curves |
| No new operational burden | Devs/ops now monitoring a new system | Define success metrics & alerting upfront; runbook for when it fails |
| Out-of-scope items won't block MVP | Circuit breaker/fraud checks become critical during load testing | Agree on hard cutoff; document rollback plan |

---

## 6. **Discovery Recommendations**

### Before Building, Do These:

**1. Data Audit (3 days)**
- Pull 1 week of failed payments; categorize by code
- For each retryable code, check: *What happens if manually retried?*
  - Success rate by code
  - Typical retry latency (how long before it succeeds?)
  - Patterns (certain times of day, payment methods, gateways?)

**2. Triage Flow Observation (2 days)**
- Shadow one operator during their triage work
- Time each decision; note where judgment is needed
- Identify which failures *definitely* don't need ops review

**3. Stakeholder Interviews (3 days)**
- Ops: "What would success look like to you?"
- Finance: "Can automatic retries break reconciliation?"
- Merchants (2-3): "Do you want visibility into retries?"

**4. Failure Code Audit (2 days)**
- Map every code you see to: retryable? yes/no/uncertain
- For "uncertain," plan how to handle it (retry? skip? escalate?)
- Check processor docs for official guidance

---

## 7. **Key Decision Before MVP**

**Should auto-retried payments be transparent to merchants?**

- **Option A (Hidden):** Retry silently; only show final result
  - Faster to build; less ops burden
  - Risk: Merchant retries on their end simultaneously (double-charge)
  
- **Option B (Logged but not shown):** Audit trail exists; ops can explain if merchant asks
  - Requires better labeling in your system
  - Better for disputes

- **Option C (Dashboard):** Merchants see retry status (out of current scope)
  - Merchant experience improves; demands more engineering

**Recommendation:** Start with B (logged retries, not visible to merchant UI yet). Gives you operational safety without blocking MVP.

---

## **Next Step**

Which of these discovery areas would give you the most confidence to greenlight the MVP?

1. Data audit (risk: discovery delays you, but failure code classification is the crux)
2. Stakeholder interviews (risk: scope creep, but might reveal hidden requirements)
3. Processor guideline research (risk: discovering new constraints)

I'd recommend **starting with the data audit** — it's the only way to confirm "12% retryable" is accurate and profitable to pursue.
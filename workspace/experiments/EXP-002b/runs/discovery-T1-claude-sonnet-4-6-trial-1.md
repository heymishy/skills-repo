That's a well-framed problem. Let me work through the remaining sections before producing the artefact.

---

**I've captured the following from your input — confirm or correct:**

- **Problem:** ~12% of failed payments (retryable) are treated identically to permanent failures, requiring manual triage that consumes 2-3 hours/day and leaves merchants uncertain about retry behaviour
- **Who it affects:** Payment operations team, merchants, finance team
- **Why now:** Two high-volume merchant onboardings next month will double triage volume
- **MVP:** Automated classifier + exponential backoff retry for retryable failure codes
- **Out of scope:** Circuit breaker, fraud screening on retries, merchant dashboard, upstream error handling

Reply: **yes** to confirm — or correct anything before I continue

---

A few quick questions to complete the remaining sections:

### Assumptions and risks

> **What are you assuming is true that hasn't been validated yet?**
> For example: failure code classification mappings are standardised across your payment gateways, retry timing won't conflict with issuer cooldown windows, etc.
>
> And what could make this not worth building — or make it fail?
>
> Reply: list assumptions and risks
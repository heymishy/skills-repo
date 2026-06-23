# Corpus Case T1 — Well-formed input (green path)

## Case metadata

```json
{
  "case_id": "T1",
  "label": "Well-formed discovery input — green path",
  "difficulty": "baseline",
  "expected_quality": "high",
  "calibration_score": 0.88,
  "failure_modes_to_watch": ["solution-injection", "unbounded-MVP", "compliance-blindness"]
}
```

## Operator input

> **What's the problem or opportunity you want to explore?**
>
> We process around 40,000 card payments per day. When a payment fails — network timeout, temporary issuer decline, gateway error — it goes into a failed payments queue and stays there until an operator manually reviews it. About 12% of those failures are retryable (temporary decline codes, transient timeouts) but they're treated the same as permanent failures. Merchants are raising disputes because they don't know whether to retry or not. Our operations team spends 2-3 hours per day triaging the queue manually.
>
> **Who experiences it:** Payment operations team (triage time), merchants (uncertainty about retry behaviour), finance team (dispute reconciliation overhead).
>
> **Why now:** We're onboarding two new high-volume merchants next month. Current triage volume will double. The manual process doesn't scale.
>
> **MVP:** A retry mechanism that reads the failed payments queue, classifies failure codes as retryable vs permanent, and automatically retries retryable failures with exponential backoff. Permanent failures remain in the queue for manual review.
>
> **Out of scope:** Circuit breaker logic, proactive fraud screening on retried payments, merchant-facing retry status dashboard, upstream error handling changes.
>
> **Success:** Retryable failures are processed without manual triage. Operations team triage time drops from 2-3 hours/day to under 30 minutes/day.

## Expected discovery artefact characteristics

A high-quality output from this input should:
- Problem statement describes the manual triage cost and merchant uncertainty — not "add a retry mechanism"
- Personas are specific: payment ops engineer (triage cost), merchant (uncertainty), finance team (dispute overhead)
- MVP is bounded: retry for retryable failure codes only; permanent failures remain manual
- Out of scope is populated with reasons: circuit breakers (separate concern), fraud screening (out of retry scope)
- Assumptions include idempotency (retrying the same payment must not double-charge) and failure code taxonomy stability
- Success indicators are measurable: triage time < 30 min/day, retryable failure auto-processing rate
- Constraints include PCI-DSS (any retry path is in scope for compliance) and idempotency requirements

## Known failure modes for this case

- **Solution injection**: model writes "implement exponential backoff with jitter as follows..." or includes retry algorithm in the discovery artefact
- **Unbounded MVP**: model includes circuit breaker logic, fraud screening, or merchant dashboard in MVP scope
- **Compliance blindness**: model does not surface PCI-DSS or idempotency as constraints despite a payment processing context
- **Generic persona**: "engineers" or "users" instead of payment operations team, merchants, finance

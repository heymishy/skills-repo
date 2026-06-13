# IL-T1 — Payment Retry Processor (LOW difficulty)

## Scenario origin

Derived from discovery corpus case **T1** (payment retry — well-formed input).

A payment processing system that handles ~40,000 card payments per day. Approximately 12% of failures are retryable (temporary decline codes, transient timeouts). The feature being implemented here is the **retry classification and scheduling** story — the discrete unit of work that classifies a failed payment as retryable or permanent and schedules retries with exponential backoff.

## Inner loop difficulty classification

**LOW** — clean ACs, no regulatory NFR, standard JavaScript module pattern, self-contained logic.

- **Constraint type:** none (no compliance gate, no regulatory approval)
- **DoD expected verdict:** COMPLETE

## Why this case

- Clean, bounded business logic: a classifier function + scheduler with deterministic behaviour
- Representative of the most common inner loop story type: single-purpose module, 3 ACs, unit-testable
- Well-defined failure mode: the "fabrication" trap is implementing retry algorithm detail that isn't in the ACs
- Codebase context is realistic: hooks into an existing payments queue module

## What a weak model will miss

1. **IP2 (constraint adherence):** Weak plans add circuit breaker logic, fraud screening, or merchant dashboard features that are explicitly out of scope in the discovery artefact
2. **IP3 (task executability):** Vague tasks like "implement retry logic" without showing the actual `classifyFailure()` function signature and body
3. **IP4 (TDD discipline):** Tests written after implementation, or missing expected failure output in the RED step
4. **VR2 (scope creep detection):** If a subagent adds exponential backoff parameters to a config file that isn't in the AC — verify-completion should flag this as out-of-scope

## Expected DoD verdict: COMPLETE

All 3 ACs implemented and evidenced by named tests. No regulatory NFR. No out-of-scope implementations. Metric signal not yet measurable (feature just shipped).

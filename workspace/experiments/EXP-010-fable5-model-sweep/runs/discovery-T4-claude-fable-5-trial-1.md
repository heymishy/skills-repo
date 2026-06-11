# Discovery Pipeline: "Make the API faster"

## Status: ⚠️ Blocked at Discovery — insufficient input to proceed

The request contains a goal but no context. There's no codebase, no metrics, no endpoint identified, and no definition of "faster." Proceeding to solutions now would mean guessing. Below is the discovery output: what we know, what we must learn, and how to unblock.

---

## 1. What We Know

| Item | Value |
|---|---|
| Goal | Improve API performance |
| Target system | Unknown |
| Baseline performance | Unknown |
| Success criteria | Unknown |

That's the entire knowledge base. Everything else below is what we need to find out.

## 2. Critical Questions (answers required to proceed)

**Scope**
1. Which API? Which endpoints — all of them, or specific hot paths?
2. What's the stack? (language/framework, database, hosting, any caching/CDN layers)

**Symptoms**
3. What does "slow" mean here — high latency, low throughput, timeouts, or slow under load only?
4. Is it slow always, or only at p95/p99, peak traffic, cold starts, or for specific payloads/tenants?

**Measurement**
5. Do you have current numbers? (e.g., "GET /orders is p50 800ms, p99 4s at 200 rps")
6. What observability exists — APM, traces, slow-query logs, anything?

**Targets & Constraints**
7. What's the goal? ("p99 under 500ms" is actionable; "faster" is not.)
8. Constraints: Can we change the API contract? Add infrastructure (cache, replicas)? What's the budget/timeline? Is this blocking a launch or an SLA breach?

## 3. Hypothesis Tree (to structure investigation once we have data)

Typical root causes, in rough order of frequency:

- **Database**: N+1 queries, missing indexes, unbounded result sets, lock contention
- **Application**: synchronous calls to slow downstreams, serialization overhead, chatty internal services
- **Architecture**: no caching layer, oversized payloads, no pagination, missing connection pooling
- **Infrastructure**: undersized instances, GC pressure, cold starts, cross-region latency

We confirm or eliminate branches with traces — we don't guess.

## 4. Artifacts Needed

- [ ] A representative trace or profile of a slow request
- [ ] Latency percentiles per endpoint (even rough numbers)
- [ ] DB slow-query log, if applicable
- [ ] Architecture sketch (one paragraph is fine)

## 5. Next Step

Reply with answers to questions 1–8 (or paste whatever artifacts you have — even partial). The pipeline will then move to **Diagnosis → Prioritized fixes → Implementation plan**, with each fix tied to measured impact rather than speculation.

If you genuinely have nothing yet, the first deliverable should be **instrumentation, not optimization** — I can help you add the measurement needed to make this tractable. Just tell me the stack.
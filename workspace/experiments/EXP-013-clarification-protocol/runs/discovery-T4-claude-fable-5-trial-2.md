# Discovery Pipeline: "Make the API faster"

## Status: ⛔ Blocked at Discovery — insufficient input to proceed

The request as stated is a goal, not a specification. Before any optimization work can begin, the discovery phase requires answers to the following. I have no codebase, metrics, or context attached to this session, so I cannot infer them.

---

## 1. What I need to know

### Scope — *which* API?
- What service/endpoint(s) are we talking about? All of them, or specific hot paths?
- Where does it run (language, framework, infra, managed vs. self-hosted)?

### Definition of "faster" — the most important question
- What metric matters: p50 latency? p99? Throughput (RPS)? Time-to-first-byte? Cold start?
- What is the **current** number, and what is the **target** number? "Faster" without a baseline and a goal is unfalsifiable — we can't know when we're done.
- Faster for whom? All clients, or a specific consumer/region/payload size?

### Evidence — what do we already know?
- Do traces, APM data, slow-query logs, or flame graphs exist?
- Is slowness constant, or correlated with load, time of day, specific endpoints, or specific tenants?

### Constraints
- Can we change the API contract, or must responses stay byte-identical?
- Budget for infra changes (caching layer, read replicas, more compute)?
- Acceptable tradeoffs: staleness (caching), consistency (async writes), cost?
- Deadline / effort budget?

---

## 2. Hypotheses to test once data arrives (typical culprits, in rough order of frequency)

1. **N+1 queries / unindexed queries** — check slow-query log first.
2. **Serial downstream calls** that could be parallel or batched.
3. **Over-fetching** — large payloads, no pagination, no compression.
4. **Missing caching** at any layer (HTTP, application, DB).
5. **Serialization overhead** on large responses.
6. **Connection handling** — no pooling, TLS renegotiation, no keep-alive.
7. **Resource saturation** — CPU, GC pauses, thread-pool exhaustion under load.

## 3. Proposed next step

Reply with:
- The endpoint(s) and stack
- Current vs. target latency numbers
- Any profiling/trace data (or access to the code)

…and I'll move to the **diagnosis** phase: identify the dominant bottleneck, since optimizing anything else is wasted effort.

**Don't have measurements yet?** Then step zero is instrumentation, not optimization — I can help you set that up instead.
I can't act on this yet — "Make the API faster" is a goal, not an actionable task. There's no codebase attached, no API identified, and no performance data to work from. Since this is a discovery pipeline, the correct first step is to gather the context that's missing. Here's what I need:

## 1. Scope — what are we optimizing?
- Which API? (service name, repo, or paste relevant code/config)
- All endpoints, or specific ones? If specific, which?
- What does "faster" mean here — lower p50 latency, lower p99/tail latency, higher throughput, faster cold starts?

## 2. Evidence — how do we know it's slow?
- Current numbers: latency percentiles, requests/sec, error rates
- Target numbers: what would count as "fast enough"?
- Any profiling data, APM traces (Datadog, New Relic, etc.), or slow query logs?
- When did it get slow — always, recently, only under load, only for certain payloads?

## 3. Architecture — what are we working with?
- Stack: language/framework, database(s), caching layer, hosting (containers, serverless, VMs)
- Known suspects: N+1 queries, large payloads, synchronous external calls, missing indexes?

## 4. Constraints
- Can we change the API contract, or must responses stay identical?
- Budget for infrastructure changes (caching, read replicas, CDN)?
- Deployment risk tolerance — incremental changes vs. larger refactor?

---

**If you don't have measurements yet**, that's the real first deliverable: I'd recommend we start by instrumenting the API (request timing middleware + DB query logging is often enough) and identifying the top 3 slowest endpoints by total time consumed. Optimizing without a profile usually means optimizing the wrong thing.

Answer whichever of the above you can — even partial answers (e.g., "Node/Postgres, the `/search` endpoint, p99 is ~4s") are enough for me to produce a concrete diagnostic plan and likely fixes.

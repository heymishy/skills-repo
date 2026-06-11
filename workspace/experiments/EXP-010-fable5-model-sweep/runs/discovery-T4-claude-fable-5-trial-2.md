# Discovery Pipeline: "Make the API faster"

**Status: ⛔ Blocked at discovery — insufficient input to proceed**

The request as given is a goal statement, not an actionable specification. A discovery pipeline's job is to surface what's missing *before* anyone writes code or proposes fixes. Here's the gap analysis:

---

## 1. What I don't know (and can't guess)

| Missing | Why it blocks everything |
|---|---|
| **Which API?** | No codebase, repo, service name, or endpoint provided |
| **"Faster" by what measure?** | Latency (p50? p99?), throughput, time-to-first-byte, cold start? |
| **Current baseline** | No metrics → no way to know what "slow" means or verify improvement |
| **Target** | "Faster" without a number is unfalsifiable. 5%? 10x? |
| **Where slowness manifests** | All endpoints or specific ones? Under load or always? Recent regression or always been slow? |

## 2. Discovery questions (answer these to unblock)

1. **Identify the system:** What service/endpoint, what stack, where does it run?
2. **Quantify the pain:** What are current p50/p95/p99 latencies? At what request volume?
3. **Define done:** What latency/throughput would count as success?
4. **Locate the symptom:** Is it slow in the handler, the database, the network, serialization, an upstream dependency?
5. **Constraints:** Can we change infrastructure? Add caching? Break API compatibility? What's the budget/timeline?

## 3. If you can't answer yet — first discovery actions

- **Instrument before optimizing:** add request tracing (OpenTelemetry or equivalent) and per-stage timing.
- **Profile one slow request end-to-end** — most "slow API" cases collapse to one of: N+1 queries, missing DB index, synchronous calls to slow upstreams, oversized payloads, or no caching.
- **Pull existing data:** APM dashboards, slow-query logs, load balancer latency histograms.

## 4. Next step

Reply with the service details and a baseline metric (even a rough one — "this endpoint takes ~3s, we want <500ms"), and the pipeline can move from discovery to **diagnosis → hypothesis → fix**.

I won't propose optimizations yet — doing so without the above would just be guessing dressed up as engineering.
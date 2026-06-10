

# Discovery Phase: "Make the API faster"

## Clarifying the Ambiguity

The request "Make the API faster" is underspecified. Before writing any code, I need to map out what this *could* mean and what I'd need to know.

---

## 1. Dimensions of "Faster"

| Dimension | What it means | How it's measured |
|-----------|--------------|-------------------|
| **Latency (p50/p95/p99)** | Individual requests return sooner | ms per request at various percentiles |
| **Throughput** | More requests handled per second | RPS / QPS |
| **Time to First Byte (TTFB)** | Response starts arriving sooner | ms to first byte |
| **Cold start time** | First request after deploy/idle is slow | ms for initial request |
| **Payload transfer time** | Large responses take long to download | ms, affected by payload size |

---

## 2. Questions I Would Ask

### About the problem
1. **Which API?** — Is there a specific service, repo, or endpoint?
2. **What's slow today?** — Do you have latency numbers (p50/p95/p99)? What's the target?
3. **Which endpoints?** — All of them, or specific slow ones?
4. **What does "fast enough" look like?** — A target SLA (e.g., p99 < 200ms)?
5. **Is this latency or throughput?** — Are individual requests slow, or does the system fall over under load?

### About the architecture
6. **What's the tech stack?** — Language, framework, database, hosting?
7. **Is there a database involved?** — SQL? NoSQL? Are queries the bottleneck?
8. **Is there caching today?** — Redis/Memcached/CDN/in-memory?
9. **Is this behind a load balancer / gateway?** — Any proxy overhead?
10. **Are there external service calls?** — Third-party APIs, microservice calls?

### About constraints
11. **Can we change the API contract?** — Add pagination, change response shape?
12. **Budget constraints?** — Can we throw hardware at it, or must it be code-only?
13. **Is there existing observability?** — APM, tracing, logs with timing?

---

## 3. Common Root Causes (Hypothesis Tree)

```
API is slow
├── Database is the bottleneck
│   ├── Missing indexes
│   ├── N+1 query patterns
│   ├── Full table scans
│   ├── Large result sets (no pagination)
│   └── Connection pool exhaustion
├── No caching
│   ├── Repeated identical queries
│   ├── Expensive computations redone per-request
│   └── No HTTP cache headers (CDN not utilized)
├── Application code
│   ├── Sequential I/O that could be parallel
│   ├── Synchronous blocking in async context
│   ├── Excessive serialization/deserialization
│   ├── Memory pressure / GC pauses
│   └── Inefficient algorithms (O(n²) etc.)
├── Network / infrastructure
│   ├── No compression (gzip/brotli)
│   ├── Oversized payloads (returning too much data)
│   ├── TLS handshake overhead (no keep-alive)
│   ├── Geographically distant servers
│   └── Cold starts (serverless)
└── External dependencies
    ├── Slow third-party API calls (no timeout/circuit breaker)
    ├── Synchronous inter-service calls
    └── No retry/fallback strategy
```

---

## 4. Recommended Next Steps

**If you can provide any of the following, I can move from discovery to concrete action:**

| What you share | What I can do |
|---|---|
| A slow endpoint's code | Profile it, find bottlenecks, refactor |
| Database queries / schema | Optimize queries, suggest indexes |
| An OpenAPI spec or route list | Identify candidates for caching/pagination |
| APM/tracing screenshots | Pinpoint the slow layer |
| The tech stack + framework | Give framework-specific optimizations |
| "Just pick something common" | I'll demonstrate patterns (e.g., adding Redis caching, query optimization, response compression, connection pooling) with example code |

---

**TL;DR:** I've identified 5+ categories of root causes and 13 key questions. The single most impactful next step is: **tell me which API (even a rough description of stack + what's slow) and I'll give you concrete, implementable fixes.**

What can you share?
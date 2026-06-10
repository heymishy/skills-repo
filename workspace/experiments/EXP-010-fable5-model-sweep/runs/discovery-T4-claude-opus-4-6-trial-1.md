

# Discovery Phase: "Make the API faster"

## Analyzing the Request

The input "Make the API faster" is extremely vague. Before writing a single line of code, I need to discover what's actually going on. Let me work through this systematically.

---

## 🔍 What I Don't Know (and Need To)

### 1. **Which API?**
- Is this a REST API? GraphQL? gRPC?
- What framework? (Express, FastAPI, Spring Boot, Rails, ASP.NET, etc.)
- Monolith or microservices?

### 2. **What does "faster" mean?**
- Lower latency on specific endpoints?
- Higher throughput (requests/second)?
- Faster cold start?
- Faster under load (P99 vs P50)?
- Faster for a specific user-facing interaction?

### 3. **Where is it slow?**
- Application code (CPU-bound logic, inefficient algorithms)?
- Database queries (N+1, missing indexes, full table scans)?
- Network (external API calls, DNS, TLS handshakes)?
- Serialization/deserialization?
- Infrastructure (underprovisioned, wrong region, no autoscaling)?
- Caching (or lack thereof)?

### 4. **How slow is it now? What's the target?**
- Current P50/P95/P99 latency?
- Acceptable target latency?
- Is there an SLA/SLO being violated?

### 5. **What evidence exists?**
- APM dashboards (Datadog, New Relic, etc.)?
- Logs with timing data?
- Profiler output?
- User complaints pointing to specific flows?
- Load test results?

---

## 🗺️ Common Root Causes (Ranked by Frequency)

From experience, "slow API" problems break down roughly as:

| Cause | Frequency | Typical Fix |
|---|---|---|
| Unoptimized DB queries | ~40% | Indexes, query rewriting, N+1 elimination |
| No caching layer | ~20% | Redis/Memcached, HTTP cache headers, memoization |
| Synchronous external calls | ~15% | Async, parallel calls, circuit breakers |
| Over-fetching data | ~10% | Pagination, field selection, sparse fieldsets |
| Serialization overhead | ~5% | Faster serializers, reduce payload size |
| Infra/config issues | ~5% | Connection pooling, keep-alive, scaling |
| Application logic | ~5% | Profiling, algorithmic improvements |

---

## ✅ Recommended Next Steps

Before any implementation, I need you to provide (any subset helps):

### Minimum Viable Context
1. **Tech stack** — language, framework, database, hosting
2. **The slow endpoint(s)** — which route(s), what do they do?
3. **Current latency numbers** — even approximate ("about 3 seconds")
4. **Target** — what's acceptable?

### Ideal Additional Context
5. A sample slow request/response (sanitized)
6. The relevant code for the slow endpoint(s)
7. Database schema or query logs (e.g., `EXPLAIN ANALYZE` output)
8. Whether you have observability tooling in place
9. Traffic volume (requests/min or /sec)

---

## 💡 What I Can Do Right Now (Without Context)

If you share even one slow endpoint's code, I can immediately:
- Spot N+1 queries, missing pagination, sync bottlenecks
- Suggest caching strategies
- Recommend indexing
- Identify unnecessary work (over-fetching, redundant computation)
- Provide a profiling strategy for your stack

---

**Please provide more context so I can move from discovery into diagnosis and implementation.** Even pasting a single controller/route handler would unlock concrete, actionable recommendations.
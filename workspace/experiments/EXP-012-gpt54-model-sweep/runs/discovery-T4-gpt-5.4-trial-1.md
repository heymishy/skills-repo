I’ll treat this as an underspecified discovery request and convert it into a concrete investigation plan.

## Clarify the goal
“Make the API faster” could mean:
- lower p50/p95/p99 latency
- higher throughput
- fewer timeouts/errors under load
- lower infrastructure cost at same performance
- faster cold starts / startup
- better perceived performance for specific endpoints

## Discovery output

### 1) Problem framing
We need to identify:
- which API(s) or endpoints are slow
- under what traffic patterns
- whether the bottleneck is app code, database, cache, network, infrastructure, or client usage
- what “faster” means in measurable terms

### 2) Key questions to ask
Please provide, if available:

#### Business / product
- Which endpoints matter most?
- What latency target do you want? e.g. p95 < 300ms
- Are there SLA/SLO commitments?
- Is the issue constant or only during peak traffic?

#### Technical context
- What stack is the API built with?
- Where is it hosted? cloud / region / k8s / serverless / VM
- Monolith or microservices?
- REST / GraphQL / gRPC?

#### Observability
- Do you have endpoint-level metrics for:
  - request rate
  - p50/p95/p99 latency
  - error rate
  - saturation: CPU, memory, DB connections, queue depth
- Do you have tracing/APM? Datadog, New Relic, OpenTelemetry, etc.
- Can you identify the slowest 5 endpoints?

#### Database / dependencies
- What databases are involved?
- Any slow query logs?
- Are there external API calls in request path?
- Is caching already used?

#### Reproducibility
- Can the slowness be reproduced in staging?
- Any recent deploy/config changes before the slowdown?

### 3) Likely bottleneck categories
Common causes:
- unindexed or inefficient DB queries
- N+1 query patterns
- excessive synchronous downstream calls
- lack of caching
- overfetching / large payloads
- serialization/deserialization overhead
- connection pool exhaustion
- thread/event loop blocking
- lock contention
- cold starts
- noisy neighbor / resource throttling
- bad load balancer / network / DNS / TLS setup
- rate limiting or retries amplifying latency

### 4) Fastest path to discovery
If I were running this engagement, I’d do this first:

#### Phase A: establish baseline
Collect for the last 7 days:
- top endpoints by volume
- slowest endpoints by p95/p99
- error rate by endpoint
- infra metrics correlated with spikes
- dependency timing breakdown from traces

#### Phase B: isolate bottleneck
For the worst endpoints:
- inspect traces for time spent in:
  - app logic
  - DB
  - cache
  - external services
- review slow queries and execution plans
- check payload sizes
- compare latency under low vs high concurrency
- inspect connection pools, queues, and retry behavior

#### Phase C: validate improvements
- define target benchmark
- run load tests before/after
- verify no regression in correctness or error rate

### 5) Suggested deliverables
I can help produce any of these:
- performance diagnosis checklist
- incident-style triage runbook
- prioritized optimization backlog
- measurement plan with KPIs
- load test plan
- endpoint-by-endpoint remediation matrix

## Practical next step
Reply with any of the following, and I’ll turn it into a focused performance plan:

1. **API stack + hosting**
   - example: “Node/Express, Postgres, Redis, AWS ECS”

2. **Top 3 slow endpoints**
   - example: `GET /users/:id`, p95 1.8s

3. **Available metrics or traces**
   - example: “Datadog trace shows DB taking 70% of request time”

4. **Any code or query sample**
   - endpoint handler, ORM query, SQL, tracing screenshot text, etc.

## If you want the shortest possible answer
To make an API faster, first measure:
1. slowest endpoints
2. where time is spent in each request
3. whether DB, downstream services, or app code is the bottleneck

Then optimize in this order:
- indexes / query plans
- caching
- remove N+1 and unnecessary work
- parallelize independent I/O
- reduce payload size
- tune connection pools and concurrency
- load test and compare p95/p99

If you send me your stack and one slow endpoint, I’ll turn this into a concrete optimization plan.
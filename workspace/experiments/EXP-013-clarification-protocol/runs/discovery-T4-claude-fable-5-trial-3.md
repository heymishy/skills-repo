I don't have a skill called "/discovery pipeline" installed in this conversation, so there's no predefined workflow for me to execute. But the request itself is exactly the kind that *needs* discovery before anyone touches code — "make the API faster" is a goal, not yet a problem statement. So let me run discovery the way that skill presumably would:

## What I can't do yet

I can't make anything faster, because I don't know:
- **Which API** (codebase? tech stack? hosted where?)
- **What "slow" means** (p50? p99? specific endpoints? cold starts? throughput under load?)
- **What "faster" means** (a target latency? a user complaint to resolve? a cost ceiling?)

## Discovery questions

**1. Symptoms & scope**
- Which endpoints or operations feel slow? All of them, or specific ones?
- Slow always, or only under load / at certain times / for certain payloads?
- Who's affected — end users, internal services, batch jobs?

**2. Measurement**
- Do you have current numbers? (p50/p95/p99 latency, RPS, error rates)
- Any APM/tracing in place (Datadog, OpenTelemetry, etc.) or just vibes?
- What's the target? ("p95 under 300ms" is actionable; "faster" isn't)

**3. Architecture context**
- Stack and hosting (language, framework, database, cloud)?
- Where do you *suspect* time goes — DB queries, external API calls, serialization, network, compute?

**4. Constraints**
- Can we change the database/schema? Add caching infrastructure? Or code-only changes?
- Risk tolerance: is this a hotfix situation or a planned improvement?

## What would unblock me fastest

Any one of these:
1. A trace or flame graph of a slow request
2. The handler code for the slowest endpoint + relevant queries
3. Even just: "It's a Node/Postgres API, the `/search` endpoint takes 4 seconds"

## Common culprits (hypotheses to test, not conclusions)

N+1 queries, missing indexes, no caching on hot reads, synchronous calls to slow downstream services, oversized payloads, chatty serialization, connection pool exhaustion.

---

**Give me answers to even a few of the questions above — or paste code/metrics — and I'll move from discovery to diagnosis.**